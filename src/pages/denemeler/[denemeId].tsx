import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Soru {
  id: string;
  soru: string;
  cevap: string;
  secenekler: string[];
  dogruSecenek: number;
  aciklama: string;
  zorluk: string;
  konu: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

interface DenemeData {
  denemeId: string;
  denemeName: string;
  sorular: Soru[];
  totalCount: number;
}

export default function DenemeDetayPage() {
  const router = useRouter();
  const { denemeId } = router.query;

  const [denemeData, setDenemeData] = useState<DenemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (denemeId && typeof denemeId === "string") {
      fetchSorular();
    }
  }, [denemeId]);

  const fetchSorular = async () => {
    if (!denemeId || typeof denemeId !== "string") return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/denemeler/${denemeId}/sorular`);
      const data = await response.json();

      if (data.success) {
        setDenemeData(data.data);
      } else {
        setError(data.error || "Sorular yüklenemedi");
      }
    } catch (err) {
      console.error("Sorular yüklenirken hata:", err);
      setError(
        "Sorular yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const getZorlukBadgeClass = (zorluk: string) => {
    switch (zorluk.toLowerCase()) {
      case "kolay":
        return "bg-success";
      case "orta":
        return "bg-warning";
      case "zor":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const getZorlukText = (zorluk: string) => {
    switch (zorluk.toLowerCase()) {
      case "kolay":
        return "Kolay";
      case "orta":
        return "Orta";
      case "zor":
        return "Zor";
      default:
        return "Belirtilmemiş";
    }
  };

  return (
    <>
      <Head>
        <title>{denemeData?.denemeName || "Deneme"} - Memur Jargonu</title>
        <meta
          name="description"
          content={`${denemeData?.denemeName || "Deneme"} soruları`}
        />
      </Head>

      <Header />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h2">
                  <i className="bi bi-journal-text me-2"></i>
                  {denemeData?.denemeName || "Deneme"}
                </h1>
                {denemeData && (
                  <p className="text-muted mb-0">
                    {denemeData.totalCount} soru • Mevzuat Denemesi
                  </p>
                )}
              </div>
              <button
                className="btn btn-outline-secondary"
                onClick={() => router.back()}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Geri Dön
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner />
                <p className="mt-3 text-muted">Sorular yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button
                  className="btn btn-outline-danger btn-sm ms-3"
                  onClick={fetchSorular}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : !denemeData || denemeData.sorular.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-question-circle display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">Henüz soru bulunmuyor</h3>
                <p className="text-muted">
                  Bu denemede henüz hiç soru eklenmemiş.
                </p>
              </div>
            ) : (
              <div className="row">
                {denemeData.sorular.map((soru, index) => (
                  <div key={soru.id} className="col-12 mb-4">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="bi bi-question-circle me-2"></i>
                          Soru {index + 1}
                        </h5>
                        <div className="d-flex gap-2">
                          <span
                            className={`badge ${getZorlukBadgeClass(
                              soru.zorluk
                            )}`}
                          >
                            {getZorlukText(soru.zorluk)}
                          </span>
                          <span className="badge bg-info">{soru.konu}</span>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <h6 className="fw-bold">Soru:</h6>
                          <p className="mb-0">{soru.soru}</p>
                        </div>

                        {soru.secenekler && soru.secenekler.length > 0 && (
                          <div className="mb-3">
                            <h6 className="fw-bold">Seçenekler:</h6>
                            <div className="row">
                              {soru.secenekler.map((secenek, secenekIndex) => (
                                <div
                                  key={secenekIndex}
                                  className="col-md-6 mb-2"
                                >
                                  <div
                                    className={`p-2 rounded ${
                                      secenekIndex === soru.dogruSecenek
                                        ? "bg-success text-white"
                                        : "bg-light"
                                    }`}
                                  >
                                    <strong>
                                      {String.fromCharCode(65 + secenekIndex)}.
                                    </strong>{" "}
                                    {secenek}
                                    {secenekIndex === soru.dogruSecenek && (
                                      <i className="bi bi-check-circle ms-2"></i>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <h6 className="fw-bold">Doğru Cevap:</h6>
                          <p className="mb-0">
                            <span className="badge bg-success">
                              {String.fromCharCode(65 + soru.dogruSecenek)}
                            </span>
                            {soru.cevap}
                          </p>
                        </div>

                        {soru.aciklama && (
                          <div className="mb-3">
                            <h6 className="fw-bold">Açıklama:</h6>
                            <p className="mb-0 text-muted">{soru.aciklama}</p>
                          </div>
                        )}
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
