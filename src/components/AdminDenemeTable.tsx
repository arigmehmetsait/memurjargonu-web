"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Deneme, DenemeType, DENEME_API_ENDPOINTS } from "@/types/deneme";
import LoadingSpinner from "./LoadingSpinner";
import ConfirmModal from "./ConfirmModal";
import { toast } from "react-toastify";

interface AdminDenemeTableProps {
  denemeType: DenemeType;
  title: string;
  description?: string;
  onCreateClick?: () => void;
  onEditClick?: (deneme: Deneme) => void;
  className?: string;
}

export default function AdminDenemeTable({
  denemeType,
  title,
  description,
  onCreateClick,
  onEditClick,
  className = "",
}: AdminDenemeTableProps) {
  const router = useRouter();
  const [denemeler, setDenemeler] = useState<Deneme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [denemeToDelete, setDenemeToDelete] = useState<Deneme | null>(null);
  const [deleting, setDeleting] = useState(false);

  const apiEndpoint = DENEME_API_ENDPOINTS[denemeType].list;
  const deleteEndpoint = DENEME_API_ENDPOINTS[denemeType].admin.delete;

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

  const handleDeleteClick = (deneme: Deneme) => {
    setDenemeToDelete(deneme);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!denemeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(deleteEndpoint(denemeToDelete.id), {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setDenemeToDelete(null);
        fetchDenemeler(); // Listeyi yenile
        const deletedQuestionsCount = data.data?.deletedQuestionsCount || 0;
        toast.success(
          `"${
            data.data.denemeName || denemeToDelete.name
          }" denemesi başarıyla silindi. ${deletedQuestionsCount} soru da silindi.`
        );
      } else {
        toast.error(data.error || "Deneme silinemedi");
      }
    } catch (err) {
      console.error("Deneme silme hatası:", err);
      toast.error("Deneme silinirken bir hata oluştu");
    } finally {
      setDeleting(false);
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

  const getDenemeTypePath = () => {
    switch (denemeType) {
      case "mevzuat":
        return "denemeler";
      case "cografya":
        return "cografya-denemeler";
      case "tarih":
        return "tarih-denemeler";
      case "genel":
        return "genel-denemeler";
      default:
        return "denemeler";
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
            {title && (
              <h1 className="h2">
                <i className="bi bi-journal-text me-2"></i>
                {title}
              </h1>
            )}
            {description && <p className="text-muted mb-0">{description}</p>}
          </div>
          {onCreateClick && (
            <button className="btn btn-primary" onClick={onCreateClick}>
              <i className="bi bi-plus-circle me-2"></i>
              Yeni {getDenemeTypeLabel()} Denemesi Ekle
            </button>
          )}
        </div>
      )}

      {!title && !description && onCreateClick && (
        <div className="d-flex justify-content-end mb-4">
          <button className="btn btn-primary" onClick={onCreateClick}>
            <i className="bi bi-plus-circle me-2"></i>
            Yeni {getDenemeTypeLabel()} Denemesi Ekle
          </button>
        </div>
      )}

      {denemeler.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-journal-text display-1 text-muted"></i>
          <h3 className="mt-3 text-muted">Henüz deneme bulunmuyor</h3>
          <p className="text-muted">
            Henüz hiç {getDenemeTypeLabel().toLowerCase()} denemesi eklenmemiş.
          </p>
          {onCreateClick && (
            <button className="btn btn-primary mt-3" onClick={onCreateClick}>
              <i className="bi bi-plus-circle me-2"></i>
              İlk Denemeyi Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Deneme Adı</th>
                <th>Soru Sayısı</th>
                <th>ID</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {denemeler.map((deneme) => (
                <tr key={deneme.id}>
                  <td>
                    <div>
                      <strong>{deneme.name}</strong>
                      {deneme.description && (
                        <>
                          <br />
                          <small className="text-muted">
                            {deneme.description}
                          </small>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-primary">
                      {deneme.soruSayisi}
                    </span>
                  </td>
                  <td>
                    <code className="text-muted">{deneme.id}</code>
                  </td>
                  <td>
                    <div className="btn-group" role="group">
                      {denemeType !== "genel" && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          title="Denemeyi Görüntüle (Kullanıcı Görünümü)"
                          onClick={() => {
                            router.push(
                              `/${getDenemeTypePath()}/${encodeURIComponent(
                                deneme.id
                              )}`
                            );
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-outline-success btn-sm"
                        title="Soruları Yönet (Admin Görünümü)"
                        onClick={() => {
                          router.push(
                            `/admin/${getDenemeTypePath()}/${encodeURIComponent(
                              deneme.id
                            )}/sorular`
                          );
                        }}
                      >
                        <i className="bi bi-list-ul"></i>
                      </button>
                      {onEditClick && (
                        <button
                          className="btn btn-outline-warning btn-sm"
                          title="Düzenle"
                          onClick={() => onEditClick(deneme)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-outline-danger btn-sm"
                        title="Sil"
                        onClick={() => handleDeleteClick(deneme)}
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

      {/* Silme Onay Modalı */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDenemeToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Deneme Silme Onayı"
        message={
          denemeToDelete
            ? `"${
                denemeToDelete.name
              }" ${getDenemeTypeLabel().toLowerCase()} denemesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm sorular da silinecektir.`
            : ""
        }
        confirmText="Evet, Sil"
        cancelText="İptal"
        confirmVariant="danger"
        icon="bi-exclamation-triangle"
      />
    </div>
  );
}
