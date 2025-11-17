"use client";
import AdminGuard from "@/components/AdminGuard";
import CustomModal from "@/components/CustomModal";
import ConfirmModal from "@/components/ConfirmModal";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, limit, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import Header from "@/components/Header";
import { formatDate } from "@/utils/formatDate";

export default function OrdersAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "orders"),
            orderBy("createdAt", "desc"),
            limit(50)
          )
        );
        setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (e) {
        setMsg(String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success";
      case "pending":
        return "bg-warning";
      case "failed":
        return "bg-danger";
      case "cancelled":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const handleShowOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = (order: any) => {
    setOrderToCancel(order);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      // Burada gerçek iptal işlemi yapılacak
      // Şimdilik sadece mesaj gösteriyoruz
      setMsg(
        `Sipariş ${orderToCancel.id} iptal edildi. (Bu özellik henüz geliştirilmedi)`
      );

      // Siparişi listeden güncelle
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === orderToCancel.id ? { ...row, status: "cancelled" } : row
        )
      );
    } catch (error) {
      setMsg(`İptal işlemi sırasında hata: ${error}`);
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setOrderToCancel(null);
  };

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />


        {/* Main Content */}
        <div className="container py-4">
          <div className="row">
            <div className="col-12">
              {/* Breadcrumb */}
              <Breadcrumb
                showHome={false}
                items={[
                  { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                  {
                    label: "Sipariş Yönetimi",
                    icon: "bi-receipt-cutoff",
                    active: true,
                  },
                ]}
              />
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h3 className="card-title mb-0">
                    <i className="bi bi-receipt-cutoff me-2"></i>
                    Son 50 Sipariş
                  </h3>
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
                      <p className="mt-3">Siparişler yükleniyor...</p>
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-inbox display-4 text-muted mb-3"></i>
                      <h5>Henüz sipariş yok</h5>
                      <p className="text-muted">
                        Sistem henüz hiç sipariş almamış.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 table-light">
                        <thead className="table-light">
                          <tr>
                            <th>Sipariş ID</th>
                            <th>Durum</th>
                            <th>Tutar</th>
                            <th>Kullanıcı</th>
                            <th>Plan</th>
                            <th>Tarih</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((order) => (
                            <tr key={order.id}>
                              <td>
                                <code className="text-primary">
                                  {order.id.slice(0, 8)}...
                                </code>
                              </td>
                              <td>
                                <span
                                  className={`badge ${getStatusBadge(
                                    order.status
                                  )}`}
                                >
                                  {order.status === "paid" && "Ödendi"}
                                  {order.status === "pending" && "Bekliyor"}
                                  {order.status === "failed" && "Başarısız"}
                                  {order.status === "cancelled" &&
                                    "İptal Edildi"}
                                  {![
                                    "paid",
                                    "pending",
                                    "failed",
                                    "cancelled",
                                  ].includes(order.status) && order.status}
                                </span>
                              </td>
                              <td>
                                <strong>
                                  {order.amount} {order.currency}
                                </strong>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {order.userId?.slice(0, 8)}...
                                </small>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {order.planId?.slice(0, 8)}...
                                </small>
                              </td>
                              <td>
                                <small>{formatDate(order.createdAt)}</small>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    title="Detayları Göster"
                                    onClick={() =>
                                      handleShowOrderDetails(order)
                                    }
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  {order.status === "pending" && (
                                    <button
                                      className="btn btn-outline-warning"
                                      title="Siparişi İptal Et"
                                      onClick={() => handleCancelOrder(order)}
                                    >
                                      <i className="bi bi-x-circle"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Summary Stats */}
                  {rows.length > 0 && (
                    <div className="card-footer bg-light">
                      <div className="row text-center">
                        <div className="col-md-3">
                          <div className="small text-muted">Toplam Sipariş</div>
                          <div className="fw-bold text-dark">{rows.length}</div>
                        </div>
                        <div className="col-md-3">
                          <div className="small text-muted">Ödendi</div>
                          <div className="fw-bold text-success">
                            {rows.filter((r) => r.status === "paid").length}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="small text-muted">Bekliyor</div>
                          <div className="fw-bold text-warning">
                            {rows.filter((r) => r.status === "pending").length}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="small text-muted">Başarısız</div>
                          <div className="fw-bold text-danger">
                            {rows.filter((r) => r.status === "failed").length}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {msg && (
                <div className="alert alert-danger mt-3" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Hata:</strong> {msg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details Modal */}
        <CustomModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Sipariş Detayları"
          size="lg"
        >
          {selectedOrder && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      <i className="bi bi-receipt me-2"></i>
                      Sipariş Bilgileri
                    </h6>
                    <div className="mb-2 text-dark">
                      <strong>Sipariş ID:</strong>
                      <br />
                      <code className="text-primary">{selectedOrder.id}</code>
                    </div>
                    <div className="mb-2 text-dark">
                      <strong>Durum:</strong>
                      <br />
                      <span
                        className={`badge ${getStatusBadge(
                          selectedOrder.status
                        )}`}
                      >
                        {selectedOrder.status === "paid" && "Ödendi"}
                        {selectedOrder.status === "pending" && "Bekliyor"}
                        {selectedOrder.status === "failed" && "Başarısız"}
                        {selectedOrder.status === "cancelled" && "İptal Edildi"}
                        {!["paid", "pending", "failed", "cancelled"].includes(
                          selectedOrder.status
                        ) && selectedOrder.status}
                      </span>
                    </div>
                    <div className="mb-2 text-dark">
                      <strong>Tutar:</strong>
                      <br />
                      <span className="h5 text-success">
                        {selectedOrder.amount} {selectedOrder.currency}
                      </span>
                    </div>
                    <div className="mb-2 text-dark">
                      <strong>Sağlayıcı:</strong>
                      <br />
                      <span className="badge bg-info">
                        {selectedOrder.provider || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      <i className="bi bi-person me-2"></i>
                      Kullanıcı & Plan Bilgileri
                    </h6>
                    <div className="mb-2 text-dark">
                      <strong>Kullanıcı ID:</strong>
                      <br />
                      <code className="text-muted">{selectedOrder.userId}</code>
                    </div>
                    <div className="mb-2 text-dark">
                      <strong>Plan ID:</strong>
                      <br />
                      <code className="text-muted">{selectedOrder.planId}</code>
                    </div>
                    <div className="mb-2 text-dark">
                      <strong>Plan Key:</strong>
                      <br />
                      <span className="badge bg-secondary">
                        {selectedOrder.planKey || "N/A"}
                      </span>
                    </div>
                    <div className="mb-2 text-dark">
                      <strong>Dönem:</strong>
                      <br />
                      <span className="text-muted">
                        {selectedOrder.periodMonths || "N/A"} ay
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      <i className="bi bi-clock me-2"></i>
                      Zaman Bilgileri
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-2 text-dark">
                          <strong>Oluşturulma:</strong>
                          <br />
                          <span className="text-muted">
                            {formatDate(selectedOrder.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        {selectedOrder.paidAt && (
                          <div className="mb-2 text-dark">
                            <strong>Ödenme:</strong>
                            <br />
                            <span className="text-success">
                              {formatDate(selectedOrder.paidAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.providerRef && (
                <div className="col-12">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title text-primary">
                        <i className="bi bi-link-45deg me-2"></i>
                        Provider Referansı
                      </h6>
                      <code className="text-muted">
                        {selectedOrder.providerRef}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.raw && (
                <div className="col-12">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title text-primary">
                        <i className="bi bi-code-slash me-2"></i>
                        Ham Veri
                      </h6>
                      <pre className="bg-dark text-light p-3 rounded small">
                        {JSON.stringify(selectedOrder.raw, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CustomModal>

        {/* Confirm Cancel Modal */}
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmCancel}
          title="Sipariş İptali"
          message={`${orderToCancel?.id} numaralı siparişi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="İptal Et"
          cancelText="Vazgeç"
          confirmVariant="warning"
          icon="bi-exclamation-triangle"
        />
      </div>
    </AdminGuard>
  );
}
