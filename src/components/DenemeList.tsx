"use client";
import { useState, useEffect } from "react";
import { Deneme, DenemeType, DENEME_API_ENDPOINTS } from "@/types/deneme";
import LoadingSpinner from "./LoadingSpinner";

interface DenemeListProps {
  denemeType: DenemeType;
  title: string;
  description?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  onDenemeClick?: (deneme: Deneme) => void;
  className?: string;
}

export default function DenemeList({
  denemeType,
  title,
  description,
  showCreateButton = false,
  onCreateClick,
  onDenemeClick,
  className = "",
}: DenemeListProps) {
  const [denemeler, setDenemeler] = useState<Deneme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiEndpoint = DENEME_API_ENDPOINTS[denemeType].list;

  useEffect(() => {
    fetchDenemeler();
  }, [denemeType]);

  const fetchDenemeler = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiEndpoint);
      const data = await response.json();

      if (data.success) {
        setDenemeler(data.data);
      } else {
        const errorMsg = data.error || "Denemeler yüklenemedi";
        const details = data.details ? ` (${data.details})` : "";
        setError(errorMsg + details);
      }
    } catch (err) {
      console.error(`${denemeType} denemeleri yüklenirken hata:`, err);
      setError(
        "Denemeler yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDenemeClick = (deneme: Deneme) => {
    if (onDenemeClick) {
      onDenemeClick(deneme);
    } else {
      // Varsayılan davranış: deneme detay sayfasına git
      const path =
        denemeType === "mevzuat"
          ? "denemeler"
          : denemeType === "cografya"
          ? "cografya-denemeler"
          : "tarih-denemeler";
      window.location.href = `/${path}/${encodeURIComponent(deneme.id)}`;
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-5 ${className}`}>
        <LoadingSpinner />
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
          onClick={fetchDenemeler}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {(title || description) && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            {title && <h2 className="h3 mb-1">{title}</h2>}
            {description && <p className="text-muted mb-0">{description}</p>}
          </div>
          {showCreateButton && onCreateClick && (
            <button className="btn btn-primary" onClick={onCreateClick}>
              <i className="bi bi-plus-circle me-2"></i>
              Yeni Deneme Ekle
            </button>
          )}
        </div>
      )}

      {denemeler.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-journal-text display-1 text-muted"></i>
          <h3 className="mt-3 text-muted">Henüz deneme bulunmuyor</h3>
          <p className="text-muted">
            {denemeType === "mevzuat"
              ? "Henüz hiç mevzuat denemesi eklenmemiş."
              : "Henüz hiç coğrafya denemesi eklenmemiş."}
          </p>
          {showCreateButton && onCreateClick && (
            <button className="btn btn-primary mt-3" onClick={onCreateClick}>
              <i className="bi bi-plus-circle me-2"></i>
              İlk Denemeyi Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="row">
          {denemeler.map((deneme) => (
            <div key={deneme.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{deneme.name}</h5>
                  {deneme.description && (
                    <p className="card-text text-muted small">
                      {deneme.description}
                    </p>
                  )}
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-primary">
                        {deneme.soruSayisi} soru
                      </span>
                      <small className="text-muted">
                        {denemeType === "mevzuat"
                          ? "Mevzuat"
                          : denemeType === "cografya"
                          ? "Coğrafya"
                          : "Tarih"}
                      </small>
                    </div>
                    <button
                      className="btn btn-outline-primary w-100"
                      onClick={() => handleDenemeClick(deneme)}
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
    </div>
  );
}
