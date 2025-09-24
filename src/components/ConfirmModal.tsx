"use client";
import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger" | "warning" | "success";
  icon?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  confirmVariant = "primary",
  icon = "bi-question-circle",
}: ConfirmModalProps) {
  // ESC tuşu ile modal'ı kapat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Modal açıkken body scroll'unu engelle
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIconColor = () => {
    switch (confirmVariant) {
      case "danger":
        return "text-danger";
      case "warning":
        return "text-warning";
      case "success":
        return "text-success";
      default:
        return "text-primary";
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bi ${icon} me-2 ${getIconColor()}`}></i>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            <div className="text-center">
              <i className={`bi ${icon} display-4 ${getIconColor()} mb-3`}></i>
              <p className="mb-0 text-dark">{message}</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="bi bi-x-circle me-1"></i>
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn btn-${confirmVariant}`}
              onClick={handleConfirm}
            >
              <i className="bi bi-check-circle me-1"></i>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
