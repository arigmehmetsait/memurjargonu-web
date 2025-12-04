"use client";
import { useMemo } from "react";

export interface PaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

export default function Pagination({
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
}: PaginationProps) {
  const totalPages = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * pageSize + 1,
    [currentPage, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(currentPage * pageSize, total),
    [currentPage, pageSize, total]
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Tüm sayfaları göster
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // İlk sayfa
      pages.push(1);

      if (currentPage <= 3) {
        // Başta
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Sonda
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Ortada
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (total === 0) {
    return null;
  }

  return (
    <div
      className={`d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 ${className}`}
    >
      {/* Bilgi */}
      <div className="text-muted small">
        <span>
          {startIndex}-{endIndex} / {total} kayıt
        </span>
        {showPageSizeSelector && onPageSizeChange && (
          <span className="ms-3">
            Sayfa başına:
            <select
              className="form-select form-select-sm d-inline-block ms-2"
              style={{ width: "auto" }}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>

      {/* Sayfa Numaraları */}
      <nav aria-label="Sayfa navigasyonu">
        <ul className="pagination pagination-sm mb-0">
          {/* Önceki Sayfa */}
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Önceki sayfa"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {/* Sayfa Numaraları */}
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <li key={`ellipsis-${index}`} className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              );
            }

            const pageNum = page as number;
            return (
              <li
                key={pageNum}
                className={`page-item ${
                  currentPage === pageNum ? "active" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(pageNum)}
                  aria-label={`Sayfa ${pageNum}`}
                  aria-current={currentPage === pageNum ? "page" : undefined}
                >
                  {pageNum}
                </button>
              </li>
            );
          })}

          {/* Sonraki Sayfa */}
          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Sonraki sayfa"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
