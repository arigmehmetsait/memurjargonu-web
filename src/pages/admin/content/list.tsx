"use client";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Alert from "@/components/Alert";
import Link from "next/link";
import { useRouter } from "next/router";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  PDFDocument,
  PDFCategory,
  PDFSubcategory,
  PDFStatus,
  PDFListResponse,
} from "@/types/pdf";
import {
  PDF_CATEGORY_INFO,
  getCategoryDisplayName,
} from "@/constants/pdfCategories";

export default function PDFList() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PDFStatus | "all">("all");

  // URL parametrelerinden filtreleri al
  const subcategoryFilter = router.query.subcategory as PDFSubcategory;

  // Token alma fonksiyonu
  const getFreshToken = async (): Promise<string> => {
    if (!auth.currentUser) {
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, () => {
          unsub();
          resolve();
        });
      });
    }
    const token = await auth.currentUser!.getIdToken(true);
    return token;
  };

  // PDF'leri yükle
  const loadPDFs = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const idToken = await getFreshToken();

      // Query parametrelerini oluştur
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (subcategoryFilter) params.append("subcategory", subcategoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("limit", "50");
      params.append("sortBy", "updatedAt");
      params.append("sortOrder", "desc");

      const response = await fetch(`/api/admin/content/list?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data: PDFListResponse = await response.json();
        if (data.success) {
          setPdfs(data.data.pdfs);
        } else {
          setMessage(`❌ ${data.error || "PDF'ler yüklenemedi"}`);
        }
      } else {
        setMessage("❌ PDF'ler yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("PDF load error:", error);
      setMessage("❌ Bağlantı hatası oluştu");
    } finally {
      setLoading(false);
    }
  };

  // PDF durumunu değiştir
  const togglePDFStatus = async (pdf: PDFDocument) => {
    const newStatus =
      pdf.status === PDFStatus.ACTIVE ? PDFStatus.INACTIVE : PDFStatus.ACTIVE;

    try {
      const idToken = await getFreshToken();

      const response = await fetch("/api/admin/content/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          subcategory: pdf.subcategory,
          pdfId: pdf.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setMessage(
          `✅ PDF durumu ${
            newStatus === PDFStatus.ACTIVE ? "aktif" : "pasif"
          } olarak güncellendi`
        );
        loadPDFs(); // Listeyi yenile
      } else {
        setMessage("❌ PDF durumu güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Status update error:", error);
      setMessage("❌ Bağlantı hatası oluştu");
    }
  };

  // PDF'i sil
  const deletePDF = async (pdf: PDFDocument) => {
    if (
      !confirm(
        `"${pdf.title}" PDF'ini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
      )
    ) {
      return;
    }

    try {
      const idToken = await getFreshToken();

      const response = await fetch("/api/admin/content/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          subcategory: pdf.subcategory,
          pdfId: pdf.id,
        }),
      });

      if (response.ok) {
        setMessage("✅ PDF başarıyla silindi");
        loadPDFs(); // Listeyi yenile
      } else {
        setMessage("❌ PDF silinirken hata oluştu");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("❌ Bağlantı hatası oluştu");
    }
  };

  useEffect(() => {
    loadPDFs();
  }, [subcategoryFilter, statusFilter]);

  const handleSearch = () => {
    loadPDFs();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: PDFStatus) => {
    const badgeClasses = {
      [PDFStatus.ACTIVE]: "bg-success",
      [PDFStatus.INACTIVE]: "bg-secondary",
      [PDFStatus.DRAFT]: "bg-warning",
    };

    const statusTexts = {
      [PDFStatus.ACTIVE]: "Aktif",
      [PDFStatus.INACTIVE]: "Pasif",
      [PDFStatus.DRAFT]: "Taslak",
    };

    return (
      <span className={`badge ${badgeClasses[status]}`}>
        {statusTexts[status]}
      </span>
    );
  };

  const categoryInfo = subcategoryFilter
    ? PDF_CATEGORY_INFO[subcategoryFilter]
    : null;

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        <div className="container py-5">
          <div className="row">
            <div className="col-12">
              {/* Page Header */}
              <div className="text-center mb-4">
                <h1 className="display-6 fw-bold text-dark mb-3">
                  <i className="bi bi-list-ul me-3"></i>
                  PDF Listesi
                  {categoryInfo && (
                    <small className="text-muted d-block mt-2">
                      {categoryInfo.name}
                    </small>
                  )}
                </h1>
              </div>

              {/* Breadcrumb */}
              <Breadcrumb
                showHome={false}
                items={[
                  { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                  {
                    label: "İçerik Yönetimi",
                    href: "/admin/content",
                    icon: "bi-file-earmark-pdf",
                  },
                  {
                    label: categoryInfo ? categoryInfo.name : "Tüm PDF'ler",
                    icon: "bi-list-ul",
                    active: true,
                  },
                ]}
              />

              {/* Filters */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0">
                    <i className="bi bi-funnel me-2"></i>
                    Arama ve Filtreler
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="PDF başlığında ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <div className="col-md-3">
                      <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(e.target.value as PDFStatus | "all")
                        }
                      >
                        <option value="all">Tüm Durumlar</option>
                        <option value={PDFStatus.ACTIVE}>Aktif</option>
                        <option value={PDFStatus.INACTIVE}>Pasif</option>
                        <option value={PDFStatus.DRAFT}>Taslak</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <button
                        className="btn btn-primary w-100"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        <i className="bi bi-search me-1"></i>
                        Ara
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <span className="text-muted">{pdfs.length} PDF bulundu</span>
                </div>
                <div className="d-flex gap-2">
                  <Link
                    href={`/admin/content/add-pdf${
                      subcategoryFilter
                        ? `?subcategory=${subcategoryFilter}`
                        : ""
                    }`}
                    className="btn btn-primary"
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Yeni PDF Ekle
                  </Link>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={loadPDFs}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Yenile
                  </button>
                </div>
              </div>

              {/* PDF List */}
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Yükleniyor...</span>
                      </div>
                      <p className="mt-2 text-muted">PDF'ler yükleniyor...</p>
                    </div>
                  ) : pdfs.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-file-earmark-pdf display-4 text-muted mb-3"></i>
                      <h5 className="text-muted">PDF bulunamadı</h5>
                      <p className="text-muted">
                        {searchQuery.trim()
                          ? `"${searchQuery.trim()}" için sonuç bulunamadı.`
                          : "Bu kategoride henüz PDF bulunmuyor."}
                      </p>
                      <Link
                        href={`/admin/content/add-pdf${
                          subcategoryFilter
                            ? `?subcategory=${subcategoryFilter}`
                            : ""
                        }`}
                        className="btn btn-primary"
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        İlk PDF'i Ekle
                      </Link>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Başlık</th>
                            <th>Kategori</th>
                            <th>Durum</th>
                            <th>Boyut</th>
                            <th>Son Güncelleme</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pdfs.map((pdf) => (
                            <tr key={pdf.id}>
                              <td>
                                <div>
                                  <div className="fw-semibold">{pdf.title}</div>
                                  {pdf.description && (
                                    <small className="text-muted">
                                      {pdf.description.substring(0, 80)}
                                      {pdf.description.length > 80 && "..."}
                                    </small>
                                  )}
                                  {pdf.isPremiumOnly && (
                                    <span className="badge bg-warning ms-2">
                                      Premium
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-semibold">
                                    {getCategoryDisplayName(pdf.subcategory)}
                                  </div>
                                  <small className="text-muted">
                                    {pdf.category}
                                  </small>
                                </div>
                              </td>
                              <td>{getStatusBadge(pdf.status)}</td>
                              <td>{formatFileSize(pdf.fileSize || 0)}</td>
                              <td>
                                {pdf.updatedAt && (
                                  <small className="text-muted">
                                    {pdf.updatedAt
                                      .toDate()
                                      .toLocaleDateString("tr-TR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                  </small>
                                )}
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <a
                                    href={pdf.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-info"
                                    title="PDF'i Görüntüle"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </a>
                                  <button
                                    className={`btn ${
                                      pdf.status === PDFStatus.ACTIVE
                                        ? "btn-outline-warning"
                                        : "btn-outline-success"
                                    }`}
                                    onClick={() => togglePDFStatus(pdf)}
                                    title={
                                      pdf.status === PDFStatus.ACTIVE
                                        ? "Pasif Yap"
                                        : "Aktif Yap"
                                    }
                                  >
                                    <i
                                      className={`bi ${
                                        pdf.status === PDFStatus.ACTIVE
                                          ? "bi-pause"
                                          : "bi-play"
                                      }`}
                                    ></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => deletePDF(pdf)}
                                    title="Sil"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Alert */}
              {message && (
                <Alert
                  type={
                    message.includes("✅")
                      ? "success"
                      : message.includes("❌")
                      ? "danger"
                      : "info"
                  }
                  message={message}
                  className="mt-4"
                />
              )}
            </div>
          </div>
        </div>

        <Footer variant="admin" />
      </div>
    </AdminGuard>
  );
}
