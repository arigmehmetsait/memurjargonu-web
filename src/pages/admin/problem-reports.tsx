"use client";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Alert from "@/components/Alert";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getValidToken } from "@/utils/tokenCache";
import { useEffect, useState } from "react";

type ProblemReport = {
  id: string;
  description: string;
  problemType: string;
  status: "new" | "in_review" | "resolved";
  timestamp: any;
  userEmail: string;
  userId: string;
};

export default function ProblemReportsAdmin() {
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Problem reports'ları yükle
  const loadReports = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const idToken = await getValidToken(); // Cache'li token

      const response = await fetch("/api/admin/problem-reports", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReports(data.data);
        } else {
          setMessage(`❌ ${data.error || "Problem reports yüklenemedi"}`);
        }
      } else {
        setMessage("❌ Problem reports yüklenirken hata oluştu");
      }
    } catch (error) {
      console.error("Problem reports load error:", error);
      setMessage("❌ Bağlantı hatası oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Status değiştir
  const updateStatus = async (
    reportId: string,
    newStatus: "new" | "in_review" | "resolved"
  ) => {
    try {
      const idToken = await getValidToken(); // Cache'li token

      const response = await fetch("/api/admin/problem-reports/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          reportId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage(`✅ Status başarıyla güncellendi`);
          loadReports(); // Listeyi yenile
        } else {
          setMessage(`❌ ${data.error || "Status güncellenemedi"}`);
        }
      } else {
        setMessage("❌ Status güncellenirken hata oluştu");
      }
    } catch (error) {
      console.error("Status update error:", error);
      setMessage("❌ Bağlantı hatası oluştu");
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      new: "bg-warning",
      in_review: "bg-info",
      resolved: "bg-success",
    };

    const statusTexts = {
      new: "Yeni",
      in_review: "İnceleniyor",
      resolved: "Çözüldü",
    };

    return (
      <span
        className={`badge ${badgeClasses[status as keyof typeof badgeClasses]}`}
      >
        {statusTexts[status as keyof typeof statusTexts]}
      </span>
    );
  };

  const getProblemTypeText = (type: string) => {
    const typeTexts = {
      bug: "Hata",
      feature: "Özellik İsteği",
      other: "Diğer",
    };

    return typeTexts[type as keyof typeof typeTexts] || type;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Bilinmiyor";

    try {
      let date: Date;

      // Firebase Firestore timestamp formatı (_seconds, _nanoseconds)
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      }
      // Eski format (seconds)
      else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Direkt Date objesi veya string
      else {
        date = new Date(timestamp);
      }

      return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date parsing error:", error, timestamp);
      return "Geçersiz tarih";
    }
  };

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        <div className="container py-5">
          <div className="row">
            <div className="col-12">
              {/* Page Header */}
              <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-dark mb-3">
                  <i className="bi bi-bug me-3"></i>
                  Problem Reports
                </h1>
                <p className="lead text-muted">
                  Kullanıcıların bildirdiği problemleri görüntüleyin ve
                  durumlarını yönetin.
                </p>
              </div>

              {/* Breadcrumb */}
              <Breadcrumb
                showHome={false}
                items={[
                  { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                  { label: "Problem Reports", icon: "bi-bug", active: true },
                ]}
              />

              {/* Action Buttons */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <span className="text-muted">
                    {reports.length} problem report bulundu
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={loadReports}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Yenile
                  </button>
                </div>
              </div>

              {/* Reports List */}
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Yükleniyor...</span>
                      </div>
                      <p className="mt-2 text-muted">
                        Problem reports yükleniyor...
                      </p>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-bug display-4 text-muted mb-3"></i>
                      <h5 className="text-muted">Problem report bulunamadı</h5>
                      <p className="text-muted">
                        Henüz hiç problem report bildirilmemiş.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Kullanıcı</th>
                            <th>Açıklama</th>
                            <th>Tür</th>
                            <th>Durum</th>
                            <th>Tarih</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((report) => (
                            <tr key={report.id}>
                              <td>
                                <div>
                                  <div className="fw-semibold">
                                    {report.userEmail}
                                  </div>
                                  <small className="text-muted">
                                    {report.userId}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div
                                  className="text-wrap"
                                  style={{ maxWidth: "300px" }}
                                >
                                  {report.description}
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-secondary">
                                  {getProblemTypeText(report.problemType)}
                                </span>
                              </td>
                              <td>{getStatusBadge(report.status)}</td>
                              <td>
                                <small className="text-muted">
                                  {formatDate(report.timestamp)}
                                </small>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <select
                                    className="form-select form-select-sm"
                                    value={report.status}
                                    onChange={(e) =>
                                      updateStatus(
                                        report.id,
                                        e.target.value as any
                                      )
                                    }
                                    style={{ minWidth: "120px" }}
                                  >
                                    <option value="new">Yeni</option>
                                    <option value="in_review">
                                      İnceleniyor
                                    </option>
                                    <option value="resolved">Çözüldü</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Alert */}
              {message && (
                <Alert
                  type={
                    message.includes("✅")
                      ? "success"
                      : message.includes("❌")
                      ? "danger"
                      : "info"
                  }
                  message={message}
                  className="mt-4"
                />
              )}
            </div>
          </div>
        </div>

        <Footer variant="admin" />
      </div>
    </AdminGuard>
  );
}
