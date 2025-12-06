"use client";
import Header from "@/components/Header";

export default function ContactPage() {
  return (
    <div className="min-vh-100 bg-light">
      <Header />

      {/* Hero Section */}
      <section
        className="py-5 text-white position-relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)",
          minHeight: "280px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.22) 0%, rgba(59,130,246,0.12) 40%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(0,227,255,0.15) 0%, rgba(59,130,246,0.13) 45%, transparent 75%)",
            pointerEvents: "none",
          }}
        />
        <div className="container position-relative">
          <div className="row text-center">
            <div className="col-lg-8 mx-auto">
              <h1
                className="display-3 fw-bold mb-4"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
              >
                İletişim
              </h1>
              <p
                className="lead fs-4 mb-0"
                style={{ textShadow: "0 1px 5px rgba(0,0,0,0.2)" }}
              >
                Bizimle iletişime geçin, sorularınızı yanıtlayalım
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="row g-4">
                {/* Phone Card */}
                <div className="col-md-6">
                  <div
                    className="card h-100 border-0 shadow-sm"
                    style={{
                      borderRadius: "20px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 40px rgba(59, 130, 246, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(0, 0, 0, 0.08)";
                    }}
                  >
                    <div className="card-body p-5 text-center">
                      <div
                        className="mb-4 mx-auto d-flex align-items-center justify-content-center"
                        style={{
                          width: "80px",
                          height: "80px",
                          background:
                            "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                          borderRadius: "20px",
                          color: "white",
                        }}
                      >
                        <i
                          className="bi bi-telephone-fill"
                          style={{ fontSize: "2.5rem" }}
                        ></i>
                      </div>
                      <h3
                        className="fw-bold mb-3"
                        style={{ fontSize: "1.5rem", color: "#1e293b" }}
                      >
                        Telefon
                      </h3>
                      <a
                        href="tel:+905411368190"
                        className="text-decoration-none"
                        style={{ color: "#3b82f6", fontSize: "1.25rem" }}
                      >
                        <i className="bi bi-phone me-2"></i>
                        0541 136 8190
                      </a>
                    </div>
                  </div>
                </div>

                {/* Address Card */}
                <div className="col-md-6">
                  <div
                    className="card h-100 border-0 shadow-sm"
                    style={{
                      borderRadius: "20px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 40px rgba(52, 211, 153, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(0, 0, 0, 0.08)";
                    }}
                  >
                    <div className="card-body p-5 text-center">
                      <div
                        className="mb-4 mx-auto d-flex align-items-center justify-content-center"
                        style={{
                          width: "80px",
                          height: "80px",
                          background:
                            "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                          borderRadius: "20px",
                          color: "white",
                        }}
                      >
                        <i
                          className="bi bi-geo-alt-fill"
                          style={{ fontSize: "2.5rem" }}
                        ></i>
                      </div>
                      <h3
                        className="fw-bold mb-3"
                        style={{ fontSize: "1.5rem", color: "#1e293b" }}
                      >
                        Adres
                      </h3>
                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "1rem",
                          lineHeight: "1.6",
                        }}
                      >
                        Kosova Mahallesi
                        <br />
                        Ata sitesi Selçuklu Konya
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="row mt-5">
                <div className="col-12">
                  <div
                    className="card border-0 shadow-sm p-4"
                    style={{
                      borderRadius: "20px",
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                    }}
                  >
                    <div className="text-center">
                      <h4
                        className="fw-bold mb-3"
                        style={{ color: "#1e293b", fontSize: "1.5rem" }}
                      >
                        <i
                          className="bi bi-info-circle me-2"
                          style={{ color: "#3b82f6" }}
                        ></i>
                        Bize Ulaşın
                      </h4>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "1rem", lineHeight: "1.6" }}
                      >
                        Sorularınız, önerileriniz veya destek talepleriniz için
                        bizimle iletişime geçebilirsiniz. Size en kısa sürede
                        dönüş yapacağız.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h6>MEMUR JARGONU</h6>
              <p className="text-muted mb-0">
                KPSS hazırlığınızda yanınızdayız.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="text-muted mb-0">
                © 2025 MEMUR JARGONU. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
