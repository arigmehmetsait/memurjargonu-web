import { useState, useEffect } from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Deneme {
  id: string;
  name: string;
  soruSayisi: number;
}

export default function DenemelerPage() {
  const [denemeler, setDenemeler] = useState<Deneme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDenemeler();
  }, []);

  const fetchDenemeler = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/denemeler/list");
      const data = await response.json();

      if (data.success) {
        setDenemeler(data.data);
      } else {
        const errorMsg = data.error || "Denemeler yüklenemedi";
        const details = data.details ? ` (${data.details})` : "";
        setError(errorMsg + details);
      }
    } catch (err) {
      console.error("Denemeler yüklenirken hata:", err);
      setError(
        "Denemeler yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Denemeler - Memur Jargonu</title>
        <meta name="description" content="Mevzuat denemeleri listesi" />
      </Head>

      <Header />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="h2">
                <i className="bi bi-journal-text me-2"></i>
                Mevzuat Denemeleri
              </h1>
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
                  onClick={fetchDenemeler}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : denemeler.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-journal-x display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">Henüz deneme bulunmuyor</h3>
                <p className="text-muted">
                  Sistemde henüz hiç deneme eklenmemiş.
                </p>
              </div>
            ) : (
              <div className="row">
                {denemeler.map((deneme) => (
                  <div key={deneme.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                          <div
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: "50px", height: "50px" }}
                          >
                            <i className="bi bi-journal-text fs-5"></i>
                          </div>
                          <div>
                            <h5 className="card-title mb-0">{deneme.name}</h5>
                            <small className="text-muted">
                              Mevzuat Denemesi
                            </small>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-secondary">
                              <i className="bi bi-question-circle me-1"></i>
                              {deneme.soruSayisi} Soru
                            </span>
                            <span className="text-muted small">
                              ID: {deneme.id}
                            </span>
                          </div>

                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                window.location.href = `/denemeler/${encodeURIComponent(
                                  deneme.id
                                )}`;
                              }}
                            >
                              <i className="bi bi-play-circle me-2"></i>
                              Denemeyi Başlat
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
