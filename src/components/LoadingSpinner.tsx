"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  text = "Yükleniyor...",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "spinner-border-sm",
    md: "",
    lg: "spinner-border-lg",
  };

  return (
    <div className={`text-center py-5 ${className}`}>
      <div
        className={`spinner-border text-primary ${sizeClass[size]}`}
        role="status"
      >
        <span className="visually-hidden">{text}</span>
      </div>
      {text && <div className="mt-2 text-muted">{text}</div>}
    </div>
  );
}
