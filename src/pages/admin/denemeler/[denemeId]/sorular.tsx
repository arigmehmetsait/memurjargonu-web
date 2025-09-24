import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
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

export default function AdminSorularPage() {
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

      console.log("Sorular API'sine istek gönderiliyor...");
      const response = await fetch(`/api/denemeler/${denemeId}/sorular`);
      const data = await response.json();

      console.log("Sorular API yanıtı:", data);

      if (data.success) {
        setDenemeData(data.data);
        console.log("Sorular başarıyla yüklendi:", data.data);
      } else {
        setError(data.error || "Sorular yüklenemedi");
        console.error("API hatası:", data);
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
    <AdminGuard>
      <Head>
        <title>
          {denemeData?.denemeName || "Deneme"} Soruları - Admin Panel
        </title>
        <meta
          name="description"
          content={`${denemeData?.denemeName || "Deneme"} soruları yönetimi`}
        />
      </Head>

      <Header variant="admin" />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h2">
                  <i className="bi bi-list-ul me-2"></i>
                  {denemeData?.denemeName || "Deneme"} - Soru Yönetimi
                </h1>
                {denemeData && (
                  <p className="text-muted mb-0">
                    {denemeData.totalCount} soru • Admin Panel
                  </p>
                )}
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    window.open(`/denemeler/${denemeId}`, "_blank");
                  }}
                >
                  <i className="bi bi-eye me-2"></i>
                  Kullanıcı Görünümü
                </button>
                <button className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Soru Ekle
                </button>
              </div>
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
                <button className="btn btn-primary mt-3">
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Soruyu Ekle
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Soru</th>
                      <th>Seçenekler</th>
                      <th>Doğru Cevap</th>
                      <th>Zorluk</th>
                      <th>Konu</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denemeData.sorular.map((soru, index) => (
                      <tr key={soru.id}>
                        <td>
                          <div>
                            <strong>Soru {index + 1}:</strong>
                            <br />
                            <small className="text-muted">
                              {soru.soru.length > 100
                                ? soru.soru.substring(0, 100) + "..."
                                : soru.soru}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {soru.secenekler.map((secenek, secenekIndex) => (
                              <small
                                key={secenekIndex}
                                className={`p-1 rounded ${
                                  secenekIndex === soru.dogruSecenek
                                    ? "bg-success text-white"
                                    : "bg-light"
                                }`}
                              >
                                {String.fromCharCode(65 + secenekIndex)}.{" "}
                                {secenek.length > 30
                                  ? secenek.substring(0, 30) + "..."
                                  : secenek}
                              </small>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-success">
                            {String.fromCharCode(65 + soru.dogruSecenek)}
                          </span>
                          <br />
                          <small className="text-muted">
                            {soru.cevap.length > 30
                              ? soru.cevap.substring(0, 30) + "..."
                              : soru.cevap}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`badge ${getZorlukBadgeClass(
                              soru.zorluk
                            )}`}
                          >
                            {getZorlukText(soru.zorluk)}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">{soru.konu}</span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              title="Görüntüle"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-warning btn-sm"
                              title="Düzenle"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
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

            {denemeData && denemeData.sorular.length > 0 && (
              <div className="mt-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="card-title">
                          <i className="bi bi-info-circle me-2"></i>
                          İstatistikler
                        </h5>
                        <p className="card-text">
                          <strong>Toplam Soru:</strong> {denemeData.totalCount}
                          <br />
                          <strong>Zorluk Dağılımı:</strong>
                          <br />• Kolay:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "kolay"
                            ).length
                          }
                          <br />• Orta:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "orta"
                            ).length
                          }
                          <br />• Zor:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "zor"
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="card-title">
                          <i className="bi bi-gear me-2"></i>
                          Hızlı İşlemler
                        </h5>
                        <div className="d-grid gap-2">
                          <button className="btn btn-outline-primary btn-sm">
                            <i className="bi bi-download me-2"></i>
                            Soruları Dışa Aktar
                          </button>
                          <button className="btn btn-outline-secondary btn-sm">
                            <i className="bi bi-upload me-2"></i>
                            Soru İçe Aktar
                          </button>
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
    </AdminGuard>
  );
}
