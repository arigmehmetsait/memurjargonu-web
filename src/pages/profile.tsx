"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PackageType, PackageCategory } from "@/types/package";
import { formatDate } from "@/utils/formatDate";

interface PackageInfo {
  type: PackageType;
  name: string;
  category: PackageCategory;
  description: string;
  isOwned: boolean;
  expiryDate: any;
  isExpired: boolean;
}

interface UserInfo {
  email?: string;
  forumNickname?: string;
  isPremium: boolean;
  premiumExpiryDate: any;
  lastUpdated: any;
}

interface ProfileData {
  user: UserInfo;
  packages: Record<string, PackageInfo>;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchProfileData(u);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchProfileData = async (user: User) => {
    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const response = await fetch("/api/profile/packages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Profil verileri alınamadı");
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error("Profile data fetch error:", err);
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (packageInfo: PackageInfo) => {
    if (!packageInfo.isOwned) {
      return <span className="badge bg-secondary">Sahip Değil</span>;
    }

    if (packageInfo.isExpired) {
      return <span className="badge bg-danger">Süresi Dolmuş</span>;
    }

    return <span className="badge bg-success">Aktif</span>;
  };

  const getCategoryIcon = (category: PackageCategory) => {
    switch (category) {
      case PackageCategory.KPSS:
        return "bi-mortarboard-fill";
      case PackageCategory.AGS:
        return "bi-book-fill";
      default:
        return "bi-box-fill";
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mt-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Header />
        <div className="container mt-4">
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Profil sayfasını görüntülemek için giriş yapmanız gerekiyor.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="container mt-4">
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div>
        <Header />
        <div className="container mt-4">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Profil verileri yüklenemedi.
          </div>
        </div>
      </div>
    );
  }

  // Paketleri kategorilere göre grupla
  const kpssPackages = Object.values(profileData.packages).filter(
    (pkg) => pkg.category === PackageCategory.KPSS
  );
  const agsPackages = Object.values(profileData.packages).filter(
    (pkg) => pkg.category === PackageCategory.AGS
  );

  return (
    <div>
      <Header />
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <h1 className="mb-4">
              <i className="bi bi-person-circle me-2"></i>
              Profil
            </h1>
          </div>
        </div>

        {/* Kullanıcı Bilgileri */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-person me-2"></i>
                  Kullanıcı Bilgileri
                </h5>
              </div>
              <div className="card-body profile-info">
                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>E-posta:</strong> {profileData.user.email || "—"}
                    </p>
                    <p>
                      <strong>Forum Nickname:</strong>{" "}
                      {profileData.user.forumNickname || "—"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Premium Durumu:</strong>{" "}
                      {profileData.user.isPremium ? (
                        <span className="badge bg-success">Aktif</span>
                      ) : (
                        <span className="badge bg-secondary">Pasif</span>
                      )}
                    </p>
                    <p>
                      <strong>Premium Bitiş:</strong>{" "}
                      {formatDate(profileData.user.premiumExpiryDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPSS Paketleri */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-mortarboard-fill me-2"></i>
                  KPSS Paketleri
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {kpssPackages.map((pkg) => (
                    <div key={pkg.type} className="col-md-6 col-lg-4 mb-3">
                      <div className="card h-100 package-card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title text-primary">
                              <i
                                className={`bi ${getCategoryIcon(
                                  pkg.category
                                )} me-1`}
                              ></i>
                              {pkg.name}
                            </h6>
                            {getStatusBadge(pkg)}
                          </div>
                          <p className="card-text small text-muted">
                            {pkg.description}
                          </p>
                          <div className="mt-auto">
                            <p className="small mb-1">
                              <strong>Bitiş Tarihi:</strong>
                            </p>
                            <p className="small text-muted">
                              {formatDate(pkg.expiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AGS Paketleri */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-book-fill me-2"></i>
                  AGS Paketleri
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {agsPackages.map((pkg) => (
                    <div key={pkg.type} className="col-md-6 col-lg-4 mb-3">
                      <div className="card h-100 package-card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title text-info">
                              <i
                                className={`bi ${getCategoryIcon(
                                  pkg.category
                                )} me-1`}
                              ></i>
                              {pkg.name}
                            </h6>
                            {getStatusBadge(pkg)}
                          </div>
                          <p className="card-text small text-muted">
                            {pkg.description}
                          </p>
                          <div className="mt-auto">
                            <p className="small mb-1">
                              <strong>Bitiş Tarihi:</strong>
                            </p>
                            <p className="small text-muted">
                              {formatDate(pkg.expiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Özet İstatistikler */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Özet İstatistikler
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="border rounded p-3">
                      <h4 className="text-primary">
                        {
                          Object.values(profileData.packages).filter(
                            (pkg) => pkg.isOwned
                          ).length
                        }
                      </h4>
                      <p className="mb-0">Toplam Paket</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border rounded p-3">
                      <h4 className="text-success">
                        {
                          Object.values(profileData.packages).filter(
                            (pkg) => pkg.isOwned && !pkg.isExpired
                          ).length
                        }
                      </h4>
                      <p className="mb-0">Aktif Paket</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border rounded p-3">
                      <h4 className="text-danger">
                        {
                          Object.values(profileData.packages).filter(
                            (pkg) => pkg.isOwned && pkg.isExpired
                          ).length
                        }
                      </h4>
                      <p className="mb-0">Süresi Dolmuş</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border rounded p-3">
                      <h4 className="text-secondary">
                        {
                          Object.values(profileData.packages).filter(
                            (pkg) => !pkg.isOwned
                          ).length
                        }
                      </h4>
                      <p className="mb-0">Sahip Olunmayan</p>
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
