import { useState, useEffect } from "react";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface DogruYanlisDeneme {
  id: string;
  name: string;
  description: string;
  soruSayisi: number;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

export default function DogruYanlisPage() {
  const [denemeler, setDenemeler] = useState<DogruYanlisDeneme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDenemeler();
  }, []);

  const fetchDenemeler = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dogru-yanlis/list");
      const data = await response.json();

      if (data.success) {
        setDenemeler(data.data);
      } else {
        setError(data.error || "Doğru-Yanlış denemeleri yüklenemedi");
      }
    } catch (err) {
      console.error("Doğru-Yanlış denemeleri yüklenirken hata:", err);
      setError("Doğru-Yanlış denemeleri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Doğru-Yanlış Denemeleri - KPSS Premium</title>
        <meta
          name="description"
          content="KPSS Doğru-Yanlış denemeleri ile bilginizi test edin"
        />
      </Head>

      <Header />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            {/* Header Section */}
            <div className="text-center mb-5">
              <div className="mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-check2-square display-4"></i>
                </div>
              </div>
              <h1 className="display-5 fw-bold text-dark mb-3">
                Doğru-Yanlış Denemeleri
              </h1>
              <p className="lead text-muted">
                Bilginizi test etmek için doğru-yanlış soruları ile pratik yapın
              </p>
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner />
                <p className="text-muted mt-3">
                  Doğru-yanlış denemeleri yükleniyor...
                </p>
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
                <i className="bi bi-check2-square display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">
                  Henüz doğru-yanlış bulunmuyor
                </h3>
                <p className="text-muted">
                  Sistemde henüz hiç doğru-yanlış denemesi eklenmemiş.
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
                            className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: "50px", height: "50px" }}
                          >
                            <i className="bi bi-check2-square"></i>
                          </div>
                          <div>
                            <h5 className="card-title mb-1">{deneme.name}</h5>
                            <small className="text-muted">
                              Doğru-Yanlış Denemesi
                            </small>
                          </div>
                        </div>

                        {deneme.description && (
                          <p className="card-text text-muted small mb-3">
                            {deneme.description}
                          </p>
                        )}

                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="badge bg-primary">
                              <i className="bi bi-question-circle me-1"></i>
                              {deneme.soruSayisi} Soru
                            </span>
                            <span className="badge bg-success">
                              <i className="bi bi-check2-square me-1"></i>
                              Doğru-Yanlış
                            </span>
                          </div>
                          <button
                            className="btn btn-success w-100"
                            onClick={() => {
                              window.location.href = `/dogru-yanlis/${encodeURIComponent(
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
                ))}
              </div>
            )}

            {/* Info Section */}
            {denemeler.length > 0 && (
              <div className="row mt-5">
                <div className="col-12">
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <h5 className="card-title mb-2">
                            <i className="bi bi-info-circle me-2"></i>
                            Doğru-Yanlış Denemeleri Hakkında
                          </h5>
                          <p className="card-text mb-0">
                            Doğru-yanlış denemeleri ile bilginizi hızlı bir
                            şekilde test edebilirsiniz. Her soru için "Doğru"
                            veya "Yanlış" seçeneğini işaretleyerek
                            ilerleyebilirsiniz.
                          </p>
                        </div>
                        <div className="col-md-4 text-center">
                          <div className="row">
                            <div className="col-6">
                              <div className="text-success">
                                <i className="bi bi-check-circle display-6"></i>
                                <div className="small">Doğru</div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-danger">
                                <i className="bi bi-x-circle display-6"></i>
                                <div className="small">Yanlış</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
