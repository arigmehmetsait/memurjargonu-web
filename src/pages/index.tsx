import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-vh-100">
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display fw-bold mb-4 text-white">
                KPSS Çalışmanda Premium Destek
              </h1>
              <p className="lead mb-4">
                Güncel haritalar, videolu çözümler, forum ve daha fazlası ile
                KPSS'ye hazırlan. Premium üyelik ile sağla.
              </p>
              <div className="d-flex gap-3">
                {/* <Link
                  href="/icerikler"
                  className="btn btn-light btn-lg btn-custom"
                >
                  <i className="bi bi-collection me-2"></i>
                  İçerikleri Gör
                </Link> */}
                <Link
                  href="/plans"
                  className="btn btn-outline-light btn-lg btn-custom"
                >
                  <i className="bi bi-star-fill me-2"></i>
                  Paketleri Gör
                </Link>
              </div>
            </div>
            <div className="col-lg-4 text-center">
              <i className="bi bi-mortarboard display-1 text-white-50"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center mb-5">
              <h2 className="display-6 fw-bold mb-3">Neden Premium?</h2>
              <p className="lead text-muted">
                KPSS hazırlığınızda size özel içerikler ve avantajlar
              </p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 feature-card">
                <div className="card-body text-center p-4">
                  <div className="feature-icon mb-3">
                    <i
                      className="bi bi-geo-alt-fill text-secondary"
                      style={{ fontSize: "2rem" }}
                    ></i>
                  </div>
                  <h5 className="card-title fw-bold">Güncel Haritalar</h5>
                  <p className="card-text">
                    En güncel coğrafya haritaları ve interaktif içeriklerle
                    öğren.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 feature-card">
                <div className="card-body text-center p-4">
                  <div className="feature-icon mb-3">
                    <i
                      className="bi bi-play-circle-fill text-secondary"
                      style={{ fontSize: "2rem" }}
                    ></i>
                  </div>
                  <h5 className="card-title fw-bold">Videolu Çözümler</h5>
                  <p className="card-text">
                    Uzman öğretmenlerden detaylı video çözümler ve açıklamalar.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 feature-card">
                <div className="card-body text-center p-4">
                  <div className="feature-icon mb-3">
                    <i
                      className="bi bi-people-fill text-secondary"
                      style={{ fontSize: "2rem" }}
                    ></i>
                  </div>
                  <h5 className="card-title fw-bold">Aktif Forum</h5>
                  <p className="card-text">
                    Diğer adaylarla bilgi paylaşımı yap ve sorularını sor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Status Section
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body text-center p-4">
                  <h5 className="card-title mb-3">
                    <i className="bi bi-person-circle me-2"></i>
                    Hesap Durumunuz
                  </h5>
                  <div className="mb-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                  </div>
                  <p className="text-muted mb-0">
                    Giriş yaparak premium durumunuzu görüntüleyebilirsiniz.
                  </p>
                  <div className="mt-3">
                    <Link href="/login" className="btn btn-primary me-2">
                      <i className="bi bi-box-arrow-in-right me-1"></i>
                      Giriş Yap
                    </Link>
                    <Link href="/plans" className="btn btn-outline-primary">
                      <i className="bi bi-star me-1"></i>
                      Paketleri Gör
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <Footer />
    </div>
  );
}
