import Link from "next/link";
import Header from "@/components/Header";
import { useRouter } from "next/router";

export default function PaymentFailPage() {
  const router = useRouter();
  const { fail_message } = router.query;

  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card shadow-sm border-danger">
              <div className="card-body p-5">
                <div className="mb-4">
                  <i className="bi bi-x-circle-fill text-danger display-1"></i>
                </div>
                <h2 className="fw-bold text-danger mb-3">Ödeme Başarısız</h2>
                <p className="lead text-muted mb-4">
                  Ödeme işlemi sırasında bir hata oluştu.
                  {fail_message && (
                    <span className="d-block mt-2 small text-danger">
                      Hata Detayı: {fail_message}
                    </span>
                  )}
                </p>
                <div className="d-grid gap-2">
                  <Link href="/cart" className="btn btn-primary btn-lg">
                    Tekrar Dene
                  </Link>
                  <Link href="/" className="btn btn-outline-secondary">
                    Ana Sayfaya Dön
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
