import { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface DenemeType {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  path: string;
  denemeCount: number;
  totalQuestions: number;
}

function IceriklerPage() {
  const [denemeTypes, setDenemeTypes] = useState<DenemeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDenemeTypes();
  }, []);

  const fetchDenemeTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tüm deneme türlerini paralel olarak çek
      const [
        mevzuatRes,
        genelRes,
        cografyaRes,
        tarihRes,
        dogruYanlisRes,
        boslukDoldurmaRes,
      ] = await Promise.all([
        fetch("/api/denemeler/list"),
        fetch("/api/genel-denemeler/list"),
        fetch("/api/cografya-denemeler/list"),
        fetch("/api/tarih-denemeler/list"),
        fetch("/api/dogru-yanlis/list"),
        fetch("/api/bosluk-doldurma/list"),
      ]);

      const [
        mevzuatData,
        genelData,
        cografyaData,
        tarihData,
        dogruYanlisData,
        boslukDoldurmaData,
      ] = await Promise.all([
        mevzuatRes.json(),
        genelRes.json(),
        cografyaRes.json(),
        tarihRes.json(),
        dogruYanlisRes.json(),
        boslukDoldurmaRes.json(),
      ]);

      const types: DenemeType[] = [
        {
          id: "mevzuat",
          name: "Mevzuat Denemeleri",
          displayName: "Mevzuat Denemeleri",
          description:
            "Güncel mevzuat bilgileri ile hazırlanmış deneme soruları",
          icon: "bi-journal-text",
          color: "primary",
          path: "/denemeler",
          denemeCount: mevzuatData.success ? mevzuatData.data.length : 0,
          totalQuestions: mevzuatData.success
            ? mevzuatData.data.reduce(
                (sum: number, d: any) => sum + d.soruSayisi,
                0
              )
            : 0,
        },
        {
          id: "genel",
          name: "Genel Denemeler",
          displayName: "Güncel Bilgiler Denemeleri",
          description: "Güncel bilgiler ve genel kültür soruları",
          icon: "bi-lightbulb",
          color: "warning",
          path: "/genel-denemeler",
          denemeCount: genelData.success ? genelData.data.length : 0,
          totalQuestions: genelData.success
            ? genelData.data.reduce(
                (sum: number, d: any) => sum + d.soruSayisi,
                0
              )
            : 0,
        },
        {
          id: "cografya",
          name: "Coğrafya Denemeleri",
          displayName: "Coğrafya Denemeleri",
          description: "Türkiye ve dünya coğrafyası soruları",
          icon: "bi-geo-alt",
          color: "success",
          path: "/cografya-denemeler",
          denemeCount: cografyaData.success ? cografyaData.data.length : 0,
          totalQuestions: cografyaData.success
            ? cografyaData.data.reduce(
                (sum: number, d: any) => sum + d.soruSayisi,
                0
              )
            : 0,
        },
        {
          id: "tarih",
          name: "Tarih Denemeleri",
          displayName: "Tarih Denemeleri",
          description: "Türk tarihi ve dünya tarihi soruları",
          icon: "bi-clock-history",
          color: "info",
          path: "/tarih-denemeler",
          denemeCount: tarihData.success ? tarihData.data.length : 0,
          totalQuestions: tarihData.success
            ? tarihData.data.reduce(
                (sum: number, d: any) => sum + d.soruSayisi,
                0
              )
            : 0,
        },
        {
          id: "dogru-yanlis",
          name: "Doğru-Yanlış Denemeleri",
          displayName: "Doğru-Yanlış Denemeleri",
          description: "Doğru-yanlış formatında hazırlanmış sorular",
          icon: "bi-check2-square",
          color: "danger",
          path: "/dogru-yanlis",
          denemeCount: dogruYanlisData.success
            ? dogruYanlisData.data.length
            : 0,
          totalQuestions: dogruYanlisData.success
            ? dogruYanlisData.data.reduce(
                (sum: number, d: any) => sum + d.soruSayisi,
                0
              )
            : 0,
        },
        {
          id: "bosluk-doldurma",
          name: "Boşluk Doldurma Denemeleri",
          displayName: "Boşluk Doldurma Denemeleri",
          description: "Boşluk doldurma formatında hazırlanmış sorular",
          icon: "bi-pencil-square",
          color: "secondary",
          path: "/bosluk-doldurma",
          denemeCount: boslukDoldurmaData.success
            ? boslukDoldurmaData.data.length
            : 0,
          totalQuestions: boslukDoldurmaData.success
            ? boslukDoldurmaData.data.reduce(
                (sum: number, d: any) => sum + d.soruSayisi,
                0
              )
            : 0,
        },
      ];

      setDenemeTypes(types);
    } catch (err) {
      console.error("Deneme türleri yüklenirken hata:", err);
      setError("İçerikler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>İçerikler - KPSS Premium</title>
        <meta
          name="description"
          content="KPSS hazırlık için tüm deneme türleri ve içerikler"
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
                  className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-collection display-4"></i>
                </div>
              </div>
              <h1 className="display-5 fw-bold text-dark mb-3">İçerikler</h1>
              <p className="lead text-muted">
                KPSS hazırlığınız için tüm deneme türleri ve içerikler
              </p>
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner />
                <p className="text-muted mt-3">İçerikler yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button
                  className="btn btn-outline-danger btn-sm ms-3"
                  onClick={fetchDenemeTypes}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : (
              <div className="row">
                {denemeTypes.map((type) => (
                  <div key={type.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                          <div
                            className={`bg-${type.color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`}
                            style={{ width: "50px", height: "50px" }}
                          >
                            <i className={`bi ${type.icon}`}></i>
                          </div>
                          <div>
                            <h5 className="card-title mb-1">
                              {type.displayName}
                            </h5>
                            <small className="text-muted">
                              {type.denemeCount} Deneme
                            </small>
                          </div>
                        </div>

                        <p className="card-text text-muted small mb-3">
                          {type.description}
                        </p>

                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className={`badge bg-${type.color}`}>
                              <i className="bi bi-question-circle me-1"></i>
                              {type.totalQuestions} Soru
                            </span>
                            <span className="badge bg-light text-dark">
                              <i className={`bi ${type.icon} me-1`}></i>
                              {type.denemeCount} Deneme
                            </span>
                          </div>
                          <button
                            className={`btn btn-${type.color} w-100`}
                            onClick={() => {
                              window.location.href = type.path;
                            }}
                          >
                            <i className="bi bi-play-circle me-2"></i>
                            Denemeleri Gör
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Section */}
            {denemeTypes.length > 0 && (
              <div className="row mt-5">
                <div className="col-12">
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <h5 className="card-title mb-2">
                            <i className="bi bi-info-circle me-2"></i>
                            İçerikler Hakkında
                          </h5>
                          <p className="card-text mb-0">
                            Tüm deneme türlerimiz güncel KPSS müfredatına uygun
                            olarak hazırlanmıştır. Her deneme türü farklı soru
                            formatları ve zorluk seviyeleri sunar. Bilginizi
                            test etmek ve eksik konularınızı belirlemek için
                            çeşitli deneme türlerini deneyebilirsiniz.
                          </p>
                        </div>
                        <div className="col-md-4 text-center">
                          <div className="text-primary">
                            <i className="bi bi-collection display-6"></i>
                            <div className="small">Tüm İçerikler</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            {denemeTypes.length > 0 && (
              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <h3 className="text-primary">
                        {denemeTypes.reduce(
                          (sum, type) => sum + type.denemeCount,
                          0
                        )}
                      </h3>
                      <p className="card-text">Toplam Deneme</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <h3 className="text-success">
                        {denemeTypes.reduce(
                          (sum, type) => sum + type.totalQuestions,
                          0
                        )}
                      </h3>
                      <p className="card-text">Toplam Soru</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card text-center">
                    <div className="card-body">
                      <h3 className="text-info">{denemeTypes.length}</h3>
                      <p className="card-text">Deneme Türü</p>
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

export default dynamic(() => Promise.resolve(IceriklerPage), {
  ssr: false,
  loading: () => (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "50vh" }}
    >
      <LoadingSpinner />
    </div>
  ),
});

