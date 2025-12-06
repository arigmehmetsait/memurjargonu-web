"use client";
import { useState, useEffect, useRef } from "react";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getValidToken } from "@/utils/tokenCache";
import { formatDate } from "@/utils/formatDate";

type NotificationHistory = {
  id: string;
  title: string;
  message: string;
  redirectUrl: string;
  targetType: "all" | "specific";
  targetUserIds: string[];
  sentAt: number;
  sentBy: string;
  totalSent: number;
};

export default function NotificationsAdmin() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    redirectUrl: "/",
    targetType: "all" as "all" | "specific",
    targetUserIds: [] as string[],
  });

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ id: string; email: string }>
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Kullanıcı arama fonksiyonu
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setAvailableUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const idToken = await getValidToken();
      if (!idToken) throw new Error("Kullanıcı oturumu bulunamadı");

      const response = await fetch(
        `/api/admin/users/list?q=${encodeURIComponent(query)}&pageSize=10`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Kullanıcılar yüklenemedi");

      const data = await response.json();
      setAvailableUsers(
        data.rows?.map((row: any) => ({
          id: row.id,
          email: row.email,
        })) || []
      );
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Bildirim gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const idToken = await getValidToken();
      if (!idToken) throw new Error("Kullanıcı oturumu bulunamadı");

      const payload = {
        title: formData.title,
        message: formData.message,
        redirectUrl: formData.redirectUrl,
        targetType: formData.targetType,
        targetUserIds:
          formData.targetType === "specific" ? selectedUserIds : undefined,
      };

      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.error || "Bildirim gönderilemedi";

        // Daha detaylı hata mesajı
        if (data.usersWithoutTokens && data.usersWithoutTokens.length > 0) {
          errorMessage += ` (${data.usersWithoutTokens.length} kullanıcının token'ı yok)`;
        }

        throw new Error(errorMessage);
      }

      setMsg({
        type: "success",
        text: `Bildirim başarıyla gönderildi! ${data.totalSent} kullanıcıya ulaştı.`,
      });

      // Formu temizle
      setFormData({
        title: "",
        message: "",
        redirectUrl: "/",
        targetType: "all",
        targetUserIds: [],
      });
      setSelectedUserIds([]);

      // Geçmişi yenile
      setHistoryCursor(null);
      fetchHistory(true);
    } catch (error: any) {
      setMsg({
        type: "error",
        text: error.message || "Bildirim gönderilirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  // Bildirim geçmişini yükle
  const fetchHistory = async (reset = false) => {
    if (reset) {
      setHistoryCursor(null);
      setHistory([]);
    }

    setHistoryLoading(true);
    try {
      const idToken = await getValidToken();
      if (!idToken) throw new Error("Kullanıcı oturumu bulunamadı");

      const params = new URLSearchParams({
        pageSize: "20",
      });

      if (historyCursor && !reset) {
        params.append("cursor", historyCursor);
      }

      const response = await fetch(
        `/api/admin/notifications/history?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Geçmiş yüklenemedi");

      const data = await response.json();
      setHistory((prev) =>
        reset ? data.notifications : [...prev, ...data.notifications]
      );
      setHistoryCursor(data.nextCursor);
      setHasMoreHistory(data.hasMore);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(true);
  }, []);

  const addUserToSelection = (userId: string) => {
    if (!selectedUserIds.includes(userId)) {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
    setUserSearchQuery("");
  };

  const removeUserFromSelection = (userId: string) => {
    setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
  };

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        <div className="container py-5">
          <div className="row">
            <div className="col-12">
              <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-dark mb-3">
                  <i className="bi bi-bell me-3"></i>
                  Bildirim Yönetimi
                </h1>
                <p className="lead text-muted">
                  Kullanıcılara push bildirimleri gönderin ve geçmiş
                  bildirimleri görüntüleyin.
                </p>
              </div>

              <Breadcrumb
                showHome={false}
                items={[
                  { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                  {
                    label: "Bildirim Yönetimi",
                    icon: "bi-bell",
                    active: true,
                  },
                ]}
              />

              {msg && (
                <div
                  className={`alert alert-${
                    msg.type === "success" ? "success" : "danger"
                  } alert-dismissible fade show mt-3`}
                  role="alert"
                >
                  {msg.text}
                  {msg.type === "error" && msg.text.includes("token") && (
                    <div className="mt-2 small">
                      <strong>Not:</strong> Kullanıcıların bildirim alabilmesi
                      için:
                      <ul className="mb-0 mt-1">
                        <li>Giriş yapmış olmaları</li>
                        <li>Bildirim izni vermiş olmaları</li>
                        <li>
                          VAPID key'in .env.local'de tanımlı olması gerekiyor
                        </li>
                      </ul>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMsg(null)}
                  ></button>
                </div>
              )}

              <div className="row mt-4">
                {/* Bildirim Gönderme Formu */}
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-send me-2"></i>
                        Yeni Bildirim Gönder
                      </h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label htmlFor="title" className="form-label">
                            Başlık *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            required
                            placeholder="Bildirim başlığı"
                          />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="message" className="form-label">
                            Mesaj *
                          </label>
                          <textarea
                            className="form-control"
                            id="message"
                            rows={4}
                            value={formData.message}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                message: e.target.value,
                              })
                            }
                            required
                            placeholder="Bildirim mesajı"
                          />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="redirectUrl" className="form-label">
                            Yönlendirme URL'i
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="redirectUrl"
                            value={formData.redirectUrl}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                redirectUrl: e.target.value,
                              })
                            }
                            placeholder="/ veya /plans gibi"
                          />
                          <small className="form-text text-muted">
                            Bildirime tıklandığında yönlendirilecek sayfa
                          </small>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Hedef Kitle</label>
                          <div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="targetType"
                                id="targetAll"
                                value="all"
                                checked={formData.targetType === "all"}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    targetType: e.target.value as
                                      | "all"
                                      | "specific",
                                  })
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor="targetAll"
                              >
                                Tüm Kullanıcılar
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="targetType"
                                id="targetSpecific"
                                value="specific"
                                checked={formData.targetType === "specific"}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    targetType: e.target.value as
                                      | "all"
                                      | "specific",
                                  })
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor="targetSpecific"
                              >
                                Seçili Kullanıcılar
                              </label>
                            </div>
                          </div>
                        </div>

                        {formData.targetType === "specific" && (
                          <div className="mb-3">
                            <label className="form-label">Kullanıcı Seç</label>
                            <input
                              type="text"
                              className="form-control mb-2"
                              placeholder="Kullanıcı email ile ara..."
                              value={userSearchQuery}
                              onChange={(e) =>
                                setUserSearchQuery(e.target.value)
                              }
                            />
                            {loadingUsers && (
                              <div className="text-muted small">
                                Aranıyor...
                              </div>
                            )}
                            {availableUsers.length > 0 && (
                              <div
                                className="list-group mb-2"
                                style={{
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                }}
                              >
                                {availableUsers
                                  .filter(
                                    (u) => !selectedUserIds.includes(u.id)
                                  )
                                  .map((user) => (
                                    <button
                                      key={user.id}
                                      type="button"
                                      className="list-group-item list-group-item-action text-dark"
                                      onClick={() =>
                                        addUserToSelection(user.id)
                                      }
                                    >
                                      {user.email}
                                    </button>
                                  ))}
                              </div>
                            )}
                            {selectedUserIds.length > 0 && (
                              <div className="mt-2">
                                <small className="text-muted d-block mb-2">
                                  Seçili Kullanıcılar ({selectedUserIds.length}
                                  ):
                                </small>
                                {selectedUserIds.map((userId) => {
                                  const user = availableUsers.find(
                                    (u) => u.id === userId
                                  );
                                  return (
                                    <span
                                      key={userId}
                                      className="badge bg-primary me-2 mb-2"
                                      style={{
                                        fontSize: "0.9rem",
                                        cursor: "pointer",
                                      }}
                                      onClick={() =>
                                        removeUserFromSelection(userId)
                                      }
                                    >
                                      {user?.email || userId}
                                      <i className="bi bi-x ms-1"></i>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                              ></span>
                              Gönderiliyor...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-send me-2"></i>
                              Bildirim Gönder
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Bildirim Geçmişi */}
                <div className="col-lg-6">
                  <div className="card shadow-sm">
                    <div className="card-header bg-secondary text-white">
                      <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>
                        Bildirim Geçmişi
                      </h5>
                    </div>
                    <div
                      className="card-body"
                      style={{ maxHeight: "600px", overflowY: "auto" }}
                    >
                      {historyLoading && history.length === 0 ? (
                        <div className="text-center py-4">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">
                              Yükleniyor...
                            </span>
                          </div>
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-muted text-center">
                          Henüz bildirim gönderilmemiş.
                        </p>
                      ) : (
                        <>
                          {history.map((notif) => (
                            <div
                              key={notif.id}
                              className="border-bottom pb-3 mb-3"
                            >
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0 fw-bold">{notif.title}</h6>
                                <small className="text-muted">
                                  {formatDate(new Date(notif.sentAt))}
                                </small>
                              </div>
                              <p className="text-muted small mb-2">
                                {notif.message}
                              </p>
                              <div className="d-flex gap-2 flex-wrap">
                                <span className="badge bg-info">
                                  {notif.targetType === "all"
                                    ? "Tüm Kullanıcılar"
                                    : "Seçili Kullanıcılar"}
                                </span>
                                <span className="badge bg-success">
                                  {notif.totalSent} gönderildi
                                </span>
                                {notif.redirectUrl && (
                                  <span className="badge bg-secondary">
                                    <i className="bi bi-link-45deg me-1"></i>
                                    {notif.redirectUrl}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {hasMoreHistory && (
                            <button
                              className="btn btn-outline-primary w-100 mt-3"
                              onClick={() => fetchHistory(false)}
                              disabled={historyLoading}
                            >
                              {historyLoading ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                  ></span>
                                  Yükleniyor...
                                </>
                              ) : (
                                "Daha Fazla Yükle"
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer variant="admin" />
      </div>
    </AdminGuard>
  );
}
