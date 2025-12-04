"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";

export default function AdminRecoverPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUid, setTargetUid] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/admin/recover", {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetUid,
          secretKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `✅ ${data.message} - ${data.userEmail}`,
        });
        setTargetUid("");
        setSecretKey("");
      } else {
        setMessage({ type: "error", text: `❌ ${data.error}` });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: `❌ Hata: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            {/* Breadcrumb */}
            <Breadcrumb
              showHome={false}
              items={[
                { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                {
                  label: "Admin Kurtarma",
                  icon: "bi-shield-exclamation",
                  active: true,
                },
              ]}
            />
            <div className="card shadow">
              <div className="card-header bg-warning text-dark">
                <h4 className="mb-0">
                  <i className="bi bi-shield-exclamation me-2"></i>
                  Admin Yetkisi Kurtarma Aracı
                </h4>
              </div>
              <div className="card-body p-4">
                <div className="alert alert-info">
                  <h6>
                    <i className="bi bi-info-circle me-2"></i>Bilgi:
                  </h6>
                  <ul className="mb-0">
                    <li>Bu araç admin yetkilerini kurtarmak için kullanılır</li>
                    <li>Sadece seed listesindeki UID'ler admin yapılabilir</li>
                    <li>Secret key gereklidir (güvenlik için)</li>
                    <li>
                      İşlem sonrası kullanıcının yeniden giriş yapması gerekir
                    </li>
                  </ul>
                </div>

                {message.text && (
                  <div
                    className={`alert mb-4 d-flex align-items-center ${
                      message.type === "success"
                        ? "alert-success"
                        : "alert-danger"
                    }`}
                  >
                    <i
                      className={`bi ${
                        message.type === "success"
                          ? "bi-check-circle-fill"
                          : "bi-exclamation-triangle-fill"
                      } me-2`}
                    ></i>
                    <span>{message.text}</span>
                  </div>
                )}

                <form onSubmit={handleRecover}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-person me-2"></i>
                      Hedef Kullanıcı UID
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={targetUid}
                      onChange={(e) => setTargetUid(e.target.value)}
                      placeholder="Admin yetkisi kurtarılacak kullanıcının UID'si"
                      required
                    />
                    <div className="form-text">
                      Admin yetkisi kurtarılacak kullanıcının Firebase UID'si
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-key me-2"></i>
                      Secret Key
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Güvenlik anahtarı"
                      required
                    />
                    <div className="form-text">
                      Admin kurtarma işlemi için gerekli güvenlik anahtarı
                    </div>
                  </div>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <a href="/admin" className="btn btn-secondary me-md-2">
                      <i className="bi bi-arrow-left me-2"></i>
                      Admin Paneli
                    </a>
                    <button
                      type="submit"
                      className="btn btn-warning"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Kurtarılıyor...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-shield-check me-2"></i>
                          Admin Yetkisini Kurtar
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
