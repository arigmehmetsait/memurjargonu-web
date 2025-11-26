"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import { getValidToken } from "@/utils/tokenCache";
import { toast } from "react-toastify";

export default function NewPDFFilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    pdfUrl: "",
    video: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.pdfUrl.trim()) {
      toast.warn("Başlık ve PDF URL zorunludur");
      return;
    }

    try {
      setLoading(true);
      const token = await getValidToken();

      const response = await fetch("/api/admin/pdf-files/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          pdfUrl: formData.pdfUrl.trim(),
          video: formData.video.trim() || "",
          questions: {},
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("PDF dosyası oluşturuldu");
        router.push(`/admin/pdf-files/${data.data.id}`);
      } else {
        toast.error(data.error || "PDF dosyası oluşturulamadı");
      }
    } catch (err) {
      console.error("PDF dosyası oluşturma hatası:", err);
      toast.error("PDF dosyası oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <Head>
        <title>Yeni PDF Ekle - Admin Panel</title>
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
                  <i className="bi bi-file-earmark-plus me-2"></i>
                  Yeni PDF Dosyası Ekle
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
                      placeholder="İslamiyetten Önceki Türk Devletleri"
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
                      placeholder="https://firebasestorage.googleapis.com/..."
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
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Oluşturuluyor...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Oluştur
                        </>
                      )}
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

