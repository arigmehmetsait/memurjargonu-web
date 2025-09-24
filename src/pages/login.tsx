"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ✅ Kullanıcı UID'ini ekranda gösterelim
      setMsg(`Giriş başarılı ✅ `);

      // Token'ı al ve admin kontrolü yap
      const tokenResult = await cred.user.getIdTokenResult(true);
      const isAdmin = tokenResult.claims?.admin === true;

      // 1.5 saniye bekle ki kullanıcı başarı mesajını görebilsin, sonra yönlendir
      setTimeout(() => {
        if (isAdmin) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }, 1500);
    } catch (e: any) {
      setMsg(`Giriş hatası ❌: ${e.message ?? "Bilinmeyen hata"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <Link href="/" className="text-decoration-none">
                    <i className="bi bi-mortarboard-fill text-primary display-4"></i>
                  </Link>
                  <h2 className="mt-3 mb-1">Giriş Yap</h2>
                  <p className="text-white">
                    MEMUR JARGONU hesabınıza giriş yapın
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label text-dark">
                      <i className="bi bi-envelope me-2"></i>
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label text-dark">
                      <i className="bi bi-lock me-2"></i>
                      Şifre
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Giriş Yapılıyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Giriş Yap
                      </>
                    )}
                  </button>
                </form>

                {/* Message */}
                {msg && (
                  <div
                    className={`alert ${
                      msg.includes("✅") ? "alert-success" : "alert-danger"
                    } mt-3`}
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
                  </div>
                )}

                {/* Links */}
                <div className="text-center mt-4">
                  <p className="text-white  mb-2">
                    Hesabınız yok mu?
                    <Link href="/plans" className="text-decoration-none ms-1">
                      Paket seçin
                    </Link>
                  </p>
                  <Link href="/" className="text-decoration-none">
                    <i className="bi bi-arrow-left me-1"></i>
                    Ana sayfaya dön
                  </Link>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card border-0 bg-transparent">
                  <div className="card-body text-center">
                    <h6 className="text-muted mb-3">
                      Premium Üyelik Avantajları
                    </h6>
                    <div className="row g-3">
                      <div className="col-4">
                        <div className="d-flex flex-column align-items-center">
                          <i className="bi bi-map text-primary fs-4 mb-1"></i>
                          <small className="text-muted">Haritalar</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="d-flex flex-column align-items-center">
                          <i className="bi bi-play-circle text-primary fs-4 mb-1"></i>
                          <small className="text-muted">Videolar</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="d-flex flex-column align-items-center">
                          <i className="bi bi-people text-primary fs-4 mb-1"></i>
                          <small className="text-muted">Forum</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
