"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  // Ortak yönlendirme fonksiyonu
  const handleRedirect = async (user: any) => {
    const tokenResult = await user.getIdTokenResult(true);
    const isAdmin = tokenResult.claims?.admin === true;

    setTimeout(() => {
      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }, 1500);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // ✅ Kullanıcı UID'ini ekranda gösterelim
      setMsg(`Giriş başarılı ✅ `);

      // Yönlendirme
      await handleRedirect(cred.user);
    } catch (e: any) {
      setMsg(`Giriş hatası ❌: ${e.message ?? "Bilinmeyen hata"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setMsg(null);
    setGoogleLoading(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);

      // ✅ Kullanıcı UID'ini ekranda gösterelim
      setMsg(`Google ile giriş başarılı ✅ `);

      // Yönlendirme
      await handleRedirect(cred.user);
    } catch (e: any) {
      // Kullanıcı popup'ı kapattıysa hata gösterme
      if (e.code !== "auth/popup-closed-by-user") {
        setMsg(`Google giriş hatası ❌: ${e.message ?? "Bilinmeyen hata"}`);
      }
    } finally {
      setGoogleLoading(false);
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
                    disabled={loading || googleLoading}
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

                {/* Divider */}
                <div className="d-flex align-items-center my-4">
                  <div className="flex-grow-1 border-top"></div>
                  <span className="px-3 text-muted small">veya</span>
                  <div className="flex-grow-1 border-top"></div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg w-100"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Google ile giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      <svg
                        className="me-2"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g fill="none" fillRule="evenodd">
                          <path
                            d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7955 2.7164v2.2581h2.9087c1.7023-1.5668 2.6837-3.874 2.6837-6.615z"
                            fill="#4285F4"
                          />
                          <path
                            d="M9 18c2.43 0 4.4673-.805 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
                            fill="#34A853"
                          />
                          <path
                            d="M3.964 10.71c-.18-.54-.2822-1.1173-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3486 2.8268.9573 4.0418L3.964 10.71z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3459l2.5813-2.5814C13.4632.8918 11.4268 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
                            fill="#EA4335"
                          />
                        </g>
                      </svg>
                      Google ile Devam Et
                    </>
                  )}
                </button>

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
