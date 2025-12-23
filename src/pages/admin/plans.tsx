"use client";
import AdminGuard from "@/components/AdminGuard";
import CustomModal from "@/components/CustomModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useEffect, useState } from "react";
import { plansService, Plan } from "@/services/admin/plansService";
import Link from "next/link";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { PACKAGE_INFO, PACKAGE_CATEGORIES } from "@/constants/packages";
import { PackageType } from "@/types/package";
import Header from "@/components/Header";
import { getValidToken } from "@/utils/tokenCache";



export default function PlansAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [planToToggle, setPlanToToggle] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: string }>(
    {}
  );

  // Plan key seçenekleri
  const planKeyOptions = [
    { value: "", label: "Seçiniz...", disabled: true },
    {
      label: "--- KPSS Paketleri ---",
      disabled: true,
      value: "",
    },
    {
      value: PackageType.KPSS_FULL,
      label: "KPSS Tam Paket",
    },
    {
      value: PackageType.KPSS_GUNCEL,
      label: "KPSS Güncel Bilgiler",
    },
    {
      value: PackageType.KPSS_TARIH,
      label: "KPSS Tarih",
    },
    {
      value: PackageType.KPSS_VATANDASLIK,
      label: "KPSS Vatandaşlık",
    },
    {
      value: PackageType.KPSS_COGRAFYA,
      label: "KPSS Coğrafya",
    },
    {
      label: "--- AGS Paketleri ---",
      disabled: true,
      value: "",
    },
    {
      value: PackageType.AGS_FULL,
      label: "AGS Tam Paket",
    },
    {
      value: PackageType.AGS_MEVZUAT,
      label: "AGS Mevzuat",
    },
    {
      value: PackageType.AGS_EGITIM_TEMELLERI,
      label: "AGS Eğitim Temelleri",
    },
    {
      value: PackageType.AGS_COGRAFYA,
      label: "AGS Coğrafya",
    },
    {
      value: PackageType.AGS_TARIH,
      label: "AGS Tarih",
    },
  ];

  // Plan key'den label'ı bulan helper fonksiyon
  const getPlanKeyLabel = (key: string) => {
    const option = planKeyOptions.find(
      (opt) => opt.value === key && !opt.disabled
    );
    return option ? option.label : key;
  };

  // Yeni paket sistemi için state'ler
  const [activeTab, setActiveTab] = useState<"plans" | "packages">("plans");

  const load = async () => {
    try {
      setLoading(true);
      const response = await plansService.getAll();
      if (response.success) {
        setPlans(response.data);
        setMsg(null);
      } else {
        setMsg(response.error || "Planlar yüklenemedi");
      }
    } catch (e: any) {
      setMsg(`Listeleme hatası: ${e?.message || e}`);
      console.error("plans list error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (p: Plan) => {
    try {
      setMsg("Güncelleniyor…");
      const response = await plansService.update(p.id, { isActive: !p.isActive });
      if (response.success) {
        await load();
        setMsg("Güncellendi ✅");
      } else {
        setMsg(`Hata: ${response.error || "Güncelleme başarısız"}`);
      }
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || e}`);
    }
  };

  const updatePrice = async (p: Plan, priceStr: string) => {
    try {
      const price = Number(priceStr);
      if (Number.isNaN(price)) return setMsg("Geçersiz fiyat");
      setMsg("Fiyat güncelleniyor…");
      
      const response = await plansService.update(p.id, { price });
      if (response.success) {
        await load();
        setMsg("Güncellendi ✅");
      } else {
        setMsg(`Hata: ${response.error || "Fiyat güncellenemedi"}`);
      }
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || e}`);
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    currency: "TRY",
    periodMonths: 1,
    key: "",
    features: [] as string[],
    images: [] as string[],
  });
  const [editPlan, setEditPlan] = useState({
    name: "",
    price: 0,
    currency: "TRY",
    periodMonths: 1,
    key: "",
    features: [] as string[],
    images: [] as string[],
  });
  const [uploadingImages, setUploadingImages] = useState<{
    [key: string]: boolean;
  }>({});

  const addPlan = async () => {
    try {
      if (!newPlan.name.trim() || !newPlan.key.trim() || newPlan.price <= 0) {
        setMsg("Lütfen tüm alanları doldurun ve geçerli bir fiyat girin.");
        return;
      }

      setMsg("Plan ekleniyor…");
      
      const response = await plansService.create({
        key: newPlan.key,
        name: newPlan.name,
        price: newPlan.price,
        currency: newPlan.currency,
        periodMonths: newPlan.periodMonths,
        features: newPlan.features,
        images: newPlan.images || [],
        index: (plans.at(-1)?.index ?? 0) + 1,
      });

      if (response.success) {
        await load();
        setMsg("Plan başarıyla eklendi ✅");
        setIsAddModalOpen(false);
        setNewPlan({
          name: "",
          price: 0,
          currency: "TRY",
          periodMonths: 1,
          key: "",
          features: [],
          images: [],
        });
      } else {
        setMsg(response.error || "Plan eklenemedi");
      }
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || e}`);
    }
  };

  const handleShowPlanDetails = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handleToggleActive = (plan: Plan) => {
    setPlanToToggle(plan);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (planToToggle) {
      await toggleActive(planToToggle);
    }
  };

  const handleDeletePlan = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (planToDelete) {
      await deletePlan(planToDelete);
    }
  };

  const deletePlan = async (plan: Plan) => {
    try {
      setMsg("Plan siliniyor…");
      const response = await plansService.delete(plan.id);
      if (response.success) {
        await load();
        setMsg("Plan başarıyla silindi ✅");
      } else {
        setMsg(`Hata: ${response.error || "Plan silinemedi"}`);
      }
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || e}`);
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setPlanToToggle(null);
    setPlanToDelete(null);
  };

  const handlePriceEdit = (planId: string, currentPrice: number) => {
    setEditingPrice((prev) => ({
      ...prev,
      [planId]: currentPrice.toString(),
    }));
  };

  const handlePriceSave = async (plan: Plan) => {
    const priceStr = editingPrice[plan.id];
    if (priceStr !== undefined) {
      await updatePrice(plan, priceStr);
      setEditingPrice((prev) => {
        const newState = { ...prev };
        delete newState[plan.id];
        return newState;
      });
    }
  };

  const handlePriceCancel = (planId: string) => {
    setEditingPrice((prev) => {
      const newState = { ...prev };
      delete newState[planId];
      return newState;
    });
  };

  // Resim yükleme fonksiyonu
  const handleImageUpload = async (
    file: File,
    isEdit: boolean = false
  ): Promise<string | null> => {
    try {
      const response = await plansService.uploadImage(file);

      if (response.success && response.data) {
        return response.data.imageUrl;
      } else {
        throw new Error(response.error || "Resim yüklenemedi");
      }
    } catch (error: any) {
      setMsg(`Resim yükleme hatası: ${error.message}`);
      return null;
    }
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5 resim kontrolü
    const currentImages = isEdit ? editPlan.images : newPlan.images;
    if (currentImages.length >= 5) {
      setMsg("Maksimum 5 resim ekleyebilirsiniz");
      return;
    }

    // Dosya formatı kontrolü
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      setMsg("Sadece JPG, PNG, WEBP ve GIF formatları kabul edilir");
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Resim boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    const uploadKey = isEdit ? `edit-${Date.now()}` : `new-${Date.now()}`;
    setUploadingImages((prev) => ({ ...prev, [uploadKey]: true }));

    const imageUrl = await handleImageUpload(file, isEdit);

    if (imageUrl) {
      if (isEdit) {
        setEditPlan({
          ...editPlan,
          images: [...editPlan.images, imageUrl],
        });
      } else {
        setNewPlan({
          ...newPlan,
          images: [...newPlan.images, imageUrl],
        });
      }
    }

    setUploadingImages((prev) => {
      const newState = { ...prev };
      delete newState[uploadKey];
      return newState;
    });

    // Input'u temizle
    e.target.value = "";
  };

  const handleImageRemove = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditPlan({
        ...editPlan,
        images: editPlan.images.filter((_, i) => i !== index),
      });
    } else {
      setNewPlan({
        ...newPlan,
        images: newPlan.images.filter((_, i) => i !== index),
      });
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setPlanToEdit(plan);
    setEditPlan({
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      periodMonths: plan.periodMonths,
      key: plan.key,
      features: (plan as any).features || [],
      images: plan.images || [],
    });
    setIsEditModalOpen(true);
  };

  const updatePlan = async () => {
    if (!planToEdit) return;

    try {
      if (
        !editPlan.name.trim() ||
        !editPlan.key.trim() ||
        editPlan.price <= 0
      ) {
        setMsg("Lütfen tüm alanları doldurun ve geçerli bir fiyat girin.");
        return;
      }

      setMsg("Plan güncelleniyor…");
      
      const response = await plansService.update(planToEdit.id, {
        name: editPlan.name,
        price: editPlan.price,
        currency: editPlan.currency,
        periodMonths: editPlan.periodMonths,
        key: editPlan.key,
        features: editPlan.features,
        images: editPlan.images || [],
      });

      if (response.success) {
        await load();
        setMsg("Plan başarıyla güncellendi ✅");
        setIsEditModalOpen(false);
        setPlanToEdit(null);
        setEditPlan({
          name: "",
          price: 0,
          currency: "TRY",
          periodMonths: 1,
          key: "",
          features: [],
          images: [],
        });
      } else {
        setMsg(`Hata: ${response.error || "Güncelleme başarısız"}`);
      }
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || e}`);
    }
  };

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        {/* Main Content */}
        <div className="container py-4">
          <div className="row">
            <div className="col-12">
              {/* Page Header */}
              <div className="text-center mb-4">
                <h1 className="display-5 fw-bold text-dark mb-3">
                  <i className="bi bi-box-seam me-3"></i>
                  Plan & Paket Yönetimi
                </h1>
                <p className="lead text-muted">
                  Eski plan sistemini ve yeni paket sistemini yönetin
                </p>
              </div>

              {/* Breadcrumb */}
              <Breadcrumb
                showHome={false}
                items={[
                  { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                  { label: "Plan Yönetimi", icon: "bi-box-seam", active: true },
                ]}
              />

              {/* Tab Navigation */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${
                        activeTab === "plans"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setActiveTab("plans")}
                    >
                      <i className="bi bi-box-seam me-2"></i>
                      Plan Yönetimi
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        activeTab === "packages"
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() => setActiveTab("packages")}
                    >
                      <i className="bi bi-gift me-2"></i>
                      Paket Yönetimi
                    </button>
                  </div>
                </div>
              </div>

              {/* Plans Tab Content */}
              {activeTab === "plans" && (
                <div className="card shadow">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h3 className="card-title mb-0">
                      <i className="bi bi-box-seam me-2"></i>
                      Plan Yönetimi
                    </h3>
                    <button
                      className="btn btn-light btn-sm"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Yeni Plan Ekle
                    </button>
                  </div>
                  <div className="card-body p-0">
                    {loading ? (
                      <div className="text-center py-5">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Yükleniyor...</span>
                        </div>
                        <p className="mt-3">Planlar yükleniyor...</p>
                      </div>
                    ) : plans.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="bi bi-box display-4 text-muted mb-3"></i>
                        <h5>Henüz plan yok</h5>
                        <p className="text-muted">İlk planınızı ekleyin.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover mb-0 table-light">
                          <thead className="table-light">
                            <tr>
                              <th>Plan Adı</th>
                              <th>Durum</th>
                              <th>Fiyat</th>
                              <th>Süre</th>
                              <th>İşlemler</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plans.map((plan) => (
                              <tr key={plan.id}>
                                <td>
                                  <div>
                                    <strong>{plan.name}</strong>
                                    <br />
                                    <span className="badge bg-light text-dark border me-2">
                                      {getPlanKeyLabel(plan.key)}
                                    </span>
                                    <br />
                                    <small className="text-muted">
                                      ID: {plan.id.slice(0, 8)}...
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      plan.isActive
                                        ? "bg-success"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    {plan.isActive ? "Aktif" : "Pasif"}
                                  </span>
                                </td>
                                <td>
                                  {editingPrice[plan.id] !== undefined ? (
                                    <div className="d-flex gap-1">
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        style={{ width: "80px" }}
                                        value={editingPrice[plan.id]}
                                        onChange={(e) =>
                                          setEditingPrice((prev) => ({
                                            ...prev,
                                            [plan.id]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handlePriceSave(plan);
                                          } else if (e.key === "Escape") {
                                            handlePriceCancel(plan.id);
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handlePriceSave(plan)}
                                      >
                                        <i className="bi bi-check"></i>
                                      </button>
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() =>
                                          handlePriceCancel(plan.id)
                                        }
                                      >
                                        <i className="bi bi-x"></i>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="fw-bold">
                                        {plan.price} {plan.currency}
                                      </span>
                                      <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() =>
                                          handlePriceEdit(plan.id, plan.price)
                                        }
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <span className="badge bg-info">
                                    {plan.periodMonths} ay
                                  </span>
                                </td>

                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn btn-outline-primary"
                                      title="Detayları Göster"
                                      onClick={() =>
                                        handleShowPlanDetails(plan)
                                      }
                                    >
                                      <i className="bi bi-eye"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-info"
                                      title="Planı Düzenle"
                                      onClick={() => handleEditPlan(plan)}
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button
                                      className={`btn ${
                                        plan.isActive
                                          ? "btn-outline-warning"
                                          : "btn-outline-success"
                                      }`}
                                      title={
                                        plan.isActive
                                          ? "Pasifleştir"
                                          : "Aktifleştir"
                                      }
                                      onClick={() => handleToggleActive(plan)}
                                    >
                                      <i
                                        className={`bi ${
                                          plan.isActive ? "bi-pause" : "bi-play"
                                        }`}
                                      ></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-danger"
                                      title="Planı Sil"
                                      onClick={() => handleDeletePlan(plan)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Summary Stats */}
                    {plans.length > 0 && (
                      <div className="card-footer bg-light">
                        <div className="row text-center">
                          <div className="col-md-3">
                            <div className="small text-muted">Toplam Plan</div>
                            <div className="fw-bold text-dark">
                              {plans.length}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="small text-muted">Aktif</div>
                            <div className="fw-bold text-success">
                              {plans.filter((p) => p.isActive).length}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="small text-muted">Pasif</div>
                            <div className="fw-bold text-secondary">
                              {plans.filter((p) => !p.isActive).length}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="small text-muted">
                              Ortalama Fiyat
                            </div>
                            <div className="fw-bold text-primary">
                              {plans.length > 0
                                ? Math.round(
                                    plans.reduce((sum, p) => sum + p.price, 0) /
                                      plans.length
                                  )
                                : 0}{" "}
                              TRY
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
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

              {/* Packages Tab Content */}
              {activeTab === "packages" && (
                <div className="card shadow">
                  <div className="card-header bg-info text-white">
                    <h3 className="card-title mb-0">
                      <i className="bi bi-gift me-2"></i>
                      Yeni Paket Sistemi
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <h6>
                        <i className="bi bi-info-circle me-2"></i>Bilgi:
                      </h6>
                      <p className="mb-0">
                        Yeni paket sistemi constants dosyasından yönetiliyor.
                        Paket bilgilerini güncellemek için{" "}
                        <code>src/constants/packages.ts</code> dosyasını
                        düzenleyin.
                      </p>
                    </div>

                    {/* Package Categories */}
                    {Object.entries(PACKAGE_CATEGORIES).map(
                      ([category, packageTypes]) => (
                        <div key={category} className="mb-4">
                          <h5 className="text-primary mb-3">
                            <i className="bi bi-collection me-2"></i>
                            {category} Paketleri
                          </h5>
                          <div className="row g-3">
                            {packageTypes.map((packageType) => {
                              const packageInfo = PACKAGE_INFO[packageType];
                              return (
                                <div
                                  key={packageType}
                                  className="col-md-6 col-lg-4"
                                >
                                  <div className="card h-100 border-primary">
                                    <div className="card-header bg-primary text-white">
                                      <h6 className="card-title mb-0">
                                        <i className="bi bi-gift me-2"></i>
                                        {packageInfo.name}
                                      </h6>
                                    </div>
                                    <div className="card-body">
                                      <p className="card-text text-muted">
                                        {packageInfo.description}
                                      </p>
                                      <div className="mb-2">
                                        <span className="badge bg-info">
                                          {packageInfo.category}
                                        </span>
                                      </div>
                                      <div className="mb-2">
                                        <strong>Paket Türü:</strong>
                                        <br />
                                        <code className="text-muted">
                                          {packageType}
                                        </code>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}

                    {/* Package Summary */}
                    <div className="card mt-4">
                      <div className="card-header bg-light">
                        <h6 className="card-title mb-0">
                          <i className="bi bi-bar-chart me-2"></i>
                          Paket Özeti
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row text-center">
                          <div className="col-md-3">
                            <div className="small text-muted">Toplam Paket</div>
                            <div className="fw-bold h5 text-primary">
                              {Object.keys(PACKAGE_INFO).length}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="small text-muted">
                              KPSS Paketleri
                            </div>
                            <div className="fw-bold h5 text-success">
                              {PACKAGE_CATEGORIES.KPSS?.length || 0}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="small text-muted">
                              AGS Paketleri
                            </div>
                            <div className="fw-bold h5 text-warning">
                              {PACKAGE_CATEGORIES.AGS?.length || 0}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="small text-muted">
                              Diğer Paketler
                            </div>
                            <div className="fw-bold h5 text-info">
                              {Object.keys(PACKAGE_INFO).length -
                                (PACKAGE_CATEGORIES.KPSS?.length || 0) -
                                (PACKAGE_CATEGORIES.AGS?.length || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Details Modal */}
        <CustomModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Plan Detayları"
          size="lg"
        >
          {selectedPlan && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      <i className="bi bi-info-circle me-2"></i>
                      Temel Bilgiler
                    </h6>
                    <div className="mb-2">
                      <strong>Plan Adı:</strong>
                      <br />
                      <span className="h5 text-dark">{selectedPlan.name}</span>
                    </div>
                    <div className="mb-2">
                      <strong>Durum:</strong>
                      <br />
                      <span
                        className={`badge ${
                          selectedPlan.isActive ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {selectedPlan.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                    <div className="mb-2">
                      <strong>Fiyat:</strong>
                      <br />
                      <span className="h5 text-success">
                        {selectedPlan.price} {selectedPlan.currency}
                      </span>
                    </div>
                    <div className="mb-2">
                      <strong>Süre:</strong>
                      <br />
                      <span className="badge bg-info">
                        {selectedPlan.periodMonths} ay
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      <i className="bi bi-gear me-2"></i>
                      Teknik Bilgiler
                    </h6>
                    <div className="mb-2">
                      <strong>Plan ID:</strong>
                      <br />
                      <code className="text-muted">{selectedPlan.id}</code>
                    </div>
                    <div className="mb-2">
                      <strong>Plan Key:</strong>
                      <br />
                      <span className="badge bg-primary me-2">
                        {getPlanKeyLabel(selectedPlan.key)}
                      </span>
                      <br />
                      <small>
                        <code className="text-muted">{selectedPlan.key}</code>
                      </small>
                    </div>
                    <div className="mb-2">
                      <strong>Index:</strong>
                      <br />
                      <span className="badge bg-secondary">
                        {selectedPlan.index}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CustomModal>

        {/* Add Plan Modal */}
        <CustomModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Yeni Plan Ekle"
          size="lg"
        >
          <div className="p-3">
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Plan Name */}
              <div className="mb-3">
                <label htmlFor="planName" className="form-label fw-semibold">
                  <i className="bi bi-tag me-2"></i>
                  Plan Adı
                </label>
                <input
                  type="text"
                  id="planName"
                  className="form-control"
                  placeholder="Örn: KPSS Premium Paket"
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Plan Key */}
              <div className="mb-3">
                <label htmlFor="planKey" className="form-label fw-semibold">
                  <i className="bi bi-key me-2"></i>
                  Plan Key (Paket Türü)
                </label>
                <select
                  id="planKey"
                  className="form-select"
                  value={newPlan.key}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, key: e.target.value })
                  }
                  required
                >
                  {planKeyOptions.map((option, index) => (
                    <option
                      key={index}
                      value={option.value}
                      disabled={option.disabled}
                      style={
                        option.disabled
                          ? {
                              fontWeight: "bold",
                              backgroundColor: "#f8f9fa",
                            }
                          : {}
                      }
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  Planın hangi paket türü ile ilişkilendirileceğini seçin.
                </div>
              </div>

              {/* Price and Period */}
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label
                      htmlFor="planPrice"
                      className="form-label fw-semibold"
                    >
                      <i className="bi bi-currency-dollar me-2"></i>
                      Fiyat (TRY)
                    </label>
                    <input
                      type="number"
                      id="planPrice"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={newPlan.price}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          price: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label
                      htmlFor="planPeriod"
                      className="form-label fw-semibold"
                    >
                      <i className="bi bi-calendar-month me-2"></i>
                      Süre (Ay)
                    </label>
                    <select
                      id="planPeriod"
                      className="form-select"
                      value={newPlan.periodMonths}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          periodMonths: Number(e.target.value),
                        })
                      }
                    >
                      <option value={1}>1 Ay</option>
                      <option value={3}>3 Ay</option>
                      <option value={6}>6 Ay</option>
                      <option value={12}>12 Ay</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className="mb-3">
                <label
                  htmlFor="planCurrency"
                  className="form-label fw-semibold"
                >
                  <i className="bi bi-globe me-2"></i>
                  Para Birimi
                </label>
                <select
                  id="planCurrency"
                  className="form-select"
                  value={newPlan.currency}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, currency: e.target.value })
                  }
                >
                  <option value="TRY">TRY (Türk Lirası)</option>
                  <option value="USD">USD (Amerikan Doları)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              {/* Features */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-list-check me-2"></i>
                  Özellikler (Opsiyonel)
                </label>
                <div className="form-text mb-2">
                  Her satıra bir özellik yazın. Boş bırakabilirsiniz.
                </div>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Örn:&#10;Sınırsız soru çözümü&#10;Video dersler&#10;PDF materyaller&#10;Canlı destek"
                  onChange={(e) => {
                    const features = e.target.value
                      .split("\n")
                      .map((f) => f.trim())
                      .filter((f) => f.length > 0);
                    setNewPlan({ ...newPlan, features });
                  }}
                />
              </div>

              {/* Images */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-image me-2"></i>
                  Resimler (Maksimum 5)
                </label>
                <div className="form-text mb-2">
                  Plan için resim ekleyin. Maksimum 5 resim ekleyebilirsiniz.
                  <br />
                  <small className="text-muted">
                    Kabul edilen formatlar: JPG, PNG, WEBP, GIF (Maksimum 5MB)
                  </small>
                </div>
                <input
                  type="file"
                  className="form-control form-control-sm mb-2"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={(e) => handleImageSelect(e, false)}
                  disabled={newPlan.images.length >= 5}
                />
                {newPlan.images.length > 0 && (
                  <div className="row g-2 mt-2">
                    {newPlan.images.map((imageUrl, index) => (
                      <div key={index} className="col-md-4 position-relative">
                        <img
                          src={imageUrl}
                          alt={`Plan resmi ${index + 1}`}
                          className="img-thumbnail"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EResim Yüklenemedi%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger position-absolute top-0 end-0 m-1"
                          onClick={() => handleImageRemove(index, false)}
                          style={{
                            zIndex: 10,
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            lineHeight: 1,
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {Object.values(uploadingImages).some((v) => v) && (
                  <div className="mt-2">
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <small className="text-muted">Resim yükleniyor...</small>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addPlan}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Plan Ekle
                </button>
              </div>
            </form>
          </div>
        </CustomModal>

        {/* Edit Plan Modal */}
        <CustomModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Plan Düzenle"
          size="lg"
        >
          <div className="p-3">
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Plan Name */}
              <div className="mb-3">
                <label
                  htmlFor="editPlanName"
                  className="form-label fw-semibold"
                >
                  <i className="bi bi-tag me-2"></i>
                  Plan Adı
                </label>
                <input
                  type="text"
                  id="editPlanName"
                  className="form-control"
                  placeholder="Örn: KPSS Premium Paket"
                  value={editPlan.name}
                  onChange={(e) =>
                    setEditPlan({ ...editPlan, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Plan Key */}
              <div className="mb-3">
                <label htmlFor="editPlanKey" className="form-label fw-semibold">
                  <i className="bi bi-key me-2"></i>
                  Plan Key (Paket Türü)
                </label>
                <select
                  id="editPlanKey"
                  className="form-select"
                  value={editPlan.key}
                  onChange={(e) =>
                    setEditPlan({ ...editPlan, key: e.target.value })
                  }
                  required
                >
                  {planKeyOptions.map((option, index) => (
                    <option
                      key={index}
                      value={option.value}
                      disabled={option.disabled}
                      style={
                        option.disabled
                          ? {
                              fontWeight: "bold",
                              backgroundColor: "#f8f9fa",
                            }
                          : {}
                      }
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="form-text">
                  Planın hangi paket türü ile ilişkilendirileceğini seçin.
                </div>
              </div>

              {/* Price and Period */}
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label
                      htmlFor="editPlanPrice"
                      className="form-label fw-semibold"
                    >
                      <i className="bi bi-currency-dollar me-2"></i>
                      Fiyat (TRY)
                    </label>
                    <input
                      type="number"
                      id="editPlanPrice"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={editPlan.price}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          price: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label
                      htmlFor="editPlanPeriod"
                      className="form-label fw-semibold"
                    >
                      <i className="bi bi-calendar-month me-2"></i>
                      Süre (Ay)
                    </label>
                    <select
                      id="editPlanPeriod"
                      className="form-select"
                      value={editPlan.periodMonths}
                      onChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          periodMonths: Number(e.target.value),
                        })
                      }
                    >
                      <option value={1}>1 Ay</option>
                      <option value={3}>3 Ay</option>
                      <option value={6}>6 Ay</option>
                      <option value={12}>12 Ay</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className="mb-3">
                <label
                  htmlFor="editPlanCurrency"
                  className="form-label fw-semibold"
                >
                  <i className="bi bi-globe me-2"></i>
                  Para Birimi
                </label>
                <select
                  id="editPlanCurrency"
                  className="form-select"
                  value={editPlan.currency}
                  onChange={(e) =>
                    setEditPlan({ ...editPlan, currency: e.target.value })
                  }
                >
                  <option value="TRY">TRY (Türk Lirası)</option>
                  <option value="USD">USD (Amerikan Doları)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              {/* Features */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-list-check me-2"></i>
                  Özellikler (Opsiyonel)
                </label>
                <div className="form-text mb-2">
                  Her satıra bir özellik yazın. Boş bırakabilirsiniz.
                </div>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Örn:&#10;Sınırsız soru çözümü&#10;Video dersler&#10;PDF materyaller&#10;Canlı destek"
                  value={editPlan.features.join("\n")}
                  onChange={(e) => {
                    const features = e.target.value
                      .split("\n")
                      .map((f) => f.trim())
                      .filter((f) => f.length > 0);
                    setEditPlan({ ...editPlan, features });
                  }}
                />
              </div>

              {/* Images */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-image me-2"></i>
                  Resimler (Maksimum 5)
                </label>
                <div className="form-text mb-2">
                  Plan için resim ekleyin. Maksimum 5 resim ekleyebilirsiniz.
                  <br />
                  <small className="text-muted">
                    Kabul edilen formatlar: JPG, PNG, WEBP, GIF (Maksimum 5MB)
                  </small>
                </div>
                <input
                  type="file"
                  className="form-control form-control-sm mb-2"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={(e) => handleImageSelect(e, true)}
                  disabled={editPlan.images.length >= 5}
                />
                {editPlan.images.length > 0 && (
                  <div className="row g-2 mt-2">
                    {editPlan.images.map((imageUrl, index) => (
                      <div key={index} className="col-md-4 position-relative">
                        <img
                          src={imageUrl}
                          alt={`Plan resmi ${index + 1}`}
                          className="img-thumbnail"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EResim Yüklenemedi%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger position-absolute top-0 end-0 m-1"
                          onClick={() => handleImageRemove(index, true)}
                          style={{
                            zIndex: 10,
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            lineHeight: 1,
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {Object.values(uploadingImages).some((v) => v) && (
                  <div className="mt-2">
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <small className="text-muted">Resim yükleniyor...</small>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={updatePlan}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </CustomModal>

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={planToDelete ? handleConfirmDelete : handleConfirmToggle}
          title={
            planToDelete
              ? "Planı Sil"
              : planToToggle?.isActive
              ? "Planı Pasifleştir"
              : "Planı Aktifleştir"
          }
          message={
            planToDelete
              ? `${planToDelete.name} planını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`
              : `${planToToggle?.name} planını ${
                  planToToggle?.isActive ? "pasifleştirmek" : "aktifleştirmek"
                } istediğinizden emin misiniz?`
          }
          confirmText={
            planToDelete
              ? "Sil"
              : planToToggle?.isActive
              ? "Pasifleştir"
              : "Aktifleştir"
          }
          cancelText="Vazgeç"
          confirmVariant={
            planToDelete
              ? "danger"
              : planToToggle?.isActive
              ? "warning"
              : "success"
          }
          icon={
            planToDelete
              ? "bi-trash"
              : planToToggle?.isActive
              ? "bi-pause-circle"
              : "bi-play-circle"
          }
        />
      </div>
    </AdminGuard>
  );
}
