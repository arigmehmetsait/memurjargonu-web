"use client";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Alert from "@/components/Alert";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";
import { useRouter } from "next/router";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getValidToken } from "@/utils/tokenCache";
import {
  PDFDocument,
  PDFCategory,
  PDFSubcategory,
  PDFStatus,
  PDFListResponse,
  PDFDocumentRequest,
} from "@/types/pdf";
import {
  PDF_CATEGORY_INFO,
  getCategoryDisplayName,
} from "@/constants/pdfCategories";
import { PackageType } from "@/types/package";
import { PACKAGE_INFO } from "@/constants/packages";
import { formatDate } from "@/utils/formatDate";
import { toast } from "react-toastify";
import ExcelImportModal from "@/components/ExcelImportModal";
import * as XLSX from "xlsx";

export default function PDFList() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PDFStatus | "all">("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<PDFDocument | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pdfToEdit, setPdfToEdit] = useState<PDFDocument | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PDFDocumentRequest>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [importing, setImporting] = useState(false);

  // URL parametrelerinden filtreleri al
  const subcategoryFilter = router.query.subcategory as PDFSubcategory;

  // PDF'leri yükle
  const loadPDFs = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const idToken = await getValidToken(); // Cache'li token

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
      const idToken = await getValidToken(); // Cache'li token

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

  // PDF'i düzenle
  const handleEditClick = (pdf: PDFDocument) => {
    setPdfToEdit(pdf);
    setEditFormData({
      title: pdf.title,
      description: pdf.description || "",
      visibleInPackages: pdf.visibleInPackages || [],
      isPremiumOnly: pdf.isPremiumOnly || false,
      sortOrder: pdf.sortOrder || 1,
      tags: pdf.tags || [],
      status: pdf.status,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!pdfToEdit) return;

    if (!editFormData.title?.trim()) {
      toast.warn("Başlık zorunludur");
      return;
    }

    // PDF'in subcategory'sini kaydet (yönlendirme için)
    const pdfSubcategory = pdfToEdit.subcategory;

    try {
      setSaving(true);
      const idToken = await getValidToken();

      let pdfUrl = pdfToEdit.pdfUrl;
      let fileName = pdfToEdit.fileName;
      let fileSize = pdfToEdit.fileSize;

      // Eğer yeni PDF dosyası seçildiyse, önce onu Firebase Storage'a yükle
      if (newPdfFile) {
        setUploadingPdf(true);
        try {
          // Sadece dosya yükleme için FormData oluştur
          const uploadFormData = new FormData();
          uploadFormData.append("pdfFile", newPdfFile);
          uploadFormData.append("updateOnly", "true"); // Sadece dosya yükleme flag'i
          uploadFormData.append("pdfId", pdfToEdit.id || ""); // Mevcut PDF ID'si

          const uploadResponse = await fetch("/api/admin/content/upload-file", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
            body: uploadFormData,
          });

          const uploadData = await uploadResponse.json();

          if (uploadResponse.ok && uploadData.success && uploadData.data) {
            pdfUrl = uploadData.data.downloadUrl;
            fileName = uploadData.data.fileName;
            fileSize = uploadData.data.fileSize;
            toast.success("Yeni PDF dosyası yüklendi");
          } else {
            toast.error(
              uploadData.error || "PDF dosyası yüklenirken hata oluştu"
            );
            setUploadingPdf(false);
            setSaving(false);
            return;
          }
        } catch (uploadError) {
          console.error("PDF upload error:", uploadError);
          toast.error("PDF dosyası yüklenirken bir hata oluştu");
          setUploadingPdf(false);
          setSaving(false);
          return;
        } finally {
          setUploadingPdf(false);
        }
      }

      const url =
        pdfToEdit.subcategory === PDFSubcategory.TARIH
          ? `/api/admin/pdf-files/${pdfToEdit.id}`
          : "/api/admin/content/update";

      const body =
        pdfToEdit.subcategory === PDFSubcategory.TARIH
          ? {
              title: editFormData.title.trim(),
              pdfUrl: pdfUrl,
            }
          : {
              subcategory: pdfToEdit.subcategory,
              pdfId: pdfToEdit.id,
              title: editFormData.title.trim(),
              description: editFormData.description || "",
              visibleInPackages: editFormData.visibleInPackages || [],
              isPremiumOnly: editFormData.isPremiumOnly || false,
              sortOrder: editFormData.sortOrder || 1,
              tags: editFormData.tags || [],
              status: editFormData.status || PDFStatus.DRAFT,
              ...(newPdfFile && {
                pdfUrl: pdfUrl,
                fileName: fileName,
                fileSize: fileSize,
              }),
            };

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("PDF başarıyla güncellendi");
        setShowEditModal(false);
        setNewPdfFile(null);

        // Eğer aynı kategori sayfasındaysak listeyi yenile, değilse yönlendir
        const currentSubcategory = subcategoryFilter;

        if (currentSubcategory === pdfSubcategory) {
          // Aynı sayfadaysak listeyi yenile
          loadPDFs();
        } else {
          // Farklı sayfadaysak ilgili kategori liste sayfasına yönlendir
          if (pdfSubcategory === PDFSubcategory.TARIH) {
            router.push("/admin/pdf-files");
          } else {
            router.push(`/admin/content/list?subcategory=${pdfSubcategory}`);
          }
        }

        setPdfToEdit(null);
      } else {
        toast.error(data.error || "PDF güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("PDF güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  // Excel'den toplu PDF ekleme
  const handleExcelImport = async (file: File) => {
    if (!subcategoryFilter) {
      toast.warn("Lütfen önce bir kategori seçin");
      return;
    }

    if (!file) return;

    try {
      setImporting(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        toast.error("Excel dosyasında sayfa bulunamadı");
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });

      const imported: Array<{
        title: string;
        description?: string;
        pdfUrl: string;
        visibleInPackages: string[];
        isPremiumOnly: boolean;
        sortOrder: number;
        tags: string[];
        status: PDFStatus;
      }> = [];

      rows.forEach((row) => {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim().toLowerCase()] = row[key];
        });

        const title = String(
          normalized["title"] || normalized["başlık"] || ""
        ).trim();
        const description = String(
          normalized["description"] ||
            normalized["açıklama"] ||
            normalized["description"] ||
            ""
        ).trim();
        const pdfUrl = String(
          normalized["pdfurl"] ||
            normalized["pdf_url"] ||
            normalized["url"] ||
            ""
        ).trim();
        const visibleInPackagesStr = String(
          normalized["visibleinpackages"] ||
            normalized["visible_in_packages"] ||
            normalized["packages"] ||
            ""
        ).trim();
        const visibleInPackages = visibleInPackagesStr
          ? visibleInPackagesStr
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : [];
        const isPremiumOnly =
          String(
            normalized["ispremiumonly"] ||
              normalized["is_premium_only"] ||
              normalized["premium"] ||
              ""
          )
            .trim()
            .toLowerCase() === "true" ||
          String(normalized["premium"] || "")
            .trim()
            .toLowerCase() === "evet";
        const sortOrder =
          parseInt(
            String(
              normalized["sortorder"] ||
                normalized["sort_order"] ||
                normalized["sıra"] ||
                "1"
            )
          ) || 1;
        const tagsStr = String(
          normalized["tags"] || normalized["etiketler"] || ""
        ).trim();
        const tags = tagsStr
          ? tagsStr
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
        const statusStr = String(
          normalized["status"] || normalized["durum"] || "draft"
        )
          .trim()
          .toLowerCase();
        const status =
          statusStr === "active" || statusStr === "aktif"
            ? PDFStatus.ACTIVE
            : statusStr === "inactive" || statusStr === "pasif"
            ? PDFStatus.INACTIVE
            : PDFStatus.DRAFT;

        if (!title || !pdfUrl) {
          return;
        }

        imported.push({
          title,
          description: description || undefined,
          pdfUrl,
          visibleInPackages:
            visibleInPackages.length > 0
              ? visibleInPackages
              : PDF_CATEGORY_INFO[subcategoryFilter]?.packageTypes || [],
          isPremiumOnly,
          sortOrder,
          tags,
          status,
        });
      });

      if (imported.length === 0) {
        toast.warn("Excel dosyasında geçerli PDF bulunamadı");
        return;
      }

      // Her PDF'i backend'e kaydet
      const token = await getValidToken();
      let successCount = 0;
      let errorCount = 0;

      for (const pdfData of imported) {
        try {
          const pdfRequest: PDFDocumentRequest = {
            title: pdfData.title,
            description: pdfData.description,
            category: PDF_CATEGORY_INFO[subcategoryFilter].category,
            subcategory: subcategoryFilter,
            visibleInPackages: pdfData.visibleInPackages,
            isPremiumOnly: pdfData.isPremiumOnly,
            sortOrder: pdfData.sortOrder,
            tags: pdfData.tags,
            status: pdfData.status,
          };

          // PDF'i veritabanına kaydet (dosya yüklemeden, sadece metadata)
          const response = await fetch("/api/admin/content/create-pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...pdfRequest,
              pdfUrl: pdfData.pdfUrl,
              fileName: pdfData.pdfUrl.split("/").pop() || "imported.pdf",
              fileSize: 0, // Excel'den dosya boyutu bilinmiyor
            }),
          });

          const data = await response.json();
          if (response.ok && data.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`PDF "${pdfData.title}" kaydedilemedi:`, data.error);
          }
        } catch (err) {
          console.error(`PDF "${pdfData.title}" kaydedilirken hata:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} PDF başarıyla içe aktarıldı`);
        loadPDFs();
      }

      if (errorCount > 0) {
        toast.warn(`${errorCount} PDF kaydedilemedi`);
      }
    } catch (err) {
      console.error("Excel içe aktarım hatası:", err);
      toast.error("Excel dosyası okunamadı");
    } finally {
      setImporting(false);
    }
  };

  // PDF'i sil
  const handleDeleteClick = (pdf: PDFDocument) => {
    setPdfToDelete(pdf);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pdfToDelete) return;

    try {
      const idToken = await getValidToken(); // Cache'li token

      // Tarih kategorisi için farklı endpoint
      const url =
        pdfToDelete.subcategory === PDFSubcategory.TARIH
          ? `/api/admin/pdf-files/${pdfToDelete.id}`
          : "/api/admin/content/delete";

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body:
          pdfToDelete.subcategory === PDFSubcategory.TARIH
            ? undefined
            : JSON.stringify({
                subcategory: pdfToDelete.subcategory,
                pdfId: pdfToDelete.id,
              }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage("✅ PDF başarıyla silindi");
          loadPDFs(); // Listeyi yenile
        } else {
          setMessage(`❌ ${data.error || "PDF silinirken hata oluştu"}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(`❌ ${errorData.error || "PDF silinirken hata oluştu"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("❌ Bağlantı hatası oluştu");
    } finally {
      setShowDeleteModal(false);
      setPdfToDelete(null);
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
                  {subcategoryFilter && (
                    <button
                      className="btn btn-outline-info"
                      onClick={() => setShowExcelModal(true)}
                      disabled={loading || importing}
                    >
                      <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                      Excel'den Toplu Ekle
                    </button>
                  )}
                  <Link
                    href={
                      subcategoryFilter === PDFSubcategory.TARIH
                        ? "/admin/pdf-files/new"
                        : `/admin/content/add-pdf${
                            subcategoryFilter
                              ? `?subcategory=${subcategoryFilter}`
                              : ""
                          }`
                    }
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
                        href={
                          subcategoryFilter === PDFSubcategory.TARIH
                            ? "/admin/pdf-files/new"
                            : `/admin/content/add-pdf${
                                subcategoryFilter
                                  ? `?subcategory=${subcategoryFilter}`
                                  : ""
                              }`
                        }
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
                                    {formatDate(pdf.updatedAt)}
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
                                  {pdf.subcategory === PDFSubcategory.TARIH ? (
                                    <>
                                      <Link
                                        href={`/admin/pdf-files/${pdf.id}`}
                                        className="btn btn-outline-primary"
                                        title="Düzenle"
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </Link>
                                      <Link
                                        href={`/admin/pdf-files/${pdf.id}/questions`}
                                        className="btn btn-outline-secondary"
                                        title="Soruları Yönet"
                                      >
                                        <i className="bi bi-question-circle"></i>
                                      </Link>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="btn btn-outline-primary"
                                        onClick={() => handleEditClick(pdf)}
                                        title="Düzenle"
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                      <Link
                                        href={`/admin/content/pdfs/${pdf.id}/questions?subcategory=${pdf.subcategory}`}
                                        className="btn btn-outline-secondary"
                                        title="Soruları Yönet"
                                      >
                                        <i className="bi bi-question-circle"></i>
                                      </Link>
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
                                    </>
                                  )}
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeleteClick(pdf)}
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

      {/* Edit Modal */}
      {showEditModal && pdfToEdit && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  PDF Düzenle
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setPdfToEdit(null);
                    setNewPdfFile(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">PDF Dosyası Değiştir</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.type === "application/pdf") {
                        setNewPdfFile(file);
                      } else if (file) {
                        toast.warn("Lütfen sadece PDF dosyası seçin");
                        e.target.value = "";
                      }
                    }}
                  />
                  {newPdfFile && (
                    <small className="text-success d-block mt-1">
                      <i className="bi bi-check-circle me-1"></i>
                      Yeni dosya seçildi: {newPdfFile.name}
                    </small>
                  )}
                  {!newPdfFile && pdfToEdit && (
                    <small className="text-muted d-block mt-1">
                      Mevcut dosya: {pdfToEdit.fileName || "Bilinmiyor"}
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Başlık <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFormData.title || ""}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Açıklama</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editFormData.description || ""}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                {pdfToEdit.subcategory !== PDFSubcategory.TARIH && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Durum</label>
                      <select
                        className="form-select"
                        value={editFormData.status || PDFStatus.DRAFT}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            status: e.target.value as PDFStatus,
                          }))
                        }
                      >
                        <option value={PDFStatus.DRAFT}>Taslak</option>
                        <option value={PDFStatus.ACTIVE}>Aktif</option>
                        <option value={PDFStatus.INACTIVE}>Pasif</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Görünür Paketler</label>
                      <div className="row g-2">
                        {Object.values(PackageType)
                          .filter((pkg) =>
                            pdfToEdit.category === PDFCategory.AGS
                              ? pkg.startsWith("ags_")
                              : pkg.startsWith("kpss_")
                          )
                          .map((pkg) => (
                            <div key={pkg} className="col-md-6">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={
                                    editFormData.visibleInPackages?.includes(
                                      pkg
                                    ) || false
                                  }
                                  onChange={(e) => {
                                    const current =
                                      editFormData.visibleInPackages || [];
                                    setEditFormData((prev) => ({
                                      ...prev,
                                      visibleInPackages: e.target.checked
                                        ? [...current, pkg]
                                        : current.filter((p) => p !== pkg),
                                    }));
                                  }}
                                />
                                <label className="form-check-label">
                                  {PACKAGE_INFO[pkg]?.name || pkg}
                                </label>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={editFormData.isPremiumOnly || false}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              isPremiumOnly: e.target.checked,
                            }))
                          }
                        />
                        <label className="form-check-label">
                          Sadece Premium Kullanıcılar
                        </label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Sıra Numarası</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={editFormData.sortOrder || 1}
                        onChange={(e) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            sortOrder: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Etiketler (virgülle ayırın)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFormData.tags?.join(", ") || ""}
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter((t) => t);
                          setEditFormData((prev) => ({
                            ...prev,
                            tags,
                          }));
                        }}
                        placeholder="etiket1, etiket2, etiket3"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setPdfToEdit(null);
                  }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEditSubmit}
                  disabled={saving || uploadingPdf}
                >
                  {saving || uploadingPdf ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {uploadingPdf ? "PDF Yükleniyor..." : "Kaydediliyor..."}
                    </>
                  ) : (
                    "Kaydet"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {subcategoryFilter && (
        <ExcelImportModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          onFileSelect={handleExcelImport}
          title="Excel'den Toplu PDF Ekle"
          description="PDF'leri Excel dosyasından toplu olarak içe aktarabilirsiniz. Excel dosyasında PDF URL'leri olmalıdır."
          columns={[
            {
              name: "title",
              required: true,
              description: "PDF başlığı",
            },
            {
              name: "description",
              required: false,
              description: "PDF açıklaması",
            },
            {
              name: "pdfUrl",
              required: true,
              description: "PDF dosyasının URL'i",
            },
            {
              name: "visibleInPackages",
              required: false,
              description: "Görünür paketler (virgülle ayırın)",
            },
            {
              name: "isPremiumOnly",
              required: false,
              description: "Sadece premium (true/false)",
            },
            {
              name: "sortOrder",
              required: false,
              description: "Sıra numarası",
            },
            {
              name: "tags",
              required: false,
              description: "Etiketler (virgülle ayırın)",
            },
            {
              name: "status",
              required: false,
              description: "Durum (draft/active/inactive)",
            },
          ]}
          exampleData={[
            {
              title: "Örnek PDF 1",
              description: "Bu bir örnek PDF açıklamasıdır",
              pdfUrl: "https://example.com/pdf1.pdf",
              visibleInPackages: "ags_full,ags_egitim",
              isPremiumOnly: "false",
              sortOrder: "1",
              tags: "tarih,osmanlı",
              status: "active",
            },
            {
              title: "Örnek PDF 2",
              description: "İkinci örnek PDF",
              pdfUrl: "https://example.com/pdf2.pdf",
              visibleInPackages: "ags_full",
              isPremiumOnly: "true",
              sortOrder: "2",
              tags: "coğrafya",
              status: "draft",
            },
          ]}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPdfToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="PDF Silme Onayı"
        message={
          pdfToDelete
            ? `"${pdfToDelete.title}" PDF'ini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : ""
        }
        confirmText="Sil"
        cancelText="İptal"
        confirmVariant="danger"
        icon="bi-exclamation-triangle"
      />
    </AdminGuard>
  );
}
