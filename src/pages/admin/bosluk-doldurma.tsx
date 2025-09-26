import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";

interface BoslukDoldurmaDeneme {
  id: string;
  name: string;
  description: string;
  soruSayisi: number;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

export default function AdminBoslukDoldurmaPage() {
  const router = useRouter();
  const [denemeler, setDenemeler] = useState<BoslukDoldurmaDeneme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDenemeName, setNewDenemeName] = useState("");
  const [newDenemeDescription, setNewDenemeDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [denemeToDelete, setDenemeToDelete] =
    useState<BoslukDoldurmaDeneme | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDenemeler();
  }, []);

  const fetchDenemeler = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/bosluk-doldurma/list");
      const data = await response.json();

      if (data.success) {
        setDenemeler(data.data);
      } else {
        const errorMsg = data.error || "Boşluk Doldurma denemeleri yüklenemedi";
        const details = data.details ? ` (${data.details})` : "";
        setError(errorMsg + details);
      }
    } catch (err) {
      console.error("Boşluk Doldurma denemeleri yüklenirken hata:", err);
      setError(
        "Boşluk Doldurma denemeleri yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeneme = async () => {
    if (!newDenemeName.trim()) {
      alert("Deneme adı gereklidir");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/admin/bosluk-doldurma/create", {
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
        alert("Boşluk Doldurma denemesi başarıyla oluşturuldu!");
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) {
      console.error("Boşluk Doldurma denemesi oluşturma hatası:", err);
      alert("Boşluk Doldurma denemesi oluşturulurken bir hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (deneme: BoslukDoldurmaDeneme) => {
    setDenemeToDelete(deneme);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!denemeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `/api/admin/bosluk-doldurma/delete?denemeId=${encodeURIComponent(
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
        alert(
          `"${data.data.denemeName}" boşluk doldurma denemesi başarıyla silindi. ${data.data.deletedQuestionsCount} soru da silindi.`
        );
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) {
      console.error("Boşluk Doldurma denemesi silme hatası:", err);
      alert("Boşluk Doldurma denemesi silinirken bir hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminGuard>
      <Head>
        <title>Boşluk Doldurma Yönetimi - Admin Panel</title>
        <meta
          name="description"
          content="Boşluk Doldurma denemeleri yönetimi"
        />
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
                  <i className="bi bi-pencil-square me-2"></i>
                  Boşluk Doldurma Yönetimi
                </h1>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Boşluk Doldurma Ekle
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
                <i className="bi bi-pencil-square display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">
                  Henüz boşluk doldurma bulunmuyor
                </h3>
                <p className="text-muted">
                  Sistemde henüz hiç boşluk doldurma denemesi eklenmemiş.
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Boşluk Doldurma'yı Ekle
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
                              className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </div>
                            <div>
                              <strong>{deneme.name}</strong>
                              <br />
                              <small className="text-muted">
                                {deneme.description ||
                                  "Boşluk Doldurma Denemesi"}
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
                            <button
                              className="btn btn-outline-primary btn-sm"
                              title="Denemeyi Görüntüle (Kullanıcı Görünümü)"
                              onClick={() => {
                                window.open(
                                  `/bosluk-doldurma/${encodeURIComponent(
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
                            </button>
                            <button
                              className="btn btn-outline-success btn-sm"
                              title="Soruları Yönet (Admin Görünümü)"
                              onClick={() => {
                                router.push(
                                  `/admin/bosluk-doldurma/${encodeURIComponent(
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
                  <div className="col-md-6">
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
                  </div>
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
                  Yeni Boşluk Doldurma Oluştur
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
                    placeholder="Örn: Boşluk Doldurma Deneme 1"
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
                  Boşluk Doldurma Silme Onayı
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
                <p>
                  <strong>"{denemeToDelete.name}"</strong> boşluk doldurma
                  denemesini silmek istediğinizden emin misiniz?
                </p>
                <div className="bg-light p-3 rounded">
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
