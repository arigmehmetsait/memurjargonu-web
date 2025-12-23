"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { pdfFilesService } from "@/services/admin/pdfFilesService";
import { toast } from "react-toastify";

export default function PDFFileDetailPage() {
  const router = useRouter();
  const { docId } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    pdfUrl: "",
    video: "",
  });

  useEffect(() => {
    if (docId) {
      fetchPDFFile();
    }
  }, [docId]);

  const fetchPDFFile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await pdfFilesService.get(docId as string);

      if (response.success && response.data) {
        setFormData({
          title: response.data.title || "",
          pdfUrl: response.data.pdfUrl || "",
          video: response.data.video || "",
        });
      } else {
        setError(response.error || "PDF dosyası yüklenemedi");
      }
    } catch (err) {
      console.error("PDF dosyası yüklenirken hata:", err);
      setError(
        "PDF dosyası yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.pdfUrl.trim()) {
      toast.warn("Başlık ve PDF URL zorunludur");
      return;
    }

    try {
      setSaving(true);

      const response = await pdfFilesService.update(docId as string, {
        title: formData.title.trim(),
        pdfUrl: formData.pdfUrl.trim(),
        video: formData.video.trim() || undefined,
      });

      if (response.success) {
        toast.success("PDF dosyası güncellendi");
      } else {
        toast.error(response.error || "PDF dosyası güncellenemedi");
      }
    } catch (err) {
      console.error("PDF dosyası güncelleme hatası:", err);
      toast.error("PDF dosyası güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <Head>
          <title>PDF Düzenle - Admin Panel</title>
        </Head>
        <Header variant="admin" />
        <main className="container py-5">
          <div className="text-center">
            <LoadingSpinner />
          </div>
        </main>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <Head>
          <title>PDF Düzenle - Admin Panel</title>
        </Head>
        <Header variant="admin" />
        <main className="container py-5">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button
              className="btn btn-outline-danger btn-sm ms-3"
              onClick={() => router.back()}
            >
              Geri Dön
            </button>
          </div>
        </main>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Head>
        <title>PDF Düzenle - Admin Panel</title>
      </Head>

      <Header variant="admin" />

      <main className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <button
              className="btn btn-outline-secondary mb-3"
              onClick={() => router.back()}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Geri Dön
            </button>

            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  PDF Dosyası Düzenle
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">
                      Başlık <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      PDF URL <span className="text-danger">*</span>
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.pdfUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pdfUrl: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Video ID (YouTube)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.video}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          video: e.target.value,
                        }))
                      }
                      placeholder="fGhUavDMBWO"
                    />
                    <small className="form-text text-muted">
                      YouTube video ID'si (opsiyonel)
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => router.back()}
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Kaydet
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-info"
                      onClick={() =>
                        router.push(`/admin/pdf-files/${docId}/questions`)
                      }
                    >
                      <i className="bi bi-question-circle me-2"></i>
                      Soruları Yönet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}

