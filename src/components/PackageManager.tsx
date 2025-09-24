"use client";
import React, { useState } from "react";
import { PackageType, PackageCategory } from "@/types/package";
import {
  PACKAGE_INFO,
  PACKAGE_CATEGORIES,
  DURATION_OPTIONS,
} from "@/constants/packages";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface PackageManagerProps {
  userId?: string;
  onPackageChange?: () => void;
}

interface UserPackage {
  type: string;
  name: string;
  category: string;
  description: string;
  isOwned: boolean;
  isExpired: boolean;
  expiryDate: any;
  expiryDateFormatted: string;
  remainingTime: string;
  status: "active" | "expired" | "not_owned";
}

interface LegacyInfo {
  isPremium: boolean;
  premiumExpiryDate: any;
  premiumExpiryDateFormatted: string;
  premiumRemainingTime: string;
}

const PackageManager: React.FC<PackageManagerProps> = ({
  userId,
  onPackageChange,
}) => {
  const [activeTab, setActiveTab] = useState<"add" | "extend" | "view">("add");
  const [selectedUserId, setSelectedUserId] = useState(userId || "");

  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [legacyInfo, setLegacyInfo] = useState<LegacyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  // Paket ekleme formu
  const [addForm, setAddForm] = useState({
    packageType: "" as PackageType | "",
    durationHours: 24,
  });

  // Paket uzatma formu
  const [extendForm, setExtendForm] = useState({
    packageType: "" as PackageType | "",
    additionalHours: 24,
  });

  const getFreshToken = async (): Promise<string> => {
    if (!auth.currentUser) {
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, () => {
          unsub();
          resolve();
        });
      });
    }
    return await auth.currentUser!.getIdToken(true);
  };

  const fetchUserPackages = async () => {
    if (!selectedUserId.trim()) {
      setMessage({ type: "error", text: "Lütfen kullanıcı ID girin" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const idToken = await getFreshToken();
      const response = await fetch(
        `/api/admin/users/packages/list?userId=${selectedUserId}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Paketler getirilemedi");

      setUserPackages(data.data.packages);
      setLegacyInfo(data.data.legacyInfo);
      setMessage({
        type: "success",
        text: "Kullanıcı paketleri başarıyla getirildi",
      });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
      setUserPackages([]);
      setLegacyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // userId prop'u değiştiğinde selectedUserId'yi güncelle ve paketleri yükle
  React.useEffect(() => {
    if (userId) {
      setSelectedUserId(userId);
      // Otomatik olarak paketleri yükle
      fetchUserPackages();
    }
  }, [userId]);

  const addPackage = async () => {
    if (!selectedUserId.trim() || !addForm.packageType) {
      setMessage({ type: "error", text: "Lütfen tüm alanları doldurun" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const idToken = await getFreshToken();
      const response = await fetch("/api/admin/users/packages/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          packageType: addForm.packageType,
          durationHours: addForm.durationHours,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Paket eklenemedi");

      setMessage({ type: "success", text: data.message });
      setAddForm({ packageType: "", durationHours: 24 });
      fetchUserPackages();
      onPackageChange?.();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const extendPackage = async () => {
    if (!selectedUserId.trim() || !extendForm.packageType) {
      setMessage({ type: "error", text: "Lütfen tüm alanları doldurun" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const idToken = await getFreshToken();
      const response = await fetch("/api/admin/users/packages/extend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          packageType: extendForm.packageType,
          additionalHours: extendForm.additionalHours,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Paket süresi uzatılamadı");

      setMessage({ type: "success", text: data.message });
      setExtendForm({ packageType: "", additionalHours: 24 });
      fetchUserPackages();
      onPackageChange?.();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const removePackage = async (packageType: string) => {
    if (
      !window.confirm(
        `${
          PACKAGE_INFO[packageType as PackageType]?.name || packageType
        } paketini kaldırmak istediğinizden emin misiniz?`
      )
    ) {
      return;
    }

    try {
      const idToken = await getFreshToken();
      const response = await fetch("/api/admin/users/packages/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          packageType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Paket kaldırılamadı");

      setMessage({ type: "success", text: data.message });
      fetchUserPackages();
      onPackageChange?.();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const tabs = [
    {
      id: "add" as const,
      label: "Paket Ekle",
      icon: "bi-plus-circle",
      description: "Yeni premium paket ekle",
    },
    {
      id: "extend" as const,
      label: "Süre Uzat",
      icon: "bi-clock",
      description: "Mevcut paket süresini uzat",
    },
    {
      id: "view" as const,
      label: "Paketleri Görüntüle",
      icon: "bi-search",
      description: "Kullanıcı paketlerini görüntüle",
    },
  ];

  return (
    <div className="container-fluid">
      <div className="card shadow">
        <div className="card-body p-4">
          {/* Header */}
          <div className="d-flex align-items-center mb-4">
            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
              <i className="bi bi-gift text-primary fs-4"></i>
            </div>
            <div>
              <h2 className="card-title mb-1 text-dark">
                Premium Paket Yönetimi
              </h2>
              <p className="text-muted mb-0">Kullanıcı paketlerini yönetin</p>
            </div>
          </div>

          {/* Kullanıcı ID Input */}
          <div className="mb-4">
            <label className="form-label fw-medium">Kullanıcı ID</label>
            <div className="input-group">
              <input
                type="text"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Firebase User ID girin"
                className="form-control"
              />
              <button
                onClick={fetchUserPackages}
                disabled={loading || !selectedUserId.trim()}
                className="btn btn-primary"
                type="button"
              >
                <i className="bi bi-search me-2"></i>
                {loading ? "Aranıyor..." : "Ara"}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-4">
            <div className="d-flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn d-flex align-items-center px-3 py-2 ${
                      isActive ? "btn-primary" : "btn-outline-primary"
                    }`}
                  >
                    <i className={`${tab.icon} me-2`}></i>
                    <div className="text-start">
                      <div className="fw-medium">{tab.label}</div>
                      <small className="text-muted">{tab.description}</small>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`alert mb-4 d-flex align-items-center ${
                message.type === "success" ? "alert-success" : "alert-danger"
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

          {/* Tab Content */}
          {activeTab === "add" && (
            <div className="row">
              <div className="col-12">
                <h3 className="h5 fw-bold mb-4">
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Paket Ekle
                </h3>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Paket Türü</label>
                    <select
                      value={addForm.packageType}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          packageType: e.target.value as PackageType,
                        })
                      }
                      className="form-select"
                    >
                      <option value="">Paket seçin</option>
                      {Object.entries(PACKAGE_CATEGORIES).map(
                        ([category, packageTypes]) => (
                          <optgroup
                            key={category}
                            label={`${category} Paketleri`}
                          >
                            {packageTypes.map((packageType) => (
                              <option key={packageType} value={packageType}>
                                {PACKAGE_INFO[packageType].name}
                              </option>
                            ))}
                          </optgroup>
                        )
                      )}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Süre</label>
                    <select
                      value={addForm.durationHours}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          durationHours: Number(e.target.value),
                        })
                      }
                      className="form-select"
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <button
                      onClick={addPackage}
                      disabled={loading}
                      className="btn btn-primary btn-lg w-100"
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      {loading ? "İşleniyor..." : "Paket Ekle"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "extend" && (
            <div className="row">
              <div className="col-12">
                <h3 className="h5 fw-bold mb-4">
                  <i className="bi bi-clock me-2"></i>
                  Paket Süresini Uzat
                </h3>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Paket Türü</label>
                    <select
                      value={extendForm.packageType}
                      onChange={(e) =>
                        setExtendForm({
                          ...extendForm,
                          packageType: e.target.value as PackageType,
                        })
                      }
                      className="form-select"
                    >
                      <option value="">Paket seçin</option>
                      {Object.entries(PACKAGE_CATEGORIES).map(
                        ([category, packageTypes]) => (
                          <optgroup
                            key={category}
                            label={`${category} Paketleri`}
                          >
                            {packageTypes.map((packageType) => (
                              <option key={packageType} value={packageType}>
                                {PACKAGE_INFO[packageType].name}
                              </option>
                            ))}
                          </optgroup>
                        )
                      )}
                    </select>
                    <div className="form-text">
                      Uzatmak istediğiniz paketi seçin
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Ek Süre</label>
                    <select
                      value={extendForm.additionalHours}
                      onChange={(e) =>
                        setExtendForm({
                          ...extendForm,
                          additionalHours: Number(e.target.value),
                        })
                      }
                      className="form-select"
                    >
                      {DURATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <button
                      onClick={extendPackage}
                      disabled={loading}
                      className="btn btn-warning btn-lg w-100"
                    >
                      <i className="bi bi-clock me-2"></i>
                      {loading ? "İşleniyor..." : "Süreyi Uzat"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "view" && userPackages.length > 0 && (
            <div className="row">
              <div className="col-12">
                {/* Legacy Info */}
                {legacyInfo && (
                  <div className="alert alert-warning mb-4">
                    <h4 className="alert-heading d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Eski Uyumluluk Durumu
                    </h4>
                    <div className="row">
                      <div className="col-md-6">
                        <strong>isPremium:</strong>
                        <span
                          className={`ms-2 ${
                            legacyInfo.isPremium
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {legacyInfo.isPremium ? "Evet" : "Hayır"}
                        </span>
                      </div>
                      <div className="col-md-6">
                        <strong>Premium Bitiş:</strong>
                        <span className="ms-2">
                          {legacyInfo.premiumExpiryDateFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Packages */}
                <div>
                  <h3 className="h5 fw-bold mb-4">
                    <i className="bi bi-gift me-2"></i>
                    Mevcut Paketler
                  </h3>
                  <div className="row g-3">
                    {userPackages.map((pkg) => {
                      const isExpired = pkg.status === "expired";
                      const isActive = pkg.status === "active";

                      return (
                        <div key={pkg.type} className="col-12">
                          <div
                            className={`card ${
                              isExpired
                                ? "border-danger"
                                : isActive
                                ? "border-success"
                                : "border-secondary"
                            }`}
                          >
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-2">
                                    <i
                                      className={`bi bi-gift me-2 ${
                                        isExpired
                                          ? "text-danger"
                                          : isActive
                                          ? "text-success"
                                          : "text-secondary"
                                      }`}
                                    ></i>
                                    <h5 className="card-title mb-0">
                                      {pkg.name}
                                    </h5>
                                    <span
                                      className={`badge ms-2 ${
                                        isExpired
                                          ? "bg-danger"
                                          : isActive
                                          ? "bg-success"
                                          : "bg-secondary"
                                      }`}
                                    >
                                      {pkg.status === "active"
                                        ? "Aktif"
                                        : pkg.status === "expired"
                                        ? "Süresi Dolmuş"
                                        : "Paket Yok"}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center text-muted small">
                                    <i className="bi bi-clock me-1"></i>
                                    <span className="me-3">
                                      Bitiş: {pkg.expiryDateFormatted}
                                    </span>
                                    <span>Kalan: {pkg.remainingTime}</span>
                                  </div>
                                </div>
                                {pkg.isOwned && (
                                  <button
                                    onClick={() => removePackage(pkg.type)}
                                    className="btn btn-outline-danger btn-sm"
                                    title="Paketi kaldır"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "view" &&
            userPackages.length === 0 &&
            selectedUserId && (
              <div className="text-center py-5">
                <i
                  className="bi bi-gift text-muted"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-muted mt-3">
                  Kullanıcının henüz hiç paketi yok
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PackageManager;
