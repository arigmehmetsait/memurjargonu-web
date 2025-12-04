import Link from "next/link";
import { useEffect } from "react";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";

export default function PaymentSuccessPage() {
  const { clearCart } = useCart();

  // Clear cart when payment is successful (only once on mount)
  useEffect(() => {
    console.log("Payment success page mounted - clearing cart");
    try {
      clearCart();
      // Also clear localStorage directly as a safeguard
      localStorage.removeItem("cart");
      console.log("Cart cleared successfully");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="card shadow-sm border-success">
              <div className="card-body p-5">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success display-1"></i>
                </div>
                <h2 className="fw-bold text-success mb-3">Ödeme Başarılı!</h2>
                <p className="lead text-muted mb-4">
                  Siparişiniz başarıyla alındı. Paketiniz hesabınıza tanımlanmıştır.
                </p>
                <div className="d-grid gap-2">
                  <Link href="/profile" className="btn btn-primary btn-lg">
                    Profilime Git
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
