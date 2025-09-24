import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: string;
  active?: boolean;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeIcon?: string;
}

export default function Breadcrumb({
  items,
  className = "",
  showHome = true,
  homeIcon = "bi-house",
}: BreadcrumbProps) {
  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number) => {
    const isLast = index === items.length - 1;
    const isActive = item.active || isLast;

    return (
      <li
        key={index}
        className={`breadcrumb-item ${isActive ? "active" : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        {isActive ? (
          <span>
            {item.icon && <i className={`${item.icon} me-1`}></i>}
            {item.label}
          </span>
        ) : (
          <Link
            href={item.href || "#"}
            className="text-decoration-none text-muted"
          >
            {item.icon && <i className={`${item.icon} me-1`}></i>}
            {item.label}
          </Link>
        )}
      </li>
    );
  };

  return (
    <>
      <nav aria-label="breadcrumb" className={`mb-4 ${className}`}>
        <ol className="breadcrumb">
          {showHome && (
            <li className="breadcrumb-item">
              <Link href="/" className="text-decoration-none text-muted">
                <i className={`${homeIcon} me-1`}></i>
                Ana Sayfa
              </Link>
            </li>
          )}
          {items.map((item, index) => renderBreadcrumbItem(item, index))}
        </ol>
      </nav>

      <style jsx>{`
        :global(.breadcrumb a) {
          color: #6c757d !important;
          text-decoration: none !important;
        }
        :global(.breadcrumb a:hover) {
          color: #495057 !important;
          text-decoration: none !important;
        }
        :global(.breadcrumb-item.active) {
          color: #6c757d !important;
        }
      `}</style>
    </>
  );
}
