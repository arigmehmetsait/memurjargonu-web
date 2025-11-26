"use client";

import { useRef, useState, type ChangeEvent } from "react";

interface ExcelColumn {
  name: string;
  required: boolean;
  description?: string;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  title?: string;
  description?: string;
  columns: ExcelColumn[];
  exampleData?: Array<Record<string, any>>;
  accept?: string;
  buttonText?: string;
  buttonIcon?: string;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onFileSelect,
  title = "Excel'den İçe Aktar",
  description,
  columns,
  exampleData,
  accept = ".xlsx,.xls,.csv",
  buttonText = "Dosya Seç",
  buttonIcon = "bi-file-earmark-excel",
}: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Input'u temizle ki aynı dosya tekrar seçilebilsin
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">
                <i className={`bi ${buttonIcon} me-2`}></i>
                {title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              {description && (
                <div className="mb-4">
                  <p className="text-muted small mb-0">{description}</p>
                </div>
              )}

              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Excel Dosyanızın Formatı
                </h6>
                <p className="text-muted small mb-3">
                  Excel dosyanızda ilk satır başlık olmalı, her satır bir kayıt
                  olmalıdır. Aşağıdaki örneği inceleyin:
                </p>

                {exampleData && exampleData.length > 0 && (
                  <div className="table-responsive">
                    <table
                      className="table table-bordered table-sm"
                      style={{
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
                      }}
                    >
                      <thead className="table-light">
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col.name}
                              className={`bg-primary text-white ${
                                col.required ? "" : ""
                              }`}
                            >
                              {col.name}
                              {col.required && (
                                <span className="text-warning ms-1">*</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exampleData.map((row, rowIdx) => (
                          <tr key={rowIdx}>
                            {columns.map((col) => {
                              const value = row[col.name] || "";
                              const isAnswer =
                                col.name.toLowerCase().includes("answer") &&
                                value;
                              return (
                                <td
                                  key={col.name}
                                  className={
                                    isAnswer
                                      ? "bg-success bg-opacity-10 fw-bold"
                                      : ""
                                  }
                                >
                                  {String(value)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="alert alert-warning mt-3 mb-0 small">
                  <strong>Önemli:</strong>
                  <ul className="mb-0 mt-2 ps-3">
                    {columns
                      .filter((col) => col.required)
                      .map((col) => (
                        <li key={col.name}>
                          <code>{col.name}</code> sütunu zorunludur
                          {col.description && ` - ${col.description}`}
                        </li>
                      ))}

                    <li>Boş satırlar otomatik olarak atlanır</li>
                  </ul>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className={`bi ${buttonIcon} me-2`}></i>
                  Excel Dosyası Seç
                </label>
                <div className="input-group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control"
                    accept={accept}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleButtonClick}
                  >
                    <i className={`bi ${buttonIcon} me-2`}></i>
                    {buttonText}
                  </button>
                </div>
                <small className="form-text text-muted">
                  {accept} formatında dosya seçebilirsiniz.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
