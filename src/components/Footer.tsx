"use client";

interface FooterProps {
  variant?: "default" | "admin";
}

export default function Footer({ variant = "default" }: FooterProps) {
  if (variant === "admin") {
    return (
      <footer className="bg-secondary text-dark py-4 mt-5">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-white">
                <i className="bi bi-shield-check me-2"></i>
                Admin Panel
              </h6>
              <p className="text-white mb-0">Memur Jargonu sistem yönetimi.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="text-white mb-0">
                © 2025 MEMUR JARGONU. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-dark text-white py-4">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h6 className="text-white">
              <i className="bi bi-mortarboard-fill me-2"></i>
              MEMUR JARGONU
            </h6>
            <p className="text-white mb-0">
              Memur Jargonu hazırlığınızda yanınızdayız.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="text-white mb-0">
              © 2025 MEMUR JARGONU. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
