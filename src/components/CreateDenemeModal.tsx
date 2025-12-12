"use client";
import { useState, useEffect } from "react";
import { DenemeType } from "@/types/deneme";
import { toast } from "react-toastify";

interface CreateDenemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  denemeType: DenemeType;
  initialData?: {
    id: string;
    name: string;
    description?: string;
  } | null;
  className?: string;
}

export default function CreateDenemeModal({
  isOpen,
  onClose,
  onSuccess,
  denemeType,
  initialData,
  className = "",
}: CreateDenemeModalProps) {
  const [denemeName, setDenemeName] = useState("");
  const [denemeDescription, setDenemeDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Initial data değiştiğinde state'i güncelle
  useEffect(() => {
    if (isOpen && initialData) {
      setDenemeName(initialData.name);
      setDenemeDescription(initialData.description || "");
    } else if (isOpen && !initialData) {
      setDenemeName("");
      setDenemeDescription("");
    }
  }, [isOpen, initialData]);

  const isEditing = !!initialData;

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

  const getApiEndpoint = () => {
    // @ts-ignore - update endpoint'i eklendi ama tip hatası alabiliriz
    const endpoints = DENEME_API_ENDPOINTS[denemeType];
    return isEditing ? endpoints.admin.update : endpoints.admin.create;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!denemeName.trim()) {
      toast.warn("Deneme adı gereklidir");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(getApiEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: denemeName.trim(),
          description: denemeDescription.trim(),
          ...(isEditing && { id: initialData.id }),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Başarılı - modal'ı kapat ve formu temizle
        setDenemeName("");
        setDenemeDescription("");
        onClose();
        onSuccess();
        onSuccess();
        toast.success(
          isEditing
            ? "Deneme başarıyla güncellendi!"
            : "Deneme başarıyla oluşturuldu!"
        );
      } else {
        toast.error(
          data.error ||
            (isEditing ? "Deneme güncellenemedi" : "Deneme oluşturulamadı")
        );
      }
    } catch (err) {
      console.error("Deneme oluşturma hatası:", err);
      toast.error(
        isEditing
          ? "Deneme güncellenirken bir hata oluştu"
          : "Deneme oluşturulurken bir hata oluştu"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setDenemeName("");
      setDenemeDescription("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal show d-block ${className}`}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={isEditing ? "bi bi-pencil me-2" : "bi bi-plus-circle me-2"}></i>
              {isEditing ? "Denemeyi Düzenle" : `Yeni ${getDenemeTypeLabel()} Denemesi Ekle`}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={creating}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="denemeName" className="form-label">
                  Deneme Adı <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="denemeName"
                  value={denemeName}
                  onChange={(e) => setDenemeName(e.target.value)}
                  placeholder={`Örn: ${getDenemeTypeLabel()} Deneme 1`}
                  disabled={creating || isEditing} // İsim değişikliği şimdilik kapalı
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="denemeDescription" className="form-label">
                  Açıklama
                </label>
                <textarea
                  className="form-control"
                  id="denemeDescription"
                  rows={3}
                  value={denemeDescription}
                  onChange={(e) => setDenemeDescription(e.target.value)}
                  placeholder={`${getDenemeTypeLabel()} denemesi hakkında açıklama (opsiyonel)`}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={creating}
              >
                <i className="bi bi-x-circle me-2"></i>
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating || !denemeName.trim()}
              >
                {creating ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {isEditing ? "Güncelleniyor..." : "Oluşturuluyor..."}
                  </>
                ) : (
                  <>
                    <i className={isEditing ? "bi bi-check-lg me-2" : "bi bi-check-circle me-2"}></i>
                    {isEditing ? "Güncelle" : "Oluştur"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
