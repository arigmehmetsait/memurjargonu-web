"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getValidToken } from "@/utils/tokenCache";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/ConfirmModal";

interface PDFFile {
  id: string;
  title: string;
  pdfUrl: string;
  video?: string;
  questions?: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
}

export default function PDFFilesPage() {
  const router = useRouter();
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchPDFFiles();
  }, []);

  const fetchPDFFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getValidToken();
      const response = await fetch("/api/admin/pdf-files/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPdfFiles(data.data || []);
      } else {
        setError(data.error || "PDF dosyaları yüklenemedi");
      }
    } catch (err) {
      console.error("PDF dosyaları yüklenirken hata:", err);
      setError(
        "PDF dosyaları yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setPdfToDelete({ id, title });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pdfToDelete) return;

    try {
      const token = await getValidToken();
      const response = await fetch(`/api/admin/pdf-files/${pdfToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("PDF dosyası silindi");
        fetchPDFFiles();
      } else {
        toast.error(data.error || "PDF dosyası silinemedi");
      }
    } catch (err) {
      console.error("PDF dosyası silme hatası:", err);
      toast.error("PDF dosyası silinirken bir hata oluştu");
    } finally {
      setShowDeleteModal(false);
      setPdfToDelete(null);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "-";
    const date =
      timestamp.toDate?.() ||
      (timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp));
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredPDFFiles = pdfFiles.filter(
    (pdf) =>
      !search.trim() ||
      pdf.title.toLowerCase().includes(search.toLowerCase()) ||
      pdf.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminGuard>
      <Head>
        <title>PDF Dosyaları - Admin Panel</title>
      </Head>

      <Header variant="admin" />

      <main className="container-fluid py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <button
              className="btn btn-outline-secondary mb-2"
              onClick={() => router.back()}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Geri Dön
            </button>
            <h1 className="h3 mb-0">
              <i className="bi bi-file-earmark-pdf me-2"></i>
              PDF Dosyaları Yönetimi
            </h1>
            <p className="text-muted mb-0">
              PDF dosyalarını yönetin, soruları ekleyin ve düzenleyin.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-primary"
              onClick={() => router.push("/admin/pdf-files/new")}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Yeni PDF Ekle
            </button>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label mb-1">
                  <i className="bi bi-search me-1"></i>
                  PDF Ara
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Başlık veya ID ile ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button
              className="btn btn-outline-danger btn-sm ms-3"
              onClick={fetchPDFFiles}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Tekrar Dene
            </button>
          </div>
        ) : filteredPDFFiles.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-file-earmark-pdf display-1 text-muted"></i>
            <h3 className="mt-3 text-muted">PDF dosyası bulunamadı</h3>
            <p className="text-muted">
              Yeni PDF eklemek için "Yeni PDF Ekle" butonunu kullanın.
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredPDFFiles.map((pdf) => {
              const questionCount = pdf.questions
                ? Object.keys(pdf.questions).length
                : 0;

              return (
                <div key={pdf.id} className="col-12 col-lg-6">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0 text-primary">{pdf.title}</h5>
                        <small className="text-muted">ID: {pdf.id}</small>
                      </div>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() =>
                            router.push(`/admin/pdf-files/${pdf.id}`)
                          }
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteClick(pdf.id, pdf.title)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>PDF URL:</strong>
                        <br />
                        <a
                          href={pdf.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-break small"
                        >
                          {pdf.pdfUrl.substring(0, 60)}...
                        </a>
                      </div>

                      {pdf.video && (
                        <div className="mb-3">
                          <strong>Video ID:</strong>
                          <br />
                          <span className="text-muted">{pdf.video}</span>
                        </div>
                      )}

                      <div className="mb-3">
                        <strong>Soru Sayısı:</strong>
                        <br />
                        <span className="badge bg-info">{questionCount}</span>
                      </div>

                      <div className="d-flex justify-content-between text-muted small">
                        <span>
                          <i className="bi bi-calendar me-1"></i>
                          Oluşturulma: {formatDate(pdf.createdAt)}
                        </span>
                        <span>
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Güncelleme: {formatDate(pdf.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <button
                        className="btn btn-outline-secondary btn-sm w-100"
                        onClick={() =>
                          router.push(`/admin/pdf-files/${pdf.id}/questions`)
                        }
                      >
                        <i className="bi bi-question-circle me-2"></i>
                        Soruları Yönet ({questionCount})
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPdfToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="PDF Dosyası Silme Onayı"
          message={`"${pdfToDelete?.title}" adlı PDF dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          confirmVariant="danger"
          icon="bi-exclamation-triangle"
        />
      </main>
    </AdminGuard>
  );
}

