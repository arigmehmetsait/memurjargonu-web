"use client";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Alert from "@/components/Alert";
import PackageManager from "@/components/PackageManager";
import ConfirmModal from "@/components/ConfirmModal";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { usersService, UserRow } from "@/services/admin/usersService";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { formatDate } from "@/utils/formatDate";

// ... existing imports ...
type Row = UserRow;

export default function UsersAdmin() {
  // Premium işlemleri için state'ler
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Kullanıcı listesi için state'ler
  const [rows, setRows] = useState<Row[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Kullanıcı düzenleme modalı için state'ler
  const [editingUser, setEditingUser] = useState<Row | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    forumNickname: "",
    isPremium: false,
    isBlocked: false,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Kontroller
  const [q, setQ] = useState("");
  const [premium, setPremium] = useState<"all" | "true" | "false">("all");
  const [pageSize, setPageSize] = useState(20);

  // Pagination
  const [cursor, setCursor] = useState<string | null>(null);
  const backStack = useRef<string[]>([]); // for Prev

  // Paket yönetimi için state'ler
  const [showPackageManager, setShowPackageManager] = useState(false);
  const [selectedUserForPackage, setSelectedUserForPackage] = useState<{
    id: string;
    email: string;
  } | null>(null);

  // Block onay modalı için state'ler
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [userToBlock, setUserToBlock] = useState<Row | null>(null);

  // Filter değişikliklerini otomatik takip et
  useEffect(() => {
    // İlk yüklemede çalışmasın diye timeout
    const timer = setTimeout(() => {
      backStack.current = [];
      setCursor(null);
      fetchPageWithParams({ toCursor: null });
    }, 100);

    return () => clearTimeout(timer);
  }, [premium, pageSize]); // premium ve pageSize değiştiğinde otomatik çalışır


  // Kullanıcı listesi fonksiyonları - parametrelerle
  const fetchPageWithParams = async (overrideParams?: {
    q?: string;
    premium?: "all" | "true" | "false";
    pageSize?: number;
    toCursor?: string | null;
    forward?: boolean;
  }) => {
    setListLoading(true);
    setMsg(null);
    try {
      const cur = overrideParams?.toCursor ?? cursor;
      
      const response = await usersService.list({
        q: overrideParams?.q ?? q,
        premium: overrideParams?.premium ?? premium,
        pageSize: overrideParams?.pageSize ?? pageSize,
        cursor: cur,
      });

      // back stack yönetimi
      if (overrideParams?.forward) {
        if (cursor) backStack.current.push(cursor);
        setCursor(response.nextCursor || null);
      } else {
        setCursor(response.nextCursor || null);
      }

      setRows(response.rows || []);
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || e}`);
      console.error("users list error", e);
    } finally {
      setListLoading(false);
    }
  };

  const fetchPage = async (opts?: {
    forward?: boolean;
    toCursor?: string | null;
  }) => {
    return fetchPageWithParams({
      forward: opts?.forward,
      toCursor: opts?.toCursor,
    });
  };

  const doSearch = () => {
    backStack.current = [];
    setCursor(null);
    fetchPageWithParams({ toCursor: null });
  };

  const onNext = () => fetchPage({ forward: true, toCursor: cursor });
  const onPrev = () => {
    const prev = backStack.current.pop() ?? null;
    fetchPage({ toCursor: prev });
    setCursor(prev);
  };

  const canPrev = backStack.current.length > 0;
  const canNext = !!cursor;

  // Kullanıcı düzenleme fonksiyonları
  const openEditModal = (user: Row) => {
    setEditingUser(user);
    setEditForm({
      email: user.email || "",
      forumNickname: user.forumNickname || "",
      isPremium: user.isPremium,
      isBlocked: user.isBlocked,
    });
  };

  const openPackageManager = (userId: string, userEmail: string) => {
    setSelectedUserForPackage({ id: userId, email: userEmail });
    setShowPackageManager(true);
  };

  const closePackageManager = () => {
    setShowPackageManager(false);
    setSelectedUserForPackage(null);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({
      email: "",
      forumNickname: "",
      isPremium: false,
      isBlocked: false,
    });
  };

  const openBlockConfirm = (user: Row) => {
    setUserToBlock(user);
    setShowBlockConfirm(true);
  };

  const badge = (ok: boolean) => (
    <span className={`badge ${ok ? "bg-success" : "bg-secondary"}`}>
      {ok ? "Premium" : "Free"}
    </span>
  );

  const blockBadge = (isBlocked: boolean) => (
    <span className={`badge ${isBlocked ? "bg-danger" : "bg-success"}`}>
      {isBlocked ? "Engelli" : "Aktif"}
    </span>
  );

  const saveUserChanges = async () => {
    if (!editingUser) return;

    setEditLoading(true);
    try {
      await usersService.edit({
          uid: editingUser.id,
          ...editForm
      });

      setMsg("✅ Kullanıcı bilgileri başarıyla güncellendi!");
      closeEditModal();
      doSearch(); // Listeyi yenile
    } catch (error: any) {
      setMsg(`❌ Hata: ${error?.message || "Bir hata oluştu"}`);
    } finally {
      setEditLoading(false);
    }
  };

  const confirmBlockAction = async () => {
    if (!userToBlock) return;

    setLoading(true);
    setShowBlockConfirm(false);

    try {
      await usersService.toggleBlock(userToBlock.id, !userToBlock.isBlocked);

      setMsg(
        `✅ Kullanıcı ${
          userToBlock.isBlocked ? "engeli kaldırıldı" : "engellendi"
        }!`
      );
      doSearch(); // Listeyi yenile
    } catch (error: any) {
       setMsg(`❌ Hata: ${error?.message || "İşlem başarısız"}`);
    } finally {
      setLoading(false);
      setUserToBlock(null);
    }
  };
 
  // ... badges ...

  // Premium işlemleri fonksiyonu
  const call = async (action: "grant" | "revoke") => {
    if (!email.trim()) {
      setMsg("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setLoading(true);
    setMsg("İşlem gerçekleştiriliyor...");

    try {
      await usersService.managePremium({
          email,
          months,
          action
      });

      setMsg(
        `✅ ${
          action === "grant"
            ? "Premium başarıyla verildi/uzatıldı!"
            : "Premium başarıyla kaldırıldı!"
        }`
      );
      setEmail(""); // Formu temizle
      setMonths(1);
      // Liste yenile
      doSearch();
    } catch (error: any) {
      setMsg(`❌ Hata: ${error?.message || "İşlem başarısız"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage({ toCursor: null }); // first load
  }, []);

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        {/* Main Content */}
        <div className="container py-5">
          <div className="row">
            <div className="col-12">
              {/* Page Header */}
              <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-dark mb-3">
                  <i className="bi bi-people me-3"></i>
                  Kullanıcı Yönetimi
                </h1>
                <p className="lead text-muted">
                  Kullanıcıları görüntüleyin, premium üyelik işlemlerini yönetin
                  ve gelişmiş paket yönetimi yapın.
                </p>
              </div>

              {/* Breadcrumb */}
              <Breadcrumb
                showHome={false}
                items={[
                  { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                  {
                    label: "Kullanıcı Yönetimi",
                    icon: "bi-people",
                    active: true,
                  },
                ]}
              />

              {/* Kullanıcı Listesi */}
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-list me-2"></i>
                    Kullanıcı Listesi
                  </h5>
                </div>
                <div className="card-body p-0">
                  {/* Kontroller */}
                  <div className="p-3 border-bottom">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ara: email / nickname / UID"
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && doSearch()}
                        />
                      </div>
                      <div className="col-md-2">
                        <select
                          className="form-select"
                          value={premium}
                          onChange={(e) => {
                            const newPremiumValue = e.target.value as
                              | "all"
                              | "true"
                              | "false";
                            setPremium(newPremiumValue);
                            // useEffect otomatik olarak yeni arama yapacak
                          }}
                        >
                          <option value="all">Tümü</option>
                          <option value="true">Sadece Premium</option>
                          <option value="false">Sadece Free</option>
                        </select>
                      </div>
                      <div className="col-md-2">
                        <select
                          className="form-select"
                          value={pageSize}
                          onChange={(e) => {
                            const newPageSize = Number(e.target.value);
                            setPageSize(newPageSize);
                            // useEffect otomatik olarak yeni arama yapacak
                          }}
                        >
                          {[10, 20, 50, 100].map((n) => (
                            <option key={n} value={n}>
                              {n}/sayfa
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <button
                          className="btn btn-primary w-100"
                          onClick={doSearch}
                        >
                          <i className="bi bi-search me-1"></i>
                          Ara
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tablo */}
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Email / UID</th>
                          <th>Nickname</th>
                          <th>Premium</th>
                          <th>Durum</th>
                          <th>Premium Bitiş</th>
                          <th>Aktif Paketler</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listLoading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Yükleniyor...
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center py-4 text-muted"
                            >
                              {q.trim()
                                ? `"${q.trim()}" için sonuç bulunamadı. Email adresini kontrol edin.`
                                : "Kayıt bulunamadı."}
                            </td>
                          </tr>
                        ) : (
                          rows.map((r) => (
                            <tr key={r.id}>
                              <td>
                                <div>
                                  <div className="fw-semibold">
                                    {r.email || (
                                      <em className="text-muted">
                                        (email yok)
                                      </em>
                                    )}
                                  </div>
                                  <small className="text-muted">{r.id}</small>
                                </div>
                              </td>
                              <td>{r.forumNickname || "-"}</td>
                              <td>{badge(r.isPremium)}</td>
                              <td>{blockBadge(r.isBlocked)}</td>
                              <td>
                                {r.premiumExpiry ? formatDate(r.premiumExpiry) : "-"}
                              </td>
                              <td>
                                {r.totalActivePackages &&
                                r.totalActivePackages > 0 ? (
                                  <div>
                                    <span className="badge bg-success me-1">
                                      {r.totalActivePackages} Paket
                                    </span>
                                    <small className="text-muted d-block">
                                      {r.activePackages?.slice(0, 2).join(", ")}
                                      {r.activePackages &&
                                        r.activePackages.length > 2 &&
                                        "..."}
                                    </small>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => openEditModal(r)}
                                    title="Düzenle"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-info"
                                    onClick={() =>
                                      openPackageManager(r.id, r.email)
                                    }
                                    title="Paket Yönetimi"
                                  >
                                    <i className="bi bi-gift"></i>
                                  </button>
                                  <button
                                    className={`btn ${
                                      r.isBlocked
                                        ? "btn-outline-success"
                                        : "btn-outline-danger"
                                    }`}
                                    onClick={() => openBlockConfirm(r)}
                                    title={
                                      r.isBlocked ? "Engeli Kaldır" : "Engelle"
                                    }
                                  >
                                    <i
                                      className={`bi ${
                                        r.isBlocked ? "bi-unlock" : "bi-lock"
                                      }`}
                                    ></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="p-3 border-top">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted">
                        {rows.length > 0 && `${rows.length} kayıt gösteriliyor`}
                      </div>
                      <div className="btn-group">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={!canPrev}
                          onClick={onPrev}
                        >
                          <i className="bi bi-chevron-left me-1"></i>
                          Önceki
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={!canNext}
                          onClick={onNext}
                        >
                          Sonraki
                          <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Premium İşlemleri Formu */}
              <div className="card shadow-sm">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-person-plus me-2"></i>
                    Premium Üyelik İşlemleri
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={(e) => e.preventDefault()}>
                    {/* Email Input */}
                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="form-label fw-semibold text-dark"
                      >
                        <i className="bi bi-envelope me-2"></i>
                        Kullanıcı E-posta Adresi
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-control form-control-lg"
                        placeholder="ornek@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <div className="form-text">
                        Premium işlemi yapılacak kullanıcının e-posta adresini
                        girin.
                      </div>
                    </div>

                    {/* Months Input */}
                    <div className="mb-4">
                      <label
                        htmlFor="months"
                        className="form-label fw-semibold text-dark"
                      >
                        <i className="bi bi-calendar-month me-2"></i>
                        Üyelik Süresi (Ay)
                      </label>
                      <div className="row">
                        <div className="col-md-6">
                          <input
                            type="number"
                            id="months"
                            className="form-control form-control-lg"
                            min="1"
                            max="24"
                            value={months}
                            onChange={(e) => setMonths(Number(e.target.value))}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex gap-2 mt-2 mt-md-0">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setMonths(1)}
                            >
                              1 Ay
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setMonths(3)}
                            >
                              3 Ay
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setMonths(6)}
                            >
                              6 Ay
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setMonths(12)}
                            >
                              12 Ay
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="form-text">
                        Premium üyelik süresini ay cinsinden belirtin (1-24 ay
                        arası).
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-grid gap-3">
                      <div className="row">
                        <div className="col-md-6">
                          <button
                            type="button"
                            className="btn btn-success btn-lg w-100"
                            onClick={() => call("grant")}
                            disabled={loading || !email.trim()}
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
                                <i className="bi bi-check-circle me-2"></i>
                                Premium Ver/Uzat
                              </>
                            )}
                          </button>
                        </div>
                        <div className="col-md-6">
                          <button
                            type="button"
                            className="btn btn-danger btn-lg w-100"
                            onClick={() => call("revoke")}
                            disabled={loading || !email.trim()}
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
                                <i className="bi bi-x-circle me-2"></i>
                                Premium Kaldır
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Message Alert */}
              {msg && (
                <Alert
                  type={
                    msg.includes("✅")
                      ? "success"
                      : msg.includes("❌")
                      ? "danger"
                      : "info"
                  }
                  message={msg}
                  className="mt-4"
                />
              )}

              {/* Info Cards */}
              <div className="row mt-5">
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-person-check"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Premium Ver</h6>
                      <p className="text-muted small">
                        Kullanıcıya belirtilen süre kadar premium üyelik verir
                        veya mevcut üyeliğini uzatır.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-person-x"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Premium Kaldır</h6>
                      <p className="text-muted small">
                        Kullanıcının premium üyeliğini tamamen kaldırır ve
                        normal üye seviyesine döndürür.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center">
                      <div className="admin-icon mb-3">
                        <i className="bi bi-shield-check"></i>
                      </div>
                      <h6 className="fw-bold text-dark">Güvenli İşlem</h6>
                      <p className="text-muted small">
                        Tüm işlemler güvenli şekilde kaydedilir ve kullanıcıya
                        anında yansır.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer variant="admin" />

        {/* Kullanıcı Düzenleme Modalı */}
        {editingUser && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-pencil me-2"></i>
                    Kullanıcı Düzenle
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEditModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={(e) => e.preventDefault()}>
                    {/* Email */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-envelope me-2"></i>
                        E-posta Adresi
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        disabled
                      />
                      <div className="form-text">
                        E-posta adresi değiştirilemez.
                      </div>
                    </div>

                    {/* Forum Nickname */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-person me-2"></i>
                        Forum Nickname
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.forumNickname}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            forumNickname: e.target.value,
                          })
                        }
                        placeholder="Forum kullanıcı adı"
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEditModal}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    İptal
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveUserChanges}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Kaydet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paket Yönetimi Modal */}
        {showPackageManager && selectedUserForPackage && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-gift me-2"></i>
                    Paket Yönetimi - {selectedUserForPackage.email}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closePackageManager}
                  ></button>
                </div>
                <div className="modal-body">
                  <PackageManager
                    userId={selectedUserForPackage.id}
                    onPackageChange={() => {
                      // Paket değişikliği olduğunda kullanıcı listesini yenile
                      fetchPage();
                    }}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closePackageManager}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Block Onay Modalı */}
        {showBlockConfirm && userToBlock && (
          <ConfirmModal
            isOpen={showBlockConfirm}
            onClose={() => {
              setShowBlockConfirm(false);
              setUserToBlock(null);
            }}
            onConfirm={confirmBlockAction}
            title={
              userToBlock.isBlocked ? "Engeli Kaldır" : "Kullanıcıyı Engelle"
            }
            message={
              userToBlock.isBlocked
                ? `"${
                    userToBlock.email ||
                    userToBlock.forumNickname ||
                    userToBlock.id
                  }" kullanıcısının engelini kaldırmak istediğinizden emin misiniz?`
                : `"${
                    userToBlock.email ||
                    userToBlock.forumNickname ||
                    userToBlock.id
                  }" kullanıcısını engellemek istediğinizden emin misiniz?`
            }
            confirmText={userToBlock.isBlocked ? "Engeli Kaldır" : "Engelle"}
            cancelText="İptal"
            confirmVariant={userToBlock.isBlocked ? "success" : "danger"}
            icon={userToBlock.isBlocked ? "bi-unlock" : "bi-lock"}
          />
        )}
      </div>
    </AdminGuard>
  );
}
