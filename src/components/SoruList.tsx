"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Soru, DenemeType, DENEME_API_ENDPOINTS } from "@/types/deneme";
import LoadingSpinner from "./LoadingSpinner";

interface SoruListProps {
  denemeType: DenemeType;
  denemeId: string;
  isAdmin?: boolean;
  className?: string;
}

export default function SoruList({
  denemeType,
  denemeId,
  isAdmin = false,
  className = "",
}: SoruListProps) {
  const router = useRouter();
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denemeName, setDenemeName] = useState("");

  const apiEndpoint = DENEME_API_ENDPOINTS[denemeType].sorular(denemeId);

  useEffect(() => {
    if (denemeId) {
      fetchSorular();
    }
  }, [denemeId, denemeType]);

  const fetchSorular = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiEndpoint);
      const data = await response.json();

      if (data.success) {
        setSorular(data.data.sorular || []);
        setDenemeName(data.data.denemeName || denemeId);
      } else {
        setError(data.error || "Sorular yüklenemedi");
      }
    } catch (err) {
      console.error(`${denemeType} soruları yüklenirken hata:`, err);
      setError(
        "Sorular yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const getZorlukBadgeClass = (zorluk: string) => {
    switch (zorluk?.toLowerCase()) {
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
    switch (zorluk?.toLowerCase()) {
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

  const getDenemeTypeLabel = () => {
    switch (denemeType) {
      case "mevzuat":
        return "Mevzuat";
      case "cografya":
        return "Coğrafya";
      case "tarih":
        return "Tarih";
      case "genel":
        return "Genel";
      default:
        return "Deneme";
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-5 ${className}`}>
        <LoadingSpinner />
        <p className="mt-3 text-muted">Sorular yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`alert alert-danger ${className}`} role="alert">
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
    );
  }

  if (sorular.length === 0) {
    return (
      <div className={`text-center py-5 ${className}`}>
        <i className="bi bi-question-circle display-1 text-muted"></i>
        <h3 className="mt-3 text-muted">Henüz soru bulunmuyor</h3>
        <p className="text-muted">
          Bu {getDenemeTypeLabel().toLowerCase()} denemesinde henüz hiç soru
          eklenmemiş.
        </p>
        {isAdmin && (
          <button className="btn btn-primary mt-3">
            <i className="bi bi-plus-circle me-2"></i>
            İlk Soruyu Ekle
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2">
            <i className="bi bi-list-ul me-2"></i>
            {denemeName} - {getDenemeTypeLabel()} Soruları
          </h1>
          <p className="text-muted mb-0">
            {sorular.length} soru •{" "}
            {isAdmin ? "Admin Panel" : "Kullanıcı Görünümü"}
          </p>
        </div>
        {isAdmin && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.back()}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Geri Dön
            </button>
            {denemeType !== "genel" && (
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  const path =
                    denemeType === "mevzuat"
                      ? "denemeler"
                      : denemeType === "cografya"
                      ? "cografya-denemeler"
                      : "tarih-denemeler";
                  window.open(`/${path}/${denemeId}`, "_blank");
                }}
              >
                <i className="bi bi-eye me-2"></i>
                Kullanıcı Görünümü
              </button>
            )}
            <button className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Yeni Soru Ekle
            </button>
          </div>
        )}
      </div>

      <div className="row">
        {sorular.map((soru, index) => (
          <div key={soru.id} className="col-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Soru {index + 1}</h5>
              </div>
              <div className="card-body">
                <p className="card-text mb-3">{soru.soru}</p>

                <div className="row">
                  {soru.secenekler.map((secenek, secenekIndex) => (
                    <div key={secenekIndex} className="col-md-6 mb-2">
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
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="alert alert-success">
                    <strong>Doğru Cevap:</strong> {soru.cevap}
                  </div>
                  {soru.aciklama && (
                    <div className="alert alert-info">
                      <strong>Açıklama:</strong> {soru.aciklama}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-3">
                    <div className="btn-group" role="group">
                      <button className="btn btn-outline-primary btn-sm">
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn btn-outline-warning btn-sm">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-outline-danger btn-sm">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sorular.length > 0 && (
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
                    <strong>Toplam Soru:</strong> {sorular.length}
                    <br />
                    <strong>Deneme Türü:</strong> {getDenemeTypeLabel()}
                  </p>
                </div>
              </div>
            </div>
            {isAdmin && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
