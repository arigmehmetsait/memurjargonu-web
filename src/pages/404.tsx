import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Sayfa Bulunamadı | MEMUR JARGONU</title>
        <meta name="description" content="Aradığınız sayfa bulunamadı." />
      </Head>

      <div className="min-vh-100 d-flex flex-column">
        <Header />

        <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-6 text-center">
                {/* 404 Icon */}
                <div className="mb-4">
                  <i
                    className="bi bi-exclamation-triangle-fill"
                    style={{
                      fontSize: "8rem",
                      color: "#ffc107",
                    }}
                  ></i>
                </div>

                {/* 404 Text */}
                <h1
                  className="display-1 fw-bold mb-3"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  404
                </h1>

                {/* Error Message */}
                <h2 className="h3 mb-3 text-dark">Sayfa Bulunamadı</h2>
                <p className="lead text-muted mb-4">
                  Üzgünüz, aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </p>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                  <Link href="/" className="btn btn-primary btn-lg">
                    <i className="bi bi-house-door me-2"></i>
                    Ana Sayfaya Dön
                  </Link>
                  <button
                    onClick={() => window.history.back()}
                    className="btn btn-outline-secondary btn-lg"
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Geri Git
                  </button>
                </div>

                {/* Helpful Links */}
                <div className="mt-5 pt-4 border-top">
                  <p className="text-muted mb-3">Belki bunlar ilginizi çekebilir:</p>
                  <div className="d-flex flex-wrap justify-content-center gap-3">
                    <Link href="/plans" className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-star me-1"></i>
                      Paketler
                    </Link>
                    <Link href="/profile" className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-person me-1"></i>
                      Profilim
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

