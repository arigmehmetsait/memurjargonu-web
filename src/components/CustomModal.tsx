"use client";
import { useEffect } from "react";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export default function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: CustomModalProps) {
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

  const sizeClasses = {
    sm: "modal-sm",
    md: "",
    lg: "modal-lg",
    xl: "modal-xl",
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className={`modal-content ${sizeClasses[size]}`}>
          {/* Modal Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-info-circle me-2"></i>
              {title}
            </h5>
            {showCloseButton && (
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            )}
          </div>

          {/* Modal Body */}
          <div className="modal-body">{children}</div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              <i className="bi bi-x-circle me-1"></i>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
