import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { egitimVideolariService } from "@/services/admin/egitimVideolariService";
import { toast } from "react-toastify";

interface Video {
  id: string;
  title: string;
  description: string;
  instructor: string;
  subject: string;
  videoId: string;
  timestamp?: string;
  fullUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const YOUTUBE_BASE_URL = "https://www.youtube.com/watch?v=";

export default function AdminEgitimVideoDetailPage() {
  const router = useRouter();
  const { docId } = router.query;
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    subject: "",
    videoUrl: "",
  });

  useEffect(() => {
    if (docId && typeof docId === "string") {
      fetchVideos();
    }
  }, [docId]);

  const fetchVideos = async () => {
    if (!docId || typeof docId !== "string") return;

    try {
      setLoading(true);
      setError(null);

      const response = await egitimVideolariService.getVideos(docId);

      if (response.success) {
        setVideos(response.data || []);
      } else {
        setError(response.error || "Videolar yüklenemedi");
      }
    } catch (err) {
      console.error("Videolar yüklenirken hata:", err);
      setError(
        "Videolar yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructor: "",
      subject: "",
      videoUrl: "",
    });
    setEditingVideo(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditClick = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      instructor: video.instructor || "",
      subject: video.subject || "",
      videoUrl: video.fullUrl,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video);
    setShowDeleteModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      toast.warn("Başlık ve video URL gereklidir");
      return;
    }

    try {
      setSaving(true);

      const videoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructor: formData.instructor.trim(),
        subject: formData.subject.trim(),
        videoUrl: formData.videoUrl.trim(),
      };

      let response;
      if (editingVideo) {
        response = await egitimVideolariService.updateVideo(docId as string, editingVideo.id, videoData);
      } else {
        response = await egitimVideolariService.addVideo(docId as string, videoData);
      }

      if (response.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        await fetchVideos();
        toast.success(
          editingVideo
            ? "Video başarıyla güncellendi!"
            : "Video başarıyla eklendi!"
        );
      } else {
        toast.error(response.error || "Video kaydedilemedi");
      }
    } catch (err) {
      console.error("Video kaydetme hatası:", err);
      toast.error("Video kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      setSaving(true);
      const response = await egitimVideolariService.deleteVideo(docId as string, videoToDelete.id);

      if (response.success) {
        setShowDeleteModal(false);
        setVideoToDelete(null);
        await fetchVideos();
        toast.success("Video başarıyla silindi!");
      } else {
        toast.error(response.error || "Video silinemedi");
      }
    } catch (err) {
      console.error("Video silme hatası:", err);
      toast.error("Video silinirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const getYouTubeEmbedUrl = (videoId: string, timestamp?: string) => {
    let url = `https://www.youtube.com/embed/${videoId}`;
    if (timestamp) {
      url += `?start=${timestamp}`;
    }
    return url;
  };

  if (loading) {
    return (
      <AdminGuard>
        <Header variant="admin" />
        <div className="container my-5">
          <div className="text-center py-5">
            <LoadingSpinner />
          </div>
        </div>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <Header variant="admin" />
        <div className="container my-5">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button
              className="btn btn-outline-danger btn-sm ms-3"
              onClick={() => router.back()}
            >
              Geri Dön
            </button>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Head>
        <title>Eğitim Videoları - {docId} - Admin Panel</title>
      </Head>

      <Header variant="admin" />

      <main className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
              <div className="flex-grow-1">
                <button
                  className="btn btn-outline-secondary mb-2 mb-md-0"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                <h1 className="h3 h-md-2 mb-0 mt-2 mt-md-0">
                  <i className="bi bi-play-circle me-2"></i>
                  Eğitim Videoları: <code className="fs-6">{docId}</code>
                </h1>
              </div>
              <button className="btn btn-primary" onClick={handleAddClick}>
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Video Ekle
              </button>
            </div>

            {/* Videos Grid */}
            {videos.length === 0 ? (
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-play-circle display-4 text-muted d-block mb-3"></i>
                  <h5 className="text-muted">Henüz video bulunmuyor.</h5>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={handleAddClick}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    İlk Videoyu Ekle
                  </button>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                {videos.map((video) => (
                  <div key={video.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                        <span className="badge bg-light text-dark">
                          {video.subject || "Genel"}
                        </span>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-light btn-sm"
                            onClick={() => handleEditClick(video)}
                            title="Düzenle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-light btn-sm"
                            onClick={() => handleDeleteClick(video)}
                            title="Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                      <div className="card-body">
                        <h5 className="card-title">{video.title}</h5>
                        {video.description && (
                          <p className="card-text text-muted small">
                            {video.description.length > 100
                              ? `${video.description.substring(0, 100)}...`
                              : video.description}
                          </p>
                        )}
                        {video.instructor && (
                          <p className="card-text">
                            <small className="text-muted">
                              <i className="bi bi-person me-1"></i>
                              {video.instructor}
                            </small>
                          </p>
                        )}
                        <div className="ratio ratio-16x9 mt-3">
                          <iframe
                            src={getYouTubeEmbedUrl(
                              video.videoId,
                              video.timestamp
                            )}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <div className="mt-3">
                          <a
                            href={video.fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-danger w-100"
                          >
                            <i className="bi bi-youtube me-1"></i>
                            YouTube'da Aç
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-play-circle me-2"></i>
                  {editingVideo ? "Video Düzenle" : "Yeni Video Ekle"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Başlık <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Örn: Güncel Bilgiler Konu Anlatımı 2025"
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Açıklama
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Video açıklaması"
                    disabled={saving}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="instructor" className="form-label">
                      Eğitmen
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="instructor"
                      value={formData.instructor}
                      onChange={(e) =>
                        setFormData({ ...formData, instructor: e.target.value })
                      }
                      placeholder="Örn: Burak Hoca"
                      disabled={saving}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="subject" className="form-label">
                      Konu
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="Örn: Güncel Bilgiler 2025"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="videoUrl" className="form-label">
                    YouTube Video URL veya ID{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=0AVVoTNY7Yg&t=1451s veya 0AVVoTNY7Yg&t=1451s"
                    disabled={saving}
                  />
                  <small className="form-text text-muted">
                    Tam YouTube URL'si veya sadece video ID ve timestamp (örn:
                    0AVVoTNY7Yg&t=1451s)
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !formData.title.trim() ||
                    !formData.videoUrl.trim()
                  }
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {editingVideo ? "Güncelleniyor..." : "Ekleniyor..."}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-1"></i>
                      {editingVideo ? "Güncelle" : "Ekle"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && videoToDelete && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Video Silme Onayı
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setVideoToDelete(null);
                  }}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Dikkat!</strong> Bu işlem geri alınamaz.
                </div>
                <p className="text-dark">
                  <strong>"{videoToDelete.title}"</strong> videosunu silmek
                  istediğinizden emin misiniz?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setVideoToDelete(null);
                  }}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={saving}
                >
                  {saving ? (
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
