import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AdminHome() {
  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        {/* Main Content */}
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Welcome Section */}
              <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-dark mb-3">
                  Admin Paneline Hoş Geldiniz
                </h1>
                <p className="lead text-muted">
                  KPSS Premium sistemini yönetmek için aşağıdaki bölümleri
                  kullanabilirsiniz.
                </p>
              </div>

              {/* Admin Cards */}
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-box-seam"></i>
                      </div>
                      <h5 className="card-title fw-bold">Plan Yönetimi</h5>
                      <p className="card-text text-muted">
                        Premium paketleri oluşturun, düzenleyin ve yönetin.
                        Fiyatları güncelleyin ve planları aktif/pasif yapın.
                      </p>
                      <Link
                        href="/admin/plans"
                        className="btn w-100"
                        style={{
                          backgroundColor: "black",
                          color: "#fff",
                        }}
                      >
                        Planları Yönet
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-people"></i>
                      </div>
                      <h5 className="card-title fw-bold">Kullanıcı Yönetimi</h5>
                      <p className="card-text text-muted">
                        Kullanıcıları yönetin, premium durumlarını kontrol edin
                        ve gelişmiş paket yönetimi yapın.
                      </p>
                      <Link
                        href="/admin/users"
                        className="btn w-100"
                        style={{
                          backgroundColor: "black",
                          color: "#fff",
                        }}
                      >
                        Kullanıcıları Yönet
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card d-flex flex-column">
                    <div className="card-body text-center p-4 d-flex flex-column h-100">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-receipt"></i>
                      </div>
                      <h5 className="card-title fw-bold">Sipariş Yönetimi</h5>
                      <p className="card-text text-muted">
                        Tüm siparişleri görüntüleyin, ödeme durumlarını takip
                        edin ve siparişleri yönetin.
                      </p>
                      <div className="mt-auto">
                        <Link
                          href="/admin/orders"
                          className="btn w-100"
                          style={{
                            backgroundColor: "black",
                            color: "#fff",
                          }}
                        >
                          Siparişleri Görüntüle
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card d-flex flex-column">
                    <div className="card-body text-center p-4 d-flex flex-column h-100">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-file-earmark-pdf"></i>
                      </div>
                      <h5 className="card-title fw-bold">İçerik Yönetimi</h5>
                      <p className="card-text text-muted">
                        Uygulama içeriklerini inceleyin, düzenleyin ve
                        güncelleyin.
                      </p>
                      <div className="mt-auto">
                        <Link
                          href="/admin/content"
                          className="btn w-100"
                          style={{
                            backgroundColor: "black",
                            color: "#fff",
                          }}
                        >
                          İçerikleri Yönet
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-stopwatch"></i>
                      </div>
                      <h5 className="card-title fw-bold">
                        Zamanlı Sınav Yönetimi
                      </h5>
                      <p className="card-text text-muted">
                        Zamanlı sınavları oluşturun, düzenleyin ve gerçek
                        zamanlı olarak izleyin.
                      </p>
                      <div className="d-grid gap-2">
                        <Link
                          href="/admin/timed-exams"
                          className="btn w-100"
                          style={{
                            backgroundColor: "black",
                            color: "#fff",
                          }}
                        >
                          Sınav Yönetimi
                        </Link>
                        {/* <Link
                          href="/admin/timed-exams/dashboard"
                          className="btn w-100"
                          style={{
                            backgroundColor: "#227387",
                            color: "#fff",
                          }}
                        >
                          Dashboard
                        </Link> */}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card d-flex flex-column">
                    <div className="card-body text-center p-4 d-flex flex-column h-100">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-calendar-week"></i>
                      </div>
                      <h5 className="card-title fw-bold">Ders Programları</h5>
                      <p className="card-text text-muted">
                        KPSS çalışma programlarını oluşturun, günleri düzenleyin
                        ve içerikleri güncel tutun.
                      </p>
                      <div className="mt-auto">
                        <Link
                          href="/admin/study-programs"
                          className="btn w-100"
                          style={{
                            backgroundColor: "black",
                            color: "#fff",
                          }}
                        >
                          Programları Yönet
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card d-flex flex-column">
                    <div className="card-body text-center p-4 d-flex flex-column h-100">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-crosshair"></i>
                      </div>
                      <h5 className="card-title fw-bold">Düello Yönetimi</h5>
                      <p className="card-text text-muted">
                        Düello sorularını düzenleyin, seçenekleri yönetin ve
                        kullanıcıların karşılaşacağı soruları güncel tutun.
                      </p>
                      <div className="mt-auto">
                        <Link
                          href="/admin/duello-questions"
                          className="btn w-100"
                          style={{
                            backgroundColor: "black",
                            color: "#fff",
                          }}
                        >
                          Düelloları Yönet
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card d-flex flex-column">
                    <div className="card-body text-center p-4 d-flex flex-column h-100">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-bug"></i>
                      </div>
                      <h5 className="card-title fw-bold">Problem Raporları</h5>
                      <p className="card-text text-muted">
                        Kullanıcıların bildirdiği problemleri görüntüleyin ve
                        durumlarını yönetin.
                      </p>
                      <div className="mt-auto">
                        <Link
                          href="/admin/problem-reports"
                          className="btn w-100"
                          style={{
                            backgroundColor: "black",
                            color: "#fff",
                          }}
                        >
                          Problem Raporları
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card d-flex flex-column">
                    <div className="card-body text-center p-4 d-flex flex-column h-100">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-bell"></i>
                      </div>
                      <h5 className="card-title fw-bold">Bildirim Yönetimi</h5>
                      <p className="card-text text-muted">
                        Kullanıcılara push bildirimleri gönderin ve bildirim
                        geçmişini görüntüleyin.
                      </p>
                      <div className="mt-auto">
                        <Link
                          href="/admin/notifications"
                          className="btn w-100"
                          style={{
                            backgroundColor: "black",
                            color: "#fff",
                          }}
                        >
                          Bildirimleri Yönet
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className="col-md-3">
                  <div className="card h-100 shadow-sm admin-card border-warning">
                    <div className="card-body text-center p-4">
                      <div className="admin-icon mb-3 text-warning">
                        <i className="bi bi-shield-exclamation"></i>
                      </div>
                      <h5 className="card-title fw-bold">Admin Kurtarma</h5>
                      <p className="card-text text-muted">
                        Admin yetkilerini kurtarmak için acil durum aracı.
                        Sadece gerektiğinde kullanın.
                      </p>
                      <Link
                        href="/admin/recover"
                        className="btn w-100"
                        style={{
                          backgroundColor: "black",
                          color: "#fff",
                        }}
                      >
                        Admin Kurtar
                      </Link>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
        <Footer variant="admin" />
      </div>
    </AdminGuard>
  );
}
