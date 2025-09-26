"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { Plan } from "@/types/plan";
import Link from "next/link";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [checkoutHtml, setCheckoutHtml] = useState<string | null>(null);
  console.log("plans", plans);
  useEffect(() => {
    const run = async () => {
      try {
        const q = query(
          collection(db, "plans"),
          where("isActive", "==", true),
          orderBy("index", "asc")
        );
        const snap = await getDocs(q);
        setPlans(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (err) {
        setMsg(`Planlar yüklenirken hata: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleSelect = async (plan: Plan) => {
    try {
      setMsg("Ödeme başlatılıyor…");
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setMsg("Giriş yapmalısın.");
        return;
      }

      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Checkout failed");

      setMsg(
        `Sipariş oluşturuldu ✅ (orderId: ${data.orderId}). Ödeme penceresi geliyor…`
      );
      setCheckoutHtml(data.checkoutFormContent); // 👈 iyzico HTML
    } catch (e: any) {
      setMsg(`Hata: ${e.message ?? String(e)}`);
    }
  };

  const simulatePaid = async () => {
    if (!orderId) return;
    try {
      setProcessing("payment");
      setMsg("Ödeme onaylanıyor…");
      const r = await fetch("/api/webhooks/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Webhook failed");

      await auth.currentUser?.getIdToken(true); // claim'leri yenile
      setMsg("Ödeme başarılı ✅ Premium açıldı (claim yenilendi).");
    } catch (e: any) {
      setMsg(`Webhook hata: ${e.message ?? String(e)}`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link href="/" className="navbar-brand">
            <i className="bi bi-mortarboard-fill me-2"></i>
            MEMUR JARGONU
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container">
          <div className="row text-center">
            <div className="col-lg-8 mx-auto">
              <h1 className="display-4 fw-bold mb-3">Paketler</h1>
              <p className="lead mb-0">
                KPSS hazırlığınız için en uygun paketi seçin ve başarıya giden
                yolda ilk adımı atın
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-5">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3">Paketler yükleniyor...</p>
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {plans.map((plan, index) => (
                <div key={plan.id} className="col-lg-4 col-md-6">
                  <div
                    className={`card pricing-card h-100 ${
                      index === 1 ? "featured" : ""
                    }`}
                  >
                    <div className="card-body p-4 text-center">
                      <h3 className="card-title fw-bold mb-3">{plan.name}</h3>

                      <div className="mb-4">
                        <span className="display-4 fw-bold text-primary">
                          {plan.price}
                        </span>
                        <span className="text-muted"> {plan.currency}</span>
                        <div className="text-muted small">
                          {plan.periodMonths} ay
                        </div>
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <ul className="list-unstyled mb-4 text-muted">
                          {plan.features.map((feature: string, i: number) => (
                            <li key={i} className="mb-2">
                              <i className="bi bi-check-circle-fill text-success me-2"></i>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        className="btn btn-primary btn-lg w-100"
                        onClick={() => handleSelect(plan)}
                        disabled
                        style={{
                          pointerEvents: "none",
                          opacity: 0.7,
                          cursor: "not-allowed",
                        }}
                      >
                        {processing === plan.id ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            İşleniyor...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-lock me-2"></i>
                            Satın Al (Yakında)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message */}
          {msg && (
            <div className="row justify-content-center mt-4">
              <div className="col-lg-8">
                <div
                  className={`alert ${
                    msg.includes("✅") ? "alert-success" : "alert-danger"
                  } alert-dismissible fade show`}
                  role="alert"
                >
                  <i
                    className={`bi ${
                      msg.includes("✅")
                        ? "bi-check-circle"
                        : "bi-exclamation-triangle"
                    } me-2`}
                  ></i>
                  {msg}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMsg(null)}
                  ></button>
                </div>
              </div>
            </div>
          )}

          {/* Iyzico Checkout Form */}
          {checkoutHtml && (
            <div className="row justify-content-center mt-4">
              <div className="col-lg-8">
                <div className="card border-primary">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-credit-card me-2"></i>
                      Ödeme İşlemi
                    </h5>
                  </div>
                  <div className="card-body">
                    <div dangerouslySetInnerHTML={{ __html: checkoutHtml }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Payment Section */}
          {orderId && (
            <div className="row justify-content-center mt-4">
              <div className="col-lg-8">
                <div className="card border-warning">
                  <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">
                      <i className="bi bi-flask me-2"></i>
                      Test Ödeme Sistemi
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3">
                      Geliştirme amaçlı test ödeme sistemi. Gerçek ödeme
                      yapmadan premium üyeliği aktifleştirmek için kullanın.
                    </p>
                    <div className="d-flex gap-3 align-items-center">
                      <button
                        className="btn btn-warning"
                        onClick={simulatePaid}
                        disabled={processing === "payment"}
                      >
                        {processing === "payment" ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            İşleniyor...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-credit-card me-2"></i>
                            Ödemeyi Başarılı Yap
                          </>
                        )}
                      </button>
                      <small className="text-white">
                        Order ID: <code>{orderId}</code>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="text-center mb-4">
                <h3 className="fw-bold text-dark">Tüm Paketlerde Dahil</h3>
                <p className="text-muted">Premium üyelik avantajları</p>
              </div>

              <div className="row g-4">
                <div className="col-md-3 col-6">
                  <div className="text-center">
                    <i className="bi bi-map text-primary display-6 mb-3"></i>
                    <h6 className="text-dark">Güncel Haritalar</h6>
                    <small className="text-muted">Coğrafya haritaları</small>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="text-center">
                    <i className="bi bi-play-circle text-primary display-6 mb-3"></i>
                    <h6 className="text-dark">Video Çözümler</h6>
                    <small className="text-muted">Uzman anlatımlar</small>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="text-center">
                    <i className="bi bi-people text-primary display-6 mb-3"></i>
                    <h6 className="text-dark">Aktif Forum</h6>
                    <small className="text-muted">Topluluk desteği</small>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="text-center">
                    <i className="bi bi-headset text-primary display-6 mb-3"></i>
                    <h6 className="text-dark">7/24 Destek</h6>
                    <small className="text-muted">Müşteri hizmetleri</small>
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
