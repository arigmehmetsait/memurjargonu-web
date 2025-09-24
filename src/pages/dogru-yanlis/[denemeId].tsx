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
  aciklama?: string;
  zorluk?: string;
  konu?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

interface DenemeData {
  denemeId: string;
  denemeName: string;
  sorular: Soru[];
  totalCount: number;
}

interface Cevap {
  soruId: string;
  cevap: number; // 0: Doğru, 1: Yanlış
}

export default function DogruYanlisDenemePage() {
  const router = useRouter();
  const { denemeId } = router.query;

  const [denemeData, setDenemeData] = useState<DenemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSoruIndex, setCurrentSoruIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [denemeTamamlandi, setDenemeTamamlandi] = useState(false);
  const [sonucGoster, setSonucGoster] = useState(false);

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

      const response = await fetch(
        `/api/dogru-yanlis/${encodeURIComponent(denemeId)}/sorular`
      );
      const data = await response.json();

      if (data.success) {
        setDenemeData(data.data);
        // Cevaplar dizisini başlat
        setCevaplar(
          data.data.sorular.map((soru: Soru) => ({
            soruId: soru.id,
            cevap: -1, // -1: cevaplanmamış
          }))
        );
      } else {
        setError(data.error || "Sorular yüklenemedi");
      }
    } catch (err) {
      console.error("Sorular yüklenirken hata:", err);
      setError("Sorular yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCevapSec = (cevap: number) => {
    if (!denemeData) return;

    const yeniCevaplar = [...cevaplar];
    yeniCevaplar[currentSoruIndex].cevap = cevap;
    setCevaplar(yeniCevaplar);
  };

  const handleIleri = () => {
    if (!denemeData) return;

    if (currentSoruIndex < denemeData.sorular.length - 1) {
      setCurrentSoruIndex(currentSoruIndex + 1);
    } else {
      // Son soruya ulaşıldı
      setDenemeTamamlandi(true);
      setSonucGoster(true);
    }
  };

  const handleGeri = () => {
    if (currentSoruIndex > 0) {
      setCurrentSoruIndex(currentSoruIndex - 1);
    }
  };

  const handleDenemeBasla = () => {
    setSonucGoster(false);
    setCurrentSoruIndex(0);
    setDenemeTamamlandi(false);
    setCevaplar(
      denemeData?.sorular.map((soru) => ({
        soruId: soru.id,
        cevap: -1,
      })) || []
    );
  };

  const dogruCevapSayisi =
    denemeData?.sorular.filter((soru, index) => {
      const verilenCevap = cevaplar[index]?.cevap;
      return verilenCevap === soru.dogruSecenek;
    }).length || 0;

  const yanlisCevapSayisi = (denemeData?.totalCount || 0) - dogruCevapSayisi;
  const yuzde = denemeData
    ? Math.round((dogruCevapSayisi / denemeData.totalCount) * 100)
    : 0;

  if (!denemeId || typeof denemeId !== "string") {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">Geçersiz deneme ID</div>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="container my-5">
          <div className="text-center py-5">
            <LoadingSpinner />
            <p className="text-muted mt-3">Sorular yükleniyor...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !denemeData) {
    return (
      <>
        <Header />
        <main className="container my-5">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error || "Deneme verisi bulunamadı"}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentSoru = denemeData.sorular[currentSoruIndex];
  const currentCevap = cevaplar[currentSoruIndex]?.cevap;

  return (
    <>
      <Head>
        <title>{denemeData.denemeName} - Doğru-Yanlış Denemesi</title>
        <meta
          name="description"
          content={`${denemeData.denemeName} doğru-yanlış denemesi`}
        />
      </Head>

      <Header />

      <main className="container my-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="h2">
                <i className="bi bi-check2-square me-2 text-success"></i>
                {denemeData.denemeName}
              </h1>
              <p className="text-muted">Doğru-Yanlış Denemesi</p>
            </div>

            {!sonucGoster ? (
              <>
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">
                      Soru {currentSoruIndex + 1} / {denemeData.totalCount}
                    </span>
                    <span className="text-muted">
                      {Math.round(
                        ((currentSoruIndex + 1) / denemeData.totalCount) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{
                        width: `${
                          ((currentSoruIndex + 1) / denemeData.totalCount) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Question Card */}
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">
                      <span className="badge bg-primary me-2">
                        Soru {currentSoruIndex + 1}
                      </span>
                      {currentSoru.soru}
                    </h5>

                    {/* Answer Options */}
                    <div className="mt-4">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <button
                            className={`btn w-100 ${
                              currentCevap === 0
                                ? "btn-success"
                                : "btn-outline-success"
                            }`}
                            onClick={() => handleCevapSec(0)}
                            style={{ height: "60px" }}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            <strong>Doğru</strong>
                          </button>
                        </div>
                        <div className="col-md-6">
                          <button
                            className={`btn w-100 ${
                              currentCevap === 1
                                ? "btn-danger"
                                : "btn-outline-danger"
                            }`}
                            onClick={() => handleCevapSec(1)}
                            style={{ height: "60px" }}
                          >
                            <i className="bi bi-x-circle me-2"></i>
                            <strong>Yanlış</strong>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="d-flex justify-content-between mt-4">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleGeri}
                    disabled={currentSoruIndex === 0}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Önceki
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleIleri}
                    disabled={currentCevap === -1}
                  >
                    {currentSoruIndex === denemeData.sorular.length - 1 ? (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Denemeyi Bitir
                      </>
                    ) : (
                      <>
                        Sonraki
                        <i className="bi bi-arrow-right ms-2"></i>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Results */
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-4">
                    <div
                      className={`display-1 ${
                        yuzde >= 70
                          ? "text-success"
                          : yuzde >= 50
                          ? "text-warning"
                          : "text-danger"
                      }`}
                    >
                      <i className="bi bi-trophy-fill"></i>
                    </div>
                    <h2 className="mt-3">Deneme Tamamlandı!</h2>
                    <p className="text-muted">
                      Sonuçlarınız aşağıda görüntülenmektedir.
                    </p>
                  </div>

                  {/* Score */}
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <div className="card bg-success text-white">
                        <div className="card-body">
                          <h3 className="card-title">{dogruCevapSayisi}</h3>
                          <p className="card-text">Doğru Cevap</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-danger text-white">
                        <div className="card-body">
                          <h3 className="card-title">{yanlisCevapSayisi}</h3>
                          <p className="card-text">Yanlış Cevap</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div
                        className={`card ${
                          yuzde >= 70
                            ? "bg-success"
                            : yuzde >= 50
                            ? "bg-warning"
                            : "bg-danger"
                        } text-white`}
                      >
                        <div className="card-body">
                          <h3 className="card-title">%{yuzde}</h3>
                          <p className="card-text">Başarı Oranı</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Message */}
                  <div className="alert alert-info">
                    <h5 className="alert-heading">
                      {yuzde >= 80 && "Mükemmel! 🎉"}
                      {yuzde >= 70 && yuzde < 80 && "Çok İyi! 👏"}
                      {yuzde >= 50 && yuzde < 70 && "İyi! 👍"}
                      {yuzde < 50 && "Daha fazla çalışmanız gerekiyor. 💪"}
                    </h5>
                    <p className="mb-0">
                      {yuzde >= 80 &&
                        "Harika bir performans sergilediniz! Bilginiz çok güçlü."}
                      {yuzde >= 70 &&
                        yuzde < 80 &&
                        "İyi bir performans! Biraz daha çalışarak daha da iyileşebilirsiniz."}
                      {yuzde >= 50 &&
                        yuzde < 70 &&
                        "Orta seviyede bir performans. Daha fazla pratik yapmanızı öneririz."}
                      {yuzde < 50 &&
                        "Daha fazla çalışmanız gerekiyor. Konuları tekrar gözden geçirin."}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleDenemeBasla}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Denemeyi Tekrarla
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-lg"
                      onClick={() => router.push("/dogru-yanlis")}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Diğer Denemeler
                    </button>
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
