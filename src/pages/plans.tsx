"use client";
import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { Plan } from "@/types/plan";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { onAuthStateChanged } from "firebase/auth";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownedPackages, setOwnedPackages] = useState<Record<string, boolean>>(
    {}
  );
  const { addToCart, isInCart } = useCart();
  const carouselInitialized = useRef<Set<string>>(new Set());
  const touchStartX = useRef<{ [key: string]: number }>({});
  const touchStartY = useRef<{ [key: string]: number }>({});

  // Carousel'leri initialize et ve swipe desteği ekle
  useEffect(() => {
    if (typeof window === "undefined" || plans.length === 0) return;

    const initCarousels = () => {
      const bootstrap = (window as any).bootstrap;
      if (!bootstrap || !bootstrap.Carousel) {
        setTimeout(initCarousels, 100);
        return;
      }

      plans.forEach((plan) => {
        if (plan.images && plan.images.length > 1) {
          const carouselId = `carousel-${plan.id}`;
          const carouselElement = document.getElementById(carouselId);

          if (carouselElement && !carouselInitialized.current.has(carouselId)) {
            try {
              // Bootstrap carousel'i initialize et - otomatik kayma KAPALI
              const carousel = new bootstrap.Carousel(carouselElement, {
                ride: false,
                interval: false,
                wrap: true,
                keyboard: true,
                pause: false,
                touch: true,
              });

              // Otomatik kaymayı tamamen kapat
              carousel.pause();
              if (carousel._interval) {
                clearInterval(carousel._interval);
                carousel._interval = null;
              }

              carouselInitialized.current.add(carouselId);
            } catch (error) {
              console.warn(
                `Carousel ${carouselId} initialize edilemedi:`,
                error
              );
            }
          }
        }
      });
    };

    if (document.readyState === "complete") {
      initCarousels();
    } else {
      window.addEventListener("load", initCarousels);
      return () => window.removeEventListener("load", initCarousels);
    }
  }, [plans]);

  // Fetch user's owned packages
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOwnedPackages(userData?.ownedPackages || {});
          }
        } catch (err) {
          console.error("Kullanıcı paketleri yüklenirken hata:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
        console.error(`Planlar yüklenirken hata: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleAddToCart = (plan: Plan) => {
    addToCart(plan);
  };

  const isOwned = (planKey: string) => {
    return ownedPackages[planKey] === true;
  };

  const calculateMonthlyPrice = (
    price: number,
    periodMonths: number
  ): number => {
    if (periodMonths <= 0) return price;
    return Math.round((price / periodMonths) * 100) / 100;
  };

  return (
    <div className="min-vh-100 bg-light">
      <Header />

      {/* Hero Section */}
      <section
        className="py-5 text-white position-relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)",
          minHeight: "280px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.22) 0%, rgba(59,130,246,0.12) 40%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(0,227,255,0.15) 0%, rgba(59,130,246,0.13) 45%, transparent 75%)",
            pointerEvents: "none",
          }}
        />
        <div className="container position-relative">
          <div className="row text-center">
            <div className="col-lg-8 mx-auto">
              <h1
                className="display-3 fw-bold mb-4"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
              >
                Paketler
              </h1>
              <p
                className="lead fs-4 mb-0"
                style={{ textShadow: "0 1px 5px rgba(0,0,0,0.2)" }}
              >
                KPSS hazırlığınız için en uygun paketi seçin ve başarıya giden
                yolda ilk adımı atın
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section
        className="py-5"
        style={{
          background: "linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border"
                role="status"
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderColor: "#3b82f6",
                  borderRightColor: "transparent",
                }}
              >
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
              <p className="mt-3 fs-5 text-muted">Paketler yükleniyor...</p>
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {plans.map((plan, index) => (
                <div key={plan.id} className="col-lg-4 col-md-6">
                  <div
                    className={`card pricing-card h-100 ${
                      index === 1 ? "featured" : ""
                    }`}
                    style={{
                      borderRadius: "20px",
                      border:
                        index === 1 ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                      boxShadow:
                        index === 1
                          ? "0 10px 40px rgba(59, 130, 246, 0.2)"
                          : "0 4px 20px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      overflow: "hidden",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (index !== 1) {
                        e.currentTarget.style.transform = "translateY(-8px)";
                        e.currentTarget.style.boxShadow =
                          "0 12px 40px rgba(59, 130, 246, 0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (index !== 1) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 20px rgba(0, 0, 0, 0.08)";
                      }
                    }}
                  >
                    {index === 1 && (
                      <div
                        className="position-absolute top-0 start-0 w-100 text-center py-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                          color: "white",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          letterSpacing: "0.5px",
                          zIndex: 2,
                        }}
                      >
                        <i className="bi bi-star-fill me-2"></i>
                        EN POPÜLER
                      </div>
                    )}

                    {/* Plan Images */}
                    {plan.images && plan.images.length > 0 && (
                      <div
                        className="position-relative"
                        style={{
                          height: "250px",
                          overflow: "hidden",
                          background: "#f8f9fa",
                        }}
                      >
                        <div
                          id={`carousel-${plan.id}`}
                          className="carousel slide h-100"
                          data-bs-ride="false"
                          data-bs-interval="false"
                        >
                          <div
                            className="carousel-inner h-100"
                            onTouchStart={(e) => {
                              const carouselId = `carousel-${plan.id}`;
                              const touch = e.touches[0];
                              touchStartX.current[carouselId] = touch.clientX;
                              touchStartY.current[carouselId] = touch.clientY;
                            }}
                            onTouchEnd={(e) => {
                              const carouselId = `carousel-${plan.id}`;
                              if (!touchStartX.current[carouselId]) return;

                              const touch = e.changedTouches[0];
                              const deltaX =
                                touch.clientX - touchStartX.current[carouselId];
                              const deltaY =
                                touch.clientY - touchStartY.current[carouselId];

                              // Sadece yatay kaydırma (swipe) - dikey kaydırmadan ayırt et
                              if (
                                Math.abs(deltaX) > Math.abs(deltaY) &&
                                Math.abs(deltaX) > 50
                              ) {
                                const bootstrap = (window as any).bootstrap;
                                if (bootstrap) {
                                  const carouselElement =
                                    document.getElementById(carouselId);
                                  if (carouselElement) {
                                    const carousel =
                                      bootstrap.Carousel.getInstance(
                                        carouselElement
                                      );
                                    if (carousel) {
                                      if (deltaX > 0) {
                                        carousel.prev();
                                      } else {
                                        carousel.next();
                                      }
                                    }
                                  }
                                }
                              }

                              delete touchStartX.current[carouselId];
                              delete touchStartY.current[carouselId];
                            }}
                          >
                            {plan.images.map((imageUrl, imgIndex) => (
                              <div
                                key={imgIndex}
                                className={`carousel-item h-100 ${
                                  imgIndex === 0 ? "active" : ""
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageUrl}
                                  alt={`${plan.name} - Resim ${imgIndex + 1}`}
                                  className="d-block w-100 h-100"
                                  style={{
                                    objectFit: "contain",
                                    objectPosition: "center",
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                    pointerEvents: "none",
                                  }}
                                  draggable={false}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EResim Yüklenemedi%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          {plan.images.length > 1 && (
                            <>
                              <button
                                className="carousel-control-prev"
                                type="button"
                                data-bs-target={`#carousel-${plan.id}`}
                                data-bs-slide="prev"
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  left: "10px",
                                }}
                              >
                                <span
                                  className="carousel-control-prev-icon"
                                  aria-hidden="true"
                                  style={{
                                    filter: "invert(1)",
                                  }}
                                ></span>
                                <span className="visually-hidden">
                                  Previous
                                </span>
                              </button>
                              <button
                                className="carousel-control-next"
                                type="button"
                                data-bs-target={`#carousel-${plan.id}`}
                                data-bs-slide="next"
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  right: "10px",
                                }}
                              >
                                <span
                                  className="carousel-control-next-icon"
                                  aria-hidden="true"
                                  style={{
                                    filter: "invert(1)",
                                  }}
                                ></span>
                                <span className="visually-hidden">Next</span>
                              </button>
                              <div className="carousel-indicators">
                                {plan.images.map((_, imgIndex) => (
                                  <button
                                    key={imgIndex}
                                    type="button"
                                    data-bs-target={`#carousel-${plan.id}`}
                                    data-bs-slide-to={imgIndex}
                                    className={imgIndex === 0 ? "active" : ""}
                                    aria-current={
                                      imgIndex === 0 ? "true" : "false"
                                    }
                                    aria-label={`Slide ${imgIndex + 1}`}
                                  ></button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className="card-body p-5 text-center"
                      style={{ marginTop: index === 1 ? "40px" : "0" }}
                    >
                      <div className="d-flex flex-column align-items-center mb-4">
                        <h3
                          className="card-title fw-bold mb-3"
                          style={{ fontSize: "1.75rem", color: "#1e293b" }}
                        >
                          {plan.name}
                        </h3>
                        {isOwned(plan.key) && (
                          <span
                            className="badge px-3 py-2"
                            style={{
                              background:
                                "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                              color: "white",
                              borderRadius: "20px",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                            }}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Sahipsiniz
                          </span>
                        )}
                      </div>

                      <div
                        className="mb-4 pb-3"
                        style={{ borderBottom: "2px solid #f1f5f9" }}
                      >
                        <div className="d-flex align-items-baseline justify-content-center">
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: "3rem",
                              color: "#3b82f6",
                              lineHeight: "1",
                            }}
                          >
                            {plan.price}
                          </span>
                          <span
                            className="text-muted ms-2"
                            style={{ fontSize: "1.25rem" }}
                          >
                            {plan.currency}
                          </span>
                        </div>
                        {plan.periodMonths > 1 && (
                          <div
                            className="mt-2"
                            style={{
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              color: "#10b981",
                            }}
                          >
                            <i className="bi bi-calendar-check me-1"></i>
                            Aylık sadece{" "}
                            {calculateMonthlyPrice(
                              plan.price,
                              plan.periodMonths
                            )}{" "}
                            {plan.currency}
                          </div>
                        )}
                        <div
                          className="text-muted mt-1"
                          style={{ fontSize: "0.95rem", fontWeight: "500" }}
                        >
                          {plan.periodMonths} ay erişim
                        </div>
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <ul className="list-unstyled mb-4 text-start">
                          {plan.features.map((feature: string, i: number) => (
                            <li
                              key={i}
                              className="mb-3 d-flex align-items-start"
                              style={{ color: "#475569" }}
                            >
                              <i
                                className="bi bi-check-circle-fill me-3 mt-1"
                                style={{
                                  color: "#34d399",
                                  fontSize: "1.1rem",
                                  flexShrink: 0,
                                }}
                              ></i>
                              <span
                                style={{
                                  fontSize: "0.95rem",
                                  lineHeight: "1.6",
                                }}
                              >
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        className={`btn btn-lg w-100 mt-4 ${
                          isOwned(plan.key)
                            ? "btn-secondary"
                            : isInCart(plan.id)
                            ? "btn-success"
                            : index === 1
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => handleAddToCart(plan)}
                        disabled={isOwned(plan.key) || isInCart(plan.id)}
                        style={{
                          borderRadius: "12px",
                          padding: "0.875rem 1.5rem",
                          fontWeight: "600",
                          fontSize: "1rem",
                          border: "none",
                          transition: "all 0.3s ease",
                          ...(index === 1 &&
                            !isOwned(plan.key) &&
                            !isInCart(plan.id) && {
                              background:
                                "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                              boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
                            }),
                        }}
                        onMouseEnter={(e) => {
                          if (!isOwned(plan.key) && !isInCart(plan.id)) {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            if (index === 1) {
                              e.currentTarget.style.boxShadow =
                                "0 6px 20px rgba(59, 130, 246, 0.5)";
                            }
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        {isOwned(plan.key) ? (
                          <>
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Zaten Sahipsiniz
                          </>
                        ) : isInCart(plan.id) ? (
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            Sepette
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cart-plus me-2"></i>
                            Sepete Ekle
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Features Section */}
          <div className="row mt-5 pt-5">
            <div className="col-12">
              <div className="text-center mb-5">
                <h2
                  className="fw-bold mb-3"
                  style={{ fontSize: "2rem", color: "#1e293b" }}
                >
                  Tüm Paketlerde Dahil
                </h2>
                <p className="text-muted fs-5">Premium üyelik avantajları</p>
              </div>

              <div className="row g-4">
                <div className="col-md-3 col-6">
                  <div
                    className="text-center p-4 rounded-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                      border: "1px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 25px rgba(59, 130, 246, 0.15)";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{
                        width: "70px",
                        height: "70px",
                        background:
                          "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                        borderRadius: "16px",
                        color: "white",
                      }}
                    >
                      <i className="bi bi-map" style={{ fontSize: "2rem" }}></i>
                    </div>
                    <h6
                      className="text-dark fw-bold mb-2"
                      style={{ fontSize: "1.1rem" }}
                    >
                      Güncel Haritalar
                    </h6>
                    <small
                      className="text-muted"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Coğrafya haritaları
                    </small>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div
                    className="text-center p-4 rounded-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                      border: "1px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 25px rgba(52, 211, 153, 0.15)";
                      e.currentTarget.style.borderColor = "#34d399";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{
                        width: "70px",
                        height: "70px",
                        background:
                          "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                        borderRadius: "16px",
                        color: "white",
                      }}
                    >
                      <i
                        className="bi bi-play-circle"
                        style={{ fontSize: "2rem" }}
                      ></i>
                    </div>
                    <h6
                      className="text-dark fw-bold mb-2"
                      style={{ fontSize: "1.1rem" }}
                    >
                      Video Çözümler
                    </h6>
                    <small
                      className="text-muted"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Uzman anlatımlar
                    </small>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div
                    className="text-center p-4 rounded-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                      border: "1px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 25px rgba(59, 130, 246, 0.15)";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{
                        width: "70px",
                        height: "70px",
                        background:
                          "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                        borderRadius: "16px",
                        color: "white",
                      }}
                    >
                      <i
                        className="bi bi-people"
                        style={{ fontSize: "2rem" }}
                      ></i>
                    </div>
                    <h6
                      className="text-dark fw-bold mb-2"
                      style={{ fontSize: "1.1rem" }}
                    >
                      Aktif Forum
                    </h6>
                    <small
                      className="text-muted"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Topluluk desteği
                    </small>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div
                    className="text-center p-4 rounded-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                      border: "1px solid #e2e8f0",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 25px rgba(52, 211, 153, 0.15)";
                      e.currentTarget.style.borderColor = "#34d399";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      className="mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{
                        width: "70px",
                        height: "70px",
                        background:
                          "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                        borderRadius: "16px",
                        color: "white",
                      }}
                    >
                      <i
                        className="bi bi-headset"
                        style={{ fontSize: "2rem" }}
                      ></i>
                    </div>
                    <h6
                      className="text-dark fw-bold mb-2"
                      style={{ fontSize: "1.1rem" }}
                    >
                      7/24 Destek
                    </h6>
                    <small
                      className="text-muted"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Müşteri hizmetleri
                    </small>
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
