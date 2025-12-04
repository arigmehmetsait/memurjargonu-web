"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useCart } from "@/context/CartContext";

type Claims = { premium?: boolean; premiumExp?: number };

interface HeaderProps {
  variant?: "default" | "admin";
  showUserInfo?: boolean;
}

export default function Header({
  variant = "default",
  showUserInfo = true,
}: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claims>({});
  const [loading, setLoading] = useState(true);
  const { cart, clearCart } = useCart();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const t = await u.getIdTokenResult(true);
        setClaims({
          premium: Boolean(t.claims.premium),
          premiumExp:
            typeof t.claims.premiumExp === "number"
              ? (t.claims.premiumExp as number)
              : undefined,
        });
      } else {
        setClaims({});
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      // Sepeti temizle
      clearCart();
      // localStorage'dan da sepeti temizle
      localStorage.removeItem("cart");
      // Çıkış yap
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleClaimRefresh = async () => {
    if (user) {
      try {
        await user.getIdToken(true);
        window.location.reload();
      } catch (error) {
        console.error("Claim refresh error:", error);
      }
    }
  };

  if (variant === "admin") {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link
            href="/admin"
            className="navbar-brand"
            style={{ cursor: "pointer" }}
          >
            <i className="bi bi-shield-check me-2"></i>
            Admin Panel
          </Link>
          <div className="d-flex gap-2">
            <Link
              href="/admin/content"
              className="btn btn-outline-light btn-sm"
            >
              <i className="bi bi-file-earmark-pdf me-1"></i>
              İçerik Yönetimi
            </Link>
            <Link href="/admin/plans" className="btn btn-outline-light btn-sm">
              <i className="bi bi-box me-1"></i>
              Planlar
            </Link>
            <Link href="/admin/users" className="btn btn-outline-light btn-sm">
              <i className="bi bi-people me-1"></i>
              Kullanıcılar
            </Link>
            <Link href="/admin/orders" className="btn btn-outline-light btn-sm">
              <i className="bi bi-receipt me-1"></i>
              Siparişler
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link href="/" className="navbar-brand">
          <i className="bi bi-mortarboard-fill me-2"></i>
          MEMUR JARGONU
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link href="/" className="nav-link">
                Ana Sayfa
              </Link>
            </li>
            {/* <li className="nav-item">
              <Link href="/icerikler" className="nav-link">
                İçerikler
              </Link>
            </li> */}
            <li className="nav-item">
              <Link href="/plans" className="nav-link">
                Paketler
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/contact" className="nav-link">
                İletişim
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav align-items-center">
            <li className="nav-item me-3">
              <Link href="/cart" className="nav-link position-relative">
                <i
                  className="bi bi-cart-fill"
                  style={{ fontSize: "1.2rem" }}
                ></i>
                {cart.length > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {cart.length}
                  </span>
                )}
              </Link>
            </li>
          </ul>

          {showUserInfo && (
            <ul className="navbar-nav">
              {loading ? (
                <li className="nav-item">
                  <span className="nav-link">
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    Yükleniyor...
                  </span>
                </li>
              ) : user ? (
                <>
                  {/* <li className="nav-item">
                    <button
                      className="btn btn-outline-light btn-sm me-2"
                      onClick={handleClaimRefresh}
                      title="Claim'leri yenile"
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </li> */}
                  <li className="nav-item d-flex align-items-center me-3">
                    <Link
                      href="/profile"
                      className="nav-link d-flex align-items-center"
                      title="Profil"
                    >
                      <i
                        className="bi bi-person-circle text-light"
                        style={{ fontSize: "1.6rem" }}
                      ></i>
                    </Link>
                  </li>

                  <li className="nav-item d-flex align-items-center">
                    <button
                      className="btn btn-outline-light btn-sm d-flex align-items-center"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i>
                      Çıkış
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <Link href="/login" className="btn btn-primary">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Giriş Yap
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
