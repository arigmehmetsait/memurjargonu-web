import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { eslestirmelerService, EslestirmeDocument } from "@/services/admin/eslestirmelerService";
import { toast } from "react-toastify";



export default function AdminEslestirmelerPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<EslestirmeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocId, setNewDocId] = useState("");
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<EslestirmeDocument | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eslestirmelerService.list();

      if (response.success) {
        setDocuments(response.data);
      } else {
        const errorMsg = response.error || "Eşleştirmeler yüklenemedi";
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Eşleştirmeler yüklenirken hata:", err);
      setError(
        "Eşleştirmeler yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocId.trim()) {
      toast.warn("Doküman ID gereklidir");
      return;
    }

    try {
      setCreating(true);

      const response = await eslestirmelerService.create(newDocId.trim());

      if (response.success) {
        setShowCreateModal(false);
        setNewDocId("");
        await fetchDocuments();
        toast.success("Eşleştirme dokümanı başarıyla oluşturuldu!");
      } else {
        toast.error(response.error || "Doküman oluşturulamadı");
      }
    } catch (err) {
      console.error("Eşleştirme dokümanı oluşturma hatası:", err);
      toast.error("Doküman oluşturulurken bir hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (doc: EslestirmeDocument) => {
    setDocToDelete(doc);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;

    try {
      setDeleting(true);
      const response = await eslestirmelerService.delete(docToDelete.id);

      if (response.success) {
        setShowDeleteModal(false);
        setDocToDelete(null);
        fetchDocuments();
        toast.success(
          `"${response.data?.name || docToDelete.id}" dokümanı başarıyla silindi.`
        );
      } else {
        toast.error(response.error || "Doküman silinemedi");
      }
    } catch (err) {
      console.error("Eşleştirme dokümanı silme hatası:", err);
      toast.error("Doküman silinirken bir hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditDocument = (docId: string) => {
    router.push(`/admin/eslestirmeler/${encodeURIComponent(docId)}`);
  };

  return (
    <AdminGuard>
      <Head>
        <title>Eşleştirmeler Yönetimi - Admin Panel</title>
        <meta name="description" content="Eşleştirmeler dokümanları yönetimi" />
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
                  <i className="bi bi-diagram-3 me-2"></i>
                  Eşleştirmeler Yönetimi
                </h1>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Doküman Ekle
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
                  onClick={fetchDocuments}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-diagram-3 display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">Henüz doküman bulunmuyor</h3>
                <p className="text-muted">
                  Sistemde henüz hiç eşleştirme dokümanı eklenmemiş.
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Dokümanı Ekle
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Doküman Adı</th>
                      <th>Level Sayısı</th>
                      <th>Level'lar</th>
                      <th>ID</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i className="bi bi-diagram-3"></i>
                            </div>
                            <div>
                              <strong>{doc.name}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            <i className="bi bi-layers me-1"></i>
                            {doc.levelCount} Level
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {doc.levels?.slice(0, 5).map((level: string) => (
                              <span
                                key={level}
                                className="badge bg-info text-dark"
                              >
                                {level}
                              </span>
                            ))}
                            {doc.levels?.length > 5 && (
                              <span className="badge bg-light text-dark">
                                +{doc.levels.length - 5}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <code className="text-muted">{doc.id}</code>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-outline-success btn-sm"
                              title="Düzenle"
                              onClick={() => handleEditDocument(doc.id)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Sil"
                              onClick={() => handleDeleteClick(doc)}
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

            {documents.length > 0 && (
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
                          <strong>Toplam Doküman:</strong> {documents.length}
                          <br />
                          <strong>Toplam Level:</strong>{" "}
                          {documents.reduce((sum, d) => sum + d.levelCount, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Yeni Doküman Oluşturma Modal */}
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
                  Yeni Eşleştirme Dokümanı Oluştur
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="docId" className="form-label">
                    Doküman ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="docId"
                    value={newDocId}
                    onChange={(e) => setNewDocId(e.target.value)}
                    placeholder="Örn: cografya, tarih, vatandaşlık"
                    disabled={creating}
                  />
                  <small className="form-text text-muted">
                    Doküman ID'si küçük harflerle ve boşluksuz olmalıdır.
                  </small>
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
                  onClick={handleCreateDocument}
                  disabled={creating || !newDocId.trim()}
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

      {/* Silme Onay Modalı */}
      {showDeleteModal && docToDelete && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Doküman Silme Onayı
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDocToDelete(null);
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Dikkat!</strong> Bu işlem geri alınamaz.
                </div>
                <p>
                  <strong>"{docToDelete.id}"</strong> dokümanını silmek
                  istediğinizden emin misiniz?
                </p>
                <div className="bg-light p-3 rounded">
                  <h6>Silinecek İçerik:</h6>
                  <ul className="mb-0">
                    <li>Doküman ve tüm alanları</li>
                    <li>Tüm level verileri</li>
                    <li>İlişkili tüm veriler</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDocToDelete(null);
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
