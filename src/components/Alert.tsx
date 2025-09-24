"use client";

interface AlertProps {
  type: "success" | "danger" | "warning" | "info";
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function Alert({
  type,
  message,
  onClose,
  className = "",
}: AlertProps) {
  const typeConfig = {
    success: {
      class: "alert-success",
      icon: "bi-check-circle",
    },
    danger: {
      class: "alert-danger",
      icon: "bi-exclamation-triangle",
    },
    warning: {
      class: "alert-warning",
      icon: "bi-exclamation-triangle",
    },
    info: {
      class: "alert-info",
      icon: "bi-info-circle",
    },
  };

  const config = typeConfig[type];

  return (
    <div className={`alert ${config.class} ${className}`} role="alert">
      <i className={`bi ${config.icon} me-2`}></i>
      {message}
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        ></button>
      )}
    </div>
  );
}
