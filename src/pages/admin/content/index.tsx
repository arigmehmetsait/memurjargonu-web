import { useRouter } from "next/router";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function ContentManagement() {
  const router = useRouter();

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        {/* Main Content */}
        <div className="container py-5">
          <div className="row">
            <div className="col-12">
              {/* Page Header */}
              <div className="text-center mb-5">
                <button
                  className="btn btn-outline-secondary mb-3"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                <h1 className="display-5 fw-bold text-dark mb-3">
                  <i className="bi bi-collection me-3"></i>
                  İçerik Yönetimi
                </h1>
                <p className="lead text-muted">
                  PDF dosyalarını ve denemeleri yönetin, kategorilere göre
                  organize edin ve kullanıcı erişimlerini kontrol edin.
                </p>
              </div>

              {/* Content Management Cards */}
              <div className="row g-4 mb-5">
                <div className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm admin-card">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-file-earmark-pdf"></i>
                      </div>
                      <h5 className="card-title fw-bold">
                        PDF İçerik Yönetimi
                      </h5>
                      <p className="card-text text-muted">
                        PDF dosyalarını yönetin, kategorilere göre organize edin
                        ve kullanıcı erişimlerini kontrol edin.
                      </p>
                      <Link
                        href="/admin/content/pdf-management"
                        className="btn btn-primary w-100"
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        PDF'leri Yönet
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm admin-card">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-journal-text"></i>
                      </div>
                      <h5 className="card-title fw-bold">
                        Deneme İçerik Yönetimi
                      </h5>
                      <p className="card-text text-muted">
                        Mevzuat, Coğrafya, Tarih ve Genel denemeleri yönetin,
                        soruları düzenleyin ve yeni denemeler oluşturun.
                      </p>
                      <Link
                        href="/admin/denemeler-yonetimi"
                        className="btn btn-success w-100"
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        Denemeleri Yönet
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm admin-card">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-check2-square"></i>
                      </div>
                      <h5 className="card-title fw-bold">
                        Doğru-Yanlış Yönetimi
                      </h5>
                      <p className="card-text text-muted">
                        Doğru-yanlış denemelerini oluşturun, düzenleyin ve
                        yönetin. Soruları ekleyin ve düzenleyin.
                      </p>
                      <Link
                        href="/admin/dogru-yanlis"
                        className="btn btn-warning w-100"
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        Doğru-Yanlış Yönet
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm admin-card">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-pencil-square"></i>
                      </div>
                      <h5 className="card-title fw-bold">
                        Boşluk Doldurma Yönetimi
                      </h5>
                      <p className="card-text text-muted">
                        Boşluk doldurma denemelerini oluşturun, düzenleyin ve
                        yönetin. Soruları ekleyin ve düzenleyin.
                      </p>
                      <Link
                        href="/admin/bosluk-doldurma"
                        className="btn btn-info w-100"
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        Boşluk Doldurma Yönet
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer variant="admin" />
      </div>
    </AdminGuard>
  );
}
