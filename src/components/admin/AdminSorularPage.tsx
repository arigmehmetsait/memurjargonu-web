import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import CustomModal from "@/components/CustomModal";
import ConfirmModal from "@/components/ConfirmModal";
import { getValidToken } from "@/utils/tokenCache";
import { getDenemeConfig } from "@/utils/denemeRouting";

interface Soru {
  id: string;
  soru: string;
  cevap: string;
  secenekler: string[];
  dogruSecenek: number;
  aciklama: string;
  zorluk: string;
  konu: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

interface DenemeData {
  denemeId: string;
  denemeName: string;
  sorular: Soru[];
  totalCount: number;
}

interface AdminSorularPageProps {
  denemeType: string;
}

export default function AdminSorularPage({
  denemeType,
}: AdminSorularPageProps) {
  const router = useRouter();
  const { denemeId } = router.query;

  const config = getDenemeConfig(denemeType);

  const [denemeData, setDenemeData] = useState<DenemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state'leri
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSoru, setSelectedSoru] = useState<Soru | null>(null);

  // Düzenleme formu state'i
  const [editForm, setEditForm] = useState({
    soru: "",
    cevap: "",
    secenekler: ["", "", "", ""],
    dogruSecenek: 0,
    aciklama: "",
    zorluk: "orta",
    konu: "",
  });

  // Yeni soru ekleme formu state'i
  const [newSoruForm, setNewSoruForm] = useState({
    soru: "",
    cevap: "",
    secenekler: ["", "", "", ""],
    dogruSecenek: 0,
    aciklama: "",
    zorluk: "orta",
    konu: "",
  });

  useEffect(() => {
    if (denemeId && typeof denemeId === "string") {
      fetchSorular();
    }
  }, [denemeId, denemeType]);

  const fetchSorular = async () => {
    if (!denemeId || typeof denemeId !== "string") return;

    try {
      setLoading(true);
      setError(null);

      console.log("Sorular API'sine istek gönderiliyor...");
      const response = await fetch(`${config.apiPath}/${denemeId}/sorular`);
      const data = await response.json();

      console.log("Sorular API yanıtı:", data);

      if (data.success) {
        setDenemeData(data.data);
        console.log("Sorular başarıyla yüklendi:", data.data);
      } else {
        setError(data.error || "Sorular yüklenemedi");
        console.error("API hatası:", data);
      }
    } catch (err) {
      console.error("Sorular yüklenirken hata:", err);
      setError(
        "Sorular yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const getZorlukBadgeClass = (zorluk: string) => {
    switch (zorluk.toLowerCase()) {
      case "kolay":
        return "bg-success";
      case "orta":
        return "bg-warning";
      case "zor":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const getZorlukText = (zorluk: string) => {
    switch (zorluk.toLowerCase()) {
      case "kolay":
        return "Kolay";
      case "orta":
        return "Orta";
      case "zor":
        return "Zor";
      default:
        return "Belirtilmemiş";
    }
  };

  // Soru işlem fonksiyonları
  const handleViewSoru = (soru: Soru) => {
    setSelectedSoru(soru);
    setIsViewModalOpen(true);
  };

  const handleEditSoru = (soru: Soru) => {
    setSelectedSoru(soru);
    setEditForm({
      soru: soru.soru,
      cevap: soru.cevap,
      secenekler: [...soru.secenekler],
      dogruSecenek: soru.dogruSecenek,
      aciklama: soru.aciklama,
      zorluk: soru.zorluk,
      konu: config.defaultKonu, // Deneme türüne göre konu
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteSoru = (soru: Soru) => {
    setSelectedSoru(soru);
    setIsDeleteModalOpen(true);
  };

  const updateSoru = async () => {
    if (!selectedSoru || !denemeId) return;

    try {
      setLoading(true);
      const token = await getValidToken();

      const response = await fetch(
        `${config.adminApiPath}/${denemeId}/sorular/${selectedSoru.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSorular(); // Listeyi yenile
        setIsEditModalOpen(false);
        setSelectedSoru(null);
      } else {
        setError(data.error || "Soru güncellenemedi");
      }
    } catch (err) {
      console.error("Soru güncellenirken hata:", err);
      setError("Soru güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const deleteSoru = async () => {
    if (!selectedSoru || !denemeId) return;

    try {
      setLoading(true);
      const token = await getValidToken();

      const response = await fetch(
        `${config.adminApiPath}/${denemeId}/sorular/${selectedSoru.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSorular(); // Listeyi yenile
        setIsDeleteModalOpen(false);
        setSelectedSoru(null);
      } else {
        setError(data.error || "Soru silinemedi");
      }
    } catch (err) {
      console.error("Soru silinirken hata:", err);
      setError("Soru silinirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSoru = () => {
    // Formu sıfırla ve konuyu otomatik doldur
    setNewSoruForm({
      soru: "",
      cevap: "",
      secenekler: ["", "", "", ""],
      dogruSecenek: 0,
      aciklama: "",
      zorluk: "orta",
      konu: config.defaultKonu,
    });
    setIsAddModalOpen(true);
  };

  const addNewSoru = async () => {
    if (!denemeId) return;

    // Form validasyonu
    if (
      !newSoruForm.soru.trim() ||
      !newSoruForm.cevap.trim() ||
      !newSoruForm.konu.trim()
    ) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    // En az 2 seçenek olmalı
    const filledSecenekler = newSoruForm.secenekler.filter(
      (sec) => sec.trim() !== ""
    );
    if (filledSecenekler.length < 2) {
      setError("En az 2 seçenek doldurulmalıdır.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getValidToken();

      const response = await fetch(
        `${config.adminApiPath}/${denemeId}/sorular`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newSoruForm),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSorular(); // Listeyi yenile
        setIsAddModalOpen(false);
        setNewSoruForm({
          soru: "",
          cevap: "",
          secenekler: ["", "", "", ""],
          dogruSecenek: 0,
          aciklama: "",
          zorluk: "orta",
          konu: config.defaultKonu,
        });
      } else {
        setError(data.error || "Soru eklenemedi");
      }
    } catch (err) {
      console.error("Soru eklenirken hata:", err);
      setError("Soru eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedSoru(null);
  };

  return (
    <AdminGuard>
      <Head>
        <title>
          {denemeData?.denemeName || "Deneme"} - {config.title} - Admin Panel
        </title>
        <meta
          name="description"
          content={`${
            denemeData?.denemeName || "Deneme"
          } ${config.title.toLowerCase()} yönetimi`}
        />
      </Head>

      <Header variant="admin" />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h2">
                  <i className="bi bi-list-ul me-2"></i>
                  {denemeData?.denemeName || "Deneme"} - {config.title}
                </h1>
                {denemeData && (
                  <p className="text-muted mb-0">
                    {denemeData.totalCount} soru • Admin Panel
                  </p>
                )}
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    router.push(`${config.userViewPath}/${denemeId}`);
                  }}
                >
                  <i className="bi bi-eye me-2"></i>
                  Kullanıcı Görünümü
                </button>
                <button className="btn btn-primary" onClick={handleAddSoru}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Soru Ekle
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner />
                <p className="mt-3 text-muted">Sorular yükleniyor...</p>
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
            ) : !denemeData || denemeData.sorular.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-question-circle display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">Henüz soru bulunmuyor</h3>
                <p className="text-muted">
                  Bu denemede henüz hiç soru eklenmemiş.
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={handleAddSoru}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Soruyu Ekle
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Soru</th>
                      <th>Seçenekler</th>
                      <th>Doğru Cevap</th>
                      <th>Zorluk</th>
                      <th>Konu</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denemeData.sorular.map((soru, index) => (
                      <tr key={soru.id}>
                        <td>
                          <div>
                            <strong>Soru {index + 1}:</strong>
                            <br />
                            <small className="text-muted">
                              {soru.soru.length > 100
                                ? soru.soru.substring(0, 100) + "..."
                                : soru.soru}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {soru.secenekler.map((secenek, secenekIndex) => (
                              <small
                                key={secenekIndex}
                                className={`p-1 rounded ${
                                  secenekIndex === soru.dogruSecenek
                                    ? "bg-success text-white"
                                    : "bg-light"
                                }`}
                              >
                                {String.fromCharCode(65 + secenekIndex)}.{" "}
                                {secenek.length > 30
                                  ? secenek.substring(0, 30) + "..."
                                  : secenek}
                              </small>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-success">
                            {String.fromCharCode(65 + soru.dogruSecenek)}
                          </span>
                          <br />
                          <small className="text-muted">
                            {soru.cevap.length > 30
                              ? soru.cevap.substring(0, 30) + "..."
                              : soru.cevap}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`badge ${getZorlukBadgeClass(
                              soru.zorluk
                            )}`}
                          >
                            {getZorlukText(soru.zorluk)}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">{soru.konu}</span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              title="Görüntüle"
                              onClick={() => handleViewSoru(soru)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-warning btn-sm"
                              title="Düzenle"
                              onClick={() => handleEditSoru(soru)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Sil"
                              onClick={() => handleDeleteSoru(soru)}
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

            {denemeData && denemeData.sorular.length > 0 && (
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
                          <strong>Toplam Soru:</strong> {denemeData.totalCount}
                          <br />
                          <strong>Zorluk Dağılımı:</strong>
                          <br />• Kolay:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "kolay"
                            ).length
                          }
                          <br />• Orta:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "orta"
                            ).length
                          }
                          <br />• Zor:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "zor"
                            ).length
                          }
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
                            Soruları Dışa Aktar
                          </button>
                          <button className="btn btn-outline-secondary btn-sm">
                            <i className="bi bi-upload me-2"></i>
                            Soru İçe Aktar
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

      {/* Yeni Soru Ekleme Modal */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={closeModals}
        title="Yeni Soru Ekle"
        size="lg"
      >
        <div className="p-3">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Soru Metni */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Soru Metni: <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={newSoruForm.soru}
                onChange={(e) =>
                  setNewSoruForm({ ...newSoruForm, soru: e.target.value })
                }
                placeholder="Soruyu buraya yazın..."
                required
              />
            </div>

            {/* Seçenekler */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Seçenekler: <span className="text-danger">*</span>
              </label>
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                En az 2 seçenek doldurulmalıdır. Doğru cevabı işaretleyin.
              </div>
              {newSoruForm.secenekler.map((secenek, index) => (
                <div key={index} className="input-group mb-2">
                  <span className="input-group-text">
                    <input
                      type="radio"
                      name="dogruSecenek"
                      checked={newSoruForm.dogruSecenek === index}
                      onChange={() =>
                        setNewSoruForm({ ...newSoruForm, dogruSecenek: index })
                      }
                      className="form-check-input me-2"
                    />
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    value={secenek}
                    onChange={(e) => {
                      const newSecenekler = [...newSoruForm.secenekler];
                      newSecenekler[index] = e.target.value;
                      setNewSoruForm({
                        ...newSoruForm,
                        secenekler: newSecenekler,
                      });
                    }}
                    placeholder={`${String.fromCharCode(
                      65 + index
                    )} seçeneği...`}
                  />
                </div>
              ))}
            </div>

            {/* Cevap Açıklaması */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Cevap Açıklaması: <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={newSoruForm.cevap}
                onChange={(e) =>
                  setNewSoruForm({ ...newSoruForm, cevap: e.target.value })
                }
                placeholder="Doğru cevabın açıklamasını yazın..."
                required
              />
            </div>

            {/* Zorluk ve Konu */}
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Zorluk:</label>
                  <select
                    className="form-select"
                    value={newSoruForm.zorluk}
                    onChange={(e) =>
                      setNewSoruForm({ ...newSoruForm, zorluk: e.target.value })
                    }
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Konu: <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newSoruForm.konu}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                  <div className="form-text">
                    <i className="bi bi-info-circle me-1"></i>
                    Konu deneme türüne göre otomatik belirlenir.
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Açıklama (Opsiyonel):
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={newSoruForm.aciklama}
                onChange={(e) =>
                  setNewSoruForm({ ...newSoruForm, aciklama: e.target.value })
                }
                placeholder="Soru hakkında ek bilgi varsa yazın..."
              />
            </div>

            {/* Butonlar */}
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModals}
              >
                <i className="bi bi-x-circle me-1"></i>
                İptal
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={addNewSoru}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-1"></i>
                {loading ? "Ekleniyor..." : "Soru Ekle"}
              </button>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* Soru Görüntüleme Modal */}
      <CustomModal
        isOpen={isViewModalOpen}
        onClose={closeModals}
        title="Soru Detayları"
        size="lg"
      >
        {selectedSoru && (
          <div className="p-3">
            <div className="mb-3">
              <h6 className="fw-bold">Soru:</h6>
              <p className="border p-3 rounded bg-light">{selectedSoru.soru}</p>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold">Seçenekler:</h6>
              {selectedSoru.secenekler.map((secenek, index) => (
                <div
                  key={index}
                  className={`p-2 mb-2 rounded ${
                    index === selectedSoru.dogruSecenek
                      ? "bg-success text-white"
                      : "bg-light"
                  }`}
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong> {secenek}
                </div>
              ))}
            </div>

            <div className="mb-3">
              <h6 className="fw-bold">Doğru Cevap:</h6>
              <span className="badge bg-success fs-6">
                {String.fromCharCode(65 + selectedSoru.dogruSecenek)}
              </span>
              <p className="mt-2">{selectedSoru.cevap}</p>
            </div>

            <div className="row">
              <div className="col-md-6">
                <h6 className="fw-bold">Zorluk:</h6>
                <span
                  className={`badge ${getZorlukBadgeClass(
                    selectedSoru.zorluk
                  )}`}
                >
                  {getZorlukText(selectedSoru.zorluk)}
                </span>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold">Konu:</h6>
                <span className="badge bg-info">{selectedSoru.konu}</span>
              </div>
            </div>

            {selectedSoru.aciklama && (
              <div className="mt-3">
                <h6 className="fw-bold">Açıklama:</h6>
                <p className="border p-3 rounded bg-light">
                  {selectedSoru.aciklama}
                </p>
              </div>
            )}
          </div>
        )}
      </CustomModal>

      {/* Soru Düzenleme Modal */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        title="Soru Düzenle"
        size="lg"
      >
        <div className="p-3">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Soru Metni */}
            <div className="mb-3">
              <label className="form-label fw-bold">Soru Metni:</label>
              <textarea
                className="form-control"
                rows={4}
                value={editForm.soru}
                onChange={(e) =>
                  setEditForm({ ...editForm, soru: e.target.value })
                }
                required
              />
            </div>

            {/* Seçenekler */}
            <div className="mb-3">
              <label className="form-label fw-bold">Seçenekler:</label>
              {editForm.secenekler.map((secenek, index) => (
                <div key={index} className="input-group mb-2">
                  <span className="input-group-text">
                    <input
                      type="radio"
                      name="dogruSecenek"
                      checked={editForm.dogruSecenek === index}
                      onChange={() =>
                        setEditForm({ ...editForm, dogruSecenek: index })
                      }
                      className="form-check-input me-2"
                    />
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    value={secenek}
                    onChange={(e) => {
                      const newSecenekler = [...editForm.secenekler];
                      newSecenekler[index] = e.target.value;
                      setEditForm({ ...editForm, secenekler: newSecenekler });
                    }}
                    required
                  />
                </div>
              ))}
            </div>

            {/* Cevap Açıklaması */}
            <div className="mb-3">
              <label className="form-label fw-bold">Cevap Açıklaması:</label>
              <textarea
                className="form-control"
                rows={3}
                value={editForm.cevap}
                onChange={(e) =>
                  setEditForm({ ...editForm, cevap: e.target.value })
                }
                required
              />
            </div>

            {/* Zorluk ve Konu */}
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Zorluk:</label>
                  <select
                    className="form-select"
                    value={editForm.zorluk}
                    onChange={(e) =>
                      setEditForm({ ...editForm, zorluk: e.target.value })
                    }
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Konu:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.konu}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                  <div className="form-text">
                    <i className="bi bi-info-circle me-1"></i>
                    Konu deneme türüne göre otomatik belirlenir.
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Açıklama (Opsiyonel):
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={editForm.aciklama}
                onChange={(e) =>
                  setEditForm({ ...editForm, aciklama: e.target.value })
                }
              />
            </div>

            {/* Butonlar */}
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModals}
              >
                <i className="bi bi-x-circle me-1"></i>
                İptal
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={updateSoru}
                disabled={loading}
              >
                <i className="bi bi-check-circle me-1"></i>
                {loading ? "Güncelleniyor..." : "Güncelle"}
              </button>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* Soru Silme Onay Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={deleteSoru}
        title="Soru Sil"
        message={`"${selectedSoru?.soru.substring(
          0,
          50
        )}..." sorusunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`}
        confirmText="Sil"
        cancelText="İptal"
        confirmVariant="danger"
        icon="bi-trash"
      />
    </AdminGuard>
  );
}
