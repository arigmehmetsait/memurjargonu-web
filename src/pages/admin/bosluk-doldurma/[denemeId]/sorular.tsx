import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Soru {
  id: string;
  soru: string;
  cevap: string;
  secenekler: string[];
  dogruSecenek: number;
  aciklama?: string;
  zorluk?: string;
  konu?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

interface DenemeData {
  denemeId: string;
  denemeName: string;
  sorular: Soru[];
  totalCount: number;
}

export default function AdminBoslukDoldurmaSorularPage() {
  const router = useRouter();
  const { denemeId } = router.query;

  const [denemeData, setDenemeData] = useState<DenemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSoru, setEditingSoru] = useState<Soru | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [soruToDelete, setSoruToDelete] = useState<Soru | null>(null);

  // Form states
  const [soruText, setSoruText] = useState("");
  const [dogruCevap, setDogruCevap] = useState("");
  const [secenekler, setSecenekler] = useState<string[]>(["", "", "", ""]);
  const [aciklama, setAciklama] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (denemeId && typeof denemeId === "string") {
      fetchSorular();
    }
  }, [denemeId]);

  const fetchSorular = async () => {
    if (!denemeId || typeof denemeId !== "string") return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/bosluk-doldurma/${encodeURIComponent(denemeId)}/sorular`
      );
      const data = await response.json();

      if (data.success) {
        setDenemeData(data.data);
      } else {
        setError(data.error || "Sorular yüklenemedi");
      }
    } catch (err) {
      console.error("Sorular yüklenirken hata:", err);
      setError("Sorular yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSoru = async () => {
    if (!soruText.trim()) {
      alert("Soru metni gereklidir");
      return;
    }

    if (!dogruCevap.trim()) {
      alert("Doğru cevap gereklidir");
      return;
    }

    const validSecenekler = secenekler.filter((sec) => sec.trim().length > 0);
    if (validSecenekler.length < 2) {
      alert("En az 2 seçenek gereklidir");
      return;
    }

    if (!validSecenekler.includes(dogruCevap.trim())) {
      alert("Doğru cevap seçenekler arasında olmalıdır");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/bosluk-doldurma/${encodeURIComponent(
          denemeId as string
        )}/sorular`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionText: soruText.trim(),
            correctAnswer: dogruCevap.trim(),
            options: validSecenekler,
            explanation: aciklama.trim(),
            difficulty: "orta",
            subject: "Boşluk Doldurma",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        resetForm();
        await fetchSorular();
        alert("Soru başarıyla eklendi!");
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) {
      console.error("Soru ekleme hatası:", err);
      alert("Soru eklenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSoru = (soru: Soru) => {
    setEditingSoru(soru);
    setSoruText(soru.soru);
    setDogruCevap(soru.cevap);
    setSecenekler([...soru.secenekler, "", "", ""].slice(0, 4));
    setAciklama(soru.aciklama || "");
    setShowCreateModal(true);
  };

  const handleUpdateSoru = async () => {
    if (!editingSoru || !soruText.trim()) {
      alert("Soru metni gereklidir");
      return;
    }

    if (!dogruCevap.trim()) {
      alert("Doğru cevap gereklidir");
      return;
    }

    const validSecenekler = secenekler.filter((sec) => sec.trim().length > 0);
    if (validSecenekler.length < 2) {
      alert("En az 2 seçenek gereklidir");
      return;
    }

    if (!validSecenekler.includes(dogruCevap.trim())) {
      alert("Doğru cevap seçenekler arasında olmalıdır");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/bosluk-doldurma/${encodeURIComponent(
          denemeId as string
        )}/sorular/${encodeURIComponent(editingSoru.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionText: soruText.trim(),
            correctAnswer: dogruCevap.trim(),
            options: validSecenekler,
            explanation: aciklama.trim(),
            difficulty: "orta",
            subject: "Boşluk Doldurma",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setEditingSoru(null);
        resetForm();
        await fetchSorular();
        alert("Soru başarıyla güncellendi!");
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) {
      console.error("Soru güncelleme hatası:", err);
      alert("Soru güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (soru: Soru) => {
    setSoruToDelete(soru);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!soruToDelete || !denemeId) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/admin/bosluk-doldurma/${encodeURIComponent(
          denemeId as string
        )}/sorular/${encodeURIComponent(soruToDelete.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setSoruToDelete(null);
        await fetchSorular();
        alert("Soru başarıyla silindi!");
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) {
      console.error("Soru silme hatası:", err);
      alert("Soru silinirken bir hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setSoruText("");
    setDogruCevap("");
    setSecenekler(["", "", "", ""]);
    setAciklama("");
    setEditingSoru(null);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingSoru(null);
    resetForm();
  };

  const handleSecenekChange = (index: number, value: string) => {
    const newSecenekler = [...secenekler];
    newSecenekler[index] = value;
    setSecenekler(newSecenekler);
  };

  if (!denemeId || typeof denemeId !== "string") {
    return (
      <AdminGuard>
        <div className="container my-5">
          <div className="alert alert-danger">Geçersiz deneme ID</div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Head>
        <title>
          Sorular - {denemeData?.denemeName || denemeId} - Admin Panel
        </title>
        <meta name="description" content="Boşluk Doldurma soruları yönetimi" />
      </Head>

      <Header variant="admin" />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h2">
                  <i className="bi bi-list-ul me-2"></i>
                  Sorular
                </h1>
                <p className="text-muted mb-0">
                  {denemeData?.denemeName || denemeId} - Boşluk Doldurma
                  Denemesi
                </p>
              </div>
              <div>
                <button
                  className="btn btn-outline-secondary me-2"
                  onClick={() => router.push("/admin/bosluk-doldurma")}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Soru Ekle
                </button>
              </div>
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
                  onClick={fetchSorular}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : !denemeData ? (
              <div className="alert alert-warning" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Deneme verisi bulunamadı
              </div>
            ) : denemeData.sorular.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-question-circle display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">Henüz soru bulunmuyor</h3>
                <p className="text-muted">
                  Bu boşluk doldurma denemesine henüz hiç soru eklenmemiş.
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Soruyu Ekle
                </button>
              </div>
            ) : (
              <div className="row">
                {denemeData.sorular.map((soru, index) => (
                  <div key={soru.id} className="col-md-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          <span className="badge bg-primary me-2">
                            Soru {index + 1}
                          </span>
                          {soru.id}
                        </h6>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-info"
                            title="Detayları Görüntüle"
                            onClick={() => {
                              setEditingSoru(soru);
                              setSoruText(soru.soru);
                              setDogruCevap(soru.cevap);
                              setSecenekler(
                                [...soru.secenekler, "", "", ""].slice(0, 4)
                              );
                              setAciklama(soru.aciklama || "");
                              setShowCreateModal(true);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            title="Düzenle"
                            onClick={() => handleEditSoru(soru)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            title="Sil"
                            onClick={() => handleDeleteClick(soru)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                      <div className="card-body">
                        <p className="card-text">{soru.soru}</p>
                        <div className="mt-3">
                          <div className="alert alert-info py-2 mb-0">
                            <strong>Doğru Cevap: </strong>
                            <span className="badge bg-success ms-2">
                              <i className="bi bi-check-circle me-1"></i>
                              {soru.cevap}
                            </span>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">
                              <strong>Seçenekler:</strong>{" "}
                              {soru.secenekler.join(", ")}
                            </small>
                          </div>
                        </div>
                        {soru.aciklama && (
                          <div className="mt-3">
                            <small className="text-muted">
                              <strong>Açıklama:</strong> {soru.aciklama}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {denemeData && denemeData.sorular.length > 0 && (
              <div className="mt-4">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-info-circle me-2"></i>
                      İstatistikler
                    </h5>
                    <p className="card-text">
                      <strong>Toplam Soru:</strong> {denemeData.totalCount}
                      <br />
                      <strong>Ortalama Seçenek Sayısı:</strong>{" "}
                      {Math.round(
                        denemeData.sorular.reduce(
                          (sum, s) => sum + s.secenekler.length,
                          0
                        ) / denemeData.sorular.length
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Soru Oluşturma/Düzenleme Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  {editingSoru ? "Soruyu Düzenle" : "Yeni Soru Ekle"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="soruText" className="form-label">
                    Soru Metni <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="soruText"
                    rows={4}
                    value={soruText}
                    onChange={(e) => setSoruText(e.target.value)}
                    placeholder="Boşluk doldurma sorusunu buraya yazın... (Boşluk için ___ kullanın)"
                    disabled={saving}
                  />
                  <small className="form-text text-muted">
                    Boşluk yerine ___ (3 alt çizgi) kullanın
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="dogruCevap" className="form-label">
                    Doğru Cevap <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="dogruCevap"
                    value={dogruCevap}
                    onChange={(e) => setDogruCevap(e.target.value)}
                    placeholder="Doğru cevabı yazın..."
                    disabled={saving}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Seçenekler <span className="text-danger">*</span>
                  </label>
                  {secenekler.map((secenek, index) => (
                    <div key={index} className="input-group mb-2">
                      <span className="input-group-text">
                        {String.fromCharCode(65 + index)})
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={secenek}
                        onChange={(e) =>
                          handleSecenekChange(index, e.target.value)
                        }
                        placeholder={`Seçenek ${index + 1}`}
                        disabled={saving}
                      />
                    </div>
                  ))}
                  <small className="form-text text-muted">
                    En az 2 seçenek doldurun. Doğru cevap seçenekler arasında
                    olmalıdır.
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="aciklama" className="form-label">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    className="form-control"
                    id="aciklama"
                    rows={3}
                    value={aciklama}
                    onChange={(e) => setAciklama(e.target.value)}
                    placeholder="Soru için açıklama ekleyin (opsiyonel)..."
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={editingSoru ? handleUpdateSoru : handleCreateSoru}
                  disabled={saving || !soruText.trim() || !dogruCevap.trim()}
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      {editingSoru ? "Güncelleniyor..." : "Ekleniyor..."}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      {editingSoru ? "Güncelle" : "Ekle"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {showDeleteModal && soruToDelete && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Soru Silme Onayı
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSoruToDelete(null);
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Dikkat!</strong> Bu işlem geri alınamaz.
                </div>
                <p>Bu soruyu silmek istediğinizden emin misiniz?</p>
                <div className="bg-light p-3 rounded">
                  <strong>Soru:</strong>
                  <p className="mb-0 mt-2">{soruToDelete.soru}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSoruToDelete(null);
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
