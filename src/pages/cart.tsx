"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { toast } from "react-toastify";

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [iframeToken, setIframeToken] = useState<string | null>(null);

  const totalPrice = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      toast.info("Ödeme başlatılıyor...");
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error("Ödeme yapmak için giriş yapmalısınız.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ cart }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ödeme başlatılamadı");
      }

      if (data.token) {
        setIframeToken(data.token);
      } else {
        throw new Error("PayTR token alınamadı");
      }

    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <Header />

      <section className="py-5">
        <div className="container">
          <h1 className="display-5 fw-bold mb-4">Sepetim</h1>

          {cart.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-cart-x display-1 text-muted mb-3"></i>
              <p className="lead text-muted">Sepetinizde ürün bulunmamaktadır.</p>
              <Link href="/plans" className="btn btn-primary btn-lg mt-3">
                Paketleri İncele
              </Link>
            </div>
          ) : (
            <div className="row">
              <div className="col-lg-8">
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="d-flex justify-content-between align-items-center border-bottom py-3 last-no-border"
                      >
                        <div>
                          <h5 className="mb-1">{item.name}</h5>
                          <small className="text-muted">
                            {item.periodMonths} Aylık Paket
                          </small>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span className="fw-bold fs-5 text-dark">
                            {item.price} {item.currency}
                          </span>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeFromCart(item.id)}
                            title="Sepetten Çıkar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title fw-bold mb-4 text-dark">Sipariş Özeti</h5>
                    <div className="d-flex justify-content-between mb-3 text-muted">
                      <span>Ara Toplam</span>
                      <span>{totalPrice} TRY</span>
                    </div>
                    <div className="d-flex justify-content-between mb-4 fw-bold fs-5 text-dark">
                      <span>Toplam</span>
                      <span className="text-primary">{totalPrice} TRY</span>
                    </div>

                    <button
                      className="btn btn-success btn-lg w-100"
                      onClick={handleCheckout}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-credit-card me-2"></i>
                          Ödemeyi Tamamla
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* PayTR Iframe Modal */}
          {iframeToken && (
            <div 
              className="modal fade show" 
              style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
              onClick={() => setIframeToken(null)}
            >
              <div 
                className="modal-dialog modal-dialog-centered modal-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">Güvenli Ödeme</h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => setIframeToken(null)}
                    ></button>
                  </div>
                  <div className="modal-body p-0">
                    <iframe
                      src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                      id="paytriframe"
                      frameBorder="0"
                      scrolling="yes"
                      style={{ width: "100%", height: "600px", border: "none" }}
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
