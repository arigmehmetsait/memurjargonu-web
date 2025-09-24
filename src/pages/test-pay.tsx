"use client";
import { useState } from "react";
import Link from "next/link";

export default function TestPay() {
  const [orderId, setOrderId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const go = async () => {
    if (!orderId.trim()) {
      setMsg("Lütfen bir Order ID girin.");
      return;
    }

    setLoading(true);
    setMsg("Gönderiliyor…");

    try {
      const r = await fetch("/api/webhooks/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const t = await r.text();
      setMsg(t);
    } catch (error) {
      setMsg(`Hata: ${error}`);
    } finally {
      setLoading(false);
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
          <div className="d-flex gap-2">
            <Link href="/plans" className="btn btn-outline-light btn-sm">
              <i className="bi bi-box-seam me-1"></i>
              Paketler
            </Link>
            <Link href="/" className="btn btn-outline-light btn-sm">
              <i className="bi bi-arrow-left me-1"></i>
              Ana Sayfa
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-warning text-dark">
                <h4 className="mb-0">
                  <i className="bi bi-flask me-2"></i>
                  Test Ödeme Sistemi
                </h4>
              </div>
              <div className="card-body p-4">
                <div className="alert alert-info" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Geliştirici Notu:</strong> Bu sayfa sadece test
                  amaçlıdır. Gerçek ödeme yapmadan premium üyeliği
                  aktifleştirmek için kullanılır.
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    go();
                  }}
                >
                  <div className="mb-3">
                    <label htmlFor="orderId" className="form-label">
                      <i className="bi bi-receipt me-2"></i>
                      Order ID
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="orderId"
                      placeholder="Sipariş ID'sini girin"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      required
                    />
                    <div className="form-text">
                      Paket satın alma işleminden sonra aldığınız Order ID'yi
                      buraya girin.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-warning btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
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
                </form>

                {/* Message */}
                {msg && (
                  <div className="mt-4">
                    <div
                      className={`alert ${
                        msg.includes("✅") || msg.includes("success")
                          ? "alert-success"
                          : "alert-danger"
                      } alert-dismissible fade show`}
                      role="alert"
                    >
                      <i
                        className={`bi ${
                          msg.includes("✅") || msg.includes("success")
                            ? "bi-check-circle"
                            : "bi-exclamation-triangle"
                        } me-2`}
                      ></i>
                      <strong>Sonuç:</strong>
                      <pre
                        className="mt-2 mb-0"
                        style={{ fontSize: "0.875rem", whiteSpace: "pre-wrap" }}
                      >
                        {msg}
                      </pre>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMsg(null)}
                      ></button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="card mt-4 border-0 bg-light">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="bi bi-question-circle me-2"></i>
                  Nasıl Kullanılır?
                </h6>
                <ol className="small text-muted mb-0">
                  <li>
                    Önce{" "}
                    <Link href="/plans" className="text-decoration-none">
                      Paketler
                    </Link>{" "}
                    sayfasından bir paket seçin
                  </li>
                  <li>
                    Sipariş oluşturulduktan sonra aldığınız Order ID'yi
                    kopyalayın
                  </li>
                  <li>
                    Bu sayfada Order ID'yi yapıştırın ve "Ödemeyi Başarılı Yap"
                    butonuna basın
                  </li>
                  <li>Premium üyeliğiniz otomatik olarak aktifleşecektir</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-5">
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
