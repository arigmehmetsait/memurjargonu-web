import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";

interface DogruYanlisDeneme {
  id: string;
  name: string;
  description: string;
  soruSayisi: number;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

export default function AdminDogruYanlisPage() {
  const router = useRouter();
  const [denemeler, setDenemeler] = useState<DogruYanlisDeneme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDenemeName, setNewDenemeName] = useState("");
  const [newDenemeDescription, setNewDenemeDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [denemeToEdit, setDenemeToEdit] = useState<DogruYanlisDeneme | null>(
    null
  );
  const [editDenemeName, setEditDenemeName] = useState("");
  const [editDenemeDescription, setEditDenemeDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [denemeToDelete, setDenemeToDelete] =
    useState<DogruYanlisDeneme | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDenemeler();
  }, []);

  const fetchDenemeler = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dogru-yanlis/list");
      const data = await response.json();

      if (data.success) {
        setDenemeler(data.data);
      } else {
        const errorMsg = data.error || "Doğru-Yanlış denemeleri yüklenemedi";
        const details = data.details ? ` (${data.details})` : "";
        setError(errorMsg + details);
      }
    } catch (err) {
      console.error("Doğru-Yanlış denemeleri yüklenirken hata:", err);
      setError(
        "Doğru-Yanlış denemeleri yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeneme = async () => {
    if (!newDenemeName.trim()) {
      toast.warn("Deneme adı gereklidir");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/dogru-yanlis/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newDenemeName.trim(),
          description: newDenemeDescription.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Başarılı - modal'ı kapat ve listeyi yenile
        setShowCreateModal(false);
        setNewDenemeName("");
        setNewDenemeDescription("");
        await fetchDenemeler();
        toast.success("Doğru-Yanlış denemesi başarıyla oluşturuldu!");
      } else {
        toast.error(data.error || "Deneme oluşturulamadı");
      }
    } catch (err) {
      console.error("Doğru-Yanlış denemesi oluşturma hatası:", err);
      toast.error("Doğru-Yanlış denemesi oluşturulurken bir hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (deneme: DogruYanlisDeneme) => {
    setDenemeToDelete(deneme);
    setShowDeleteModal(true);
  };

  const handleEditClick = (deneme: DogruYanlisDeneme) => {
    setDenemeToEdit(deneme);
    setEditDenemeName(deneme.name);
    setEditDenemeDescription(deneme.description || "");
    setShowEditModal(true);
  };

  const handleUpdateDeneme = async () => {
    if (!denemeToEdit) return;

    if (!editDenemeName.trim()) {
      toast.warn("Deneme adı gereklidir");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch("/api/admin/dogru-yanlis/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          denemeId: denemeToEdit.id,
          name: editDenemeName.trim(),
          description: editDenemeDescription.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Doğru-Yanlış denemesi güncellendi");
        setShowEditModal(false);
        setDenemeToEdit(null);
        await fetchDenemeler();
      } else {
        toast.error(data.error || "Deneme güncellenemedi");
      }
    } catch (err) {
      console.error("Doğru-Yanlış denemesi güncellenirken hata:", err);
      toast.error("Deneme güncellenirken bir hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!denemeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/admin/dogru-yanlis/delete?denemeId=${encodeURIComponent(
          denemeToDelete.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setDenemeToDelete(null);
        fetchDenemeler(); // Listeyi yenile
        toast.success(
          `"${data.data.denemeName}" doğru-yanlış denemesi silindi. ${data.data.deletedQuestionsCount} soru da silindi.`
        );
      } else {
        toast.error(data.error || "Deneme silinemedi");
      }
    } catch (err) {
      console.error("Doğru-Yanlış denemesi silme hatası:", err);
      toast.error("Doğru-Yanlış denemesi silinirken bir hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminGuard>
      <Head>
        <title>Doğru-Yanlış Yönetimi - Admin Panel</title>
        <meta name="description" content="Doğru-Yanlış denemeleri yönetimi" />
      </Head>

      <Header variant="admin" />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <button
                  className="btn btn-outline-secondary mb-2"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                <h1 className="h2 mb-0">
                  <i className="bi bi-check2-square me-2"></i>
                  Doğru-Yanlış Yönetimi
                </h1>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Doğru-Yanlış Ekle
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button
                  className="btn btn-outline-danger btn-sm ms-3"
                  onClick={fetchDenemeler}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : denemeler.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-check2-square display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">
                  Henüz doğru-yanlış bulunmuyor
                </h3>
                <p className="text-muted">
                  Sistemde henüz hiç doğru-yanlış denemesi eklenmemiş.
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Doğru-Yanlış'ı Ekle
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Deneme Adı</th>
                      <th>Soru Sayısı</th>
                      <th>ID</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denemeler.map((deneme) => (
                      <tr key={deneme.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i className="bi bi-check2-square"></i>
                            </div>
                            <div>
                              <strong>{deneme.name}</strong>
                              <br />
                              <small className="text-muted">
                                {deneme.description || "Doğru-Yanlış Denemesi"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            <i className="bi bi-question-circle me-1"></i>
                            {deneme.soruSayisi} Soru
                          </span>
                        </td>
                        <td>
                          <code className="text-muted">{deneme.id}</code>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            {/* <button
                              className="btn btn-outline-primary btn-sm"
                              title="Denemeyi Görüntüle (Kullanıcı Görünümü)"
                              onClick={() => {
                                window.open(
                                  `/dogru-yanlis/${encodeURIComponent(
                                    deneme.id
                                  )}`,
                                  "_blank"
                                );
                              }}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-info btn-sm"
                              title="İçerikler Sayfasında Görüntüle"
                              onClick={() => {
                                window.open("/icerikler", "_blank");
                              }}
                            >
                              <i className="bi bi-collection"></i>
                            </button> */}
                            <button
                              className="btn btn-outline-success btn-sm"
                              title="Soruları Yönet (Admin Görünümü)"
                              onClick={() => {
                                router.push(
                                  `/admin/dogru-yanlis/${encodeURIComponent(
                                    deneme.id
                                  )}/sorular`
                                );
                              }}
                            >
                              <i className="bi bi-list-ul"></i>
                            </button>
                            <button
                              className="btn btn-outline-warning btn-sm"
                              title="Düzenle"
                              onClick={() => handleEditClick(deneme)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Sil"
                              onClick={() => handleDeleteClick(deneme)}
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

            {denemeler.length > 0 && (
              <div className="mt-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="card-title">
                          <i className="bi bi-info-circle me-2"></i>
                          İstatistikler
                        </h5>
                        <p className="card-text">
                          <strong>Toplam Deneme:</strong> {denemeler.length}
                          <br />
                          <strong>Toplam Soru:</strong>{" "}
                          {denemeler.reduce((sum, d) => sum + d.soruSayisi, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="card-title">
                          <i className="bi bi-gear me-2"></i>
                          Hızlı İşlemler
                        </h5>
                        <div className="d-grid gap-2">
                          <button className="btn btn-outline-primary btn-sm">
                            <i className="bi bi-download me-2"></i>
                            Tüm Denemeleri Dışa Aktar
                          </button>
                          <button className="btn btn-outline-secondary btn-sm">
                            <i className="bi bi-upload me-2"></i>
                            Deneme İçe Aktar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Yeni Deneme Oluşturma Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Doğru-Yanlış Oluştur
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="denemeName" className="form-label">
                    Deneme Adı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="denemeName"
                    value={newDenemeName}
                    onChange={(e) => setNewDenemeName(e.target.value)}
                    placeholder="Örn: Doğru-Yanlış Deneme 1"
                    disabled={creating}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="denemeDescription" className="form-label">
                    Açıklama
                  </label>
                  <textarea
                    className="form-control"
                    id="denemeDescription"
                    rows={3}
                    value={newDenemeDescription}
                    onChange={(e) => setNewDenemeDescription(e.target.value)}
                    placeholder="Deneme hakkında açıklama (opsiyonel)"
                    disabled={creating}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateDeneme}
                  disabled={creating || !newDenemeName.trim()}
                >
                  {creating ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deneme Düzenleme Modal */}
      {showEditModal && denemeToEdit && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title text-dark">
                  <i className="bi bi-pencil me-2"></i>
                  Denemeyi Düzenle
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    if (updating) return;
                    setShowEditModal(false);
                    setDenemeToEdit(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="editDenemeName" className="form-label">
                    Deneme Adı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="editDenemeName"
                    className="form-control"
                    value={editDenemeName}
                    onChange={(e) => setEditDenemeName(e.target.value)}
                    disabled={updating}
                    placeholder="Deneme adını güncelleyin"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editDenemeDescription" className="form-label">
                    Açıklama
                  </label>
                  <textarea
                    id="editDenemeDescription"
                    className="form-control"
                    rows={3}
                    value={editDenemeDescription}
                    onChange={(e) => setEditDenemeDescription(e.target.value)}
                    disabled={updating}
                    placeholder="Deneme açıklamasını güncelleyin (opsiyonel)"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (updating) return;
                    setShowEditModal(false);
                    setDenemeToEdit(null);
                  }}
                  disabled={updating}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleUpdateDeneme}
                  disabled={updating || !editDenemeName.trim()}
                >
                  {updating ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Güncelle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {showDeleteModal && denemeToDelete && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Doğru-Yanlış Silme Onayı
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDenemeToDelete(null);
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Dikkat!</strong> Bu işlem geri alınamaz.
                </div>
                <p className="text-dark">
                  <strong>"{denemeToDelete.name}"</strong> doğru-yanlış
                  denemesini silmek istediğinizden emin misiniz?
                </p>
                <div className="bg-light p-3 rounded text-dark">
                  <h6>Silinecek İçerik:</h6>
                  <ul className="mb-0">
                    <li>Deneme dokümanı</li>
                    <li>Tüm sorular ve cevaplar</li>
                    <li>Deneme istatistikleri</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDenemeToDelete(null);
                  }}
                  disabled={deleting}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Evet, Sil
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
