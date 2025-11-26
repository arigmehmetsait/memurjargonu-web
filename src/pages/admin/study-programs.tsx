import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getValidToken } from "@/utils/tokenCache";
import { toast } from "react-toastify";

interface StudyProgramSummary {
  id: string;
  name: string;
  dayCount: number;
  activityCount: number;
  updatedAt?: { seconds: number; nanoseconds: number } | null;
}

export default function AdminStudyProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<StudyProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramId, setNewProgramId] = useState("");
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] =
    useState<StudyProgramSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      const idToken = await getValidToken();

      const response = await fetch("/api/admin/study-programs/list", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPrograms(data.data);
      } else {
        setError(data.error || "Programlar yüklenemedi");
      }
    } catch (err) {
      console.error("Programlar yüklenirken hata:", err);
      setError(
        "Programlar yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!newProgramId.trim()) {
      toast.warn("Program ID gereklidir");
      return;
    }

    try {
      setCreating(true);
      const idToken = await getValidToken();
      const response = await fetch("/api/admin/study-programs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          programId: newProgramId.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Program başarıyla oluşturuldu");
        setShowCreateModal(false);
        setNewProgramId("");
        await fetchPrograms();
      } else {
        toast.error(data.error || "Program oluşturulamadı");
      }
    } catch (err) {
      console.error("Program oluşturma hatası:", err);
      toast.error("Program oluşturulurken bir hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (program: StudyProgramSummary) => {
    setProgramToDelete(program);
    setShowDeleteModal(true);
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;

    try {
      setDeleting(true);
      const idToken = await getValidToken();
      const response = await fetch(
        `/api/admin/study-programs/${encodeURIComponent(programToDelete.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Program başarıyla silindi");
        setShowDeleteModal(false);
        setProgramToDelete(null);
        await fetchPrograms();
      } else {
        toast.error(data.error || "Program silinemedi");
      }
    } catch (err) {
      console.error("Program silme hatası:", err);
      toast.error("Program silinirken bir hata oluştu");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditProgram = (programId: string) => {
    router.push(`/admin/study-programs/${encodeURIComponent(programId)}`);
  };

  const formatTimestamp = (ts?: any) => {
    if (!ts) return "-";
    const seconds = ts.seconds ?? ts._seconds;
    if (!seconds) return "-";
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <AdminGuard>
      <Head>
        <title>Ders Programları - Admin Panel</title>
        <meta
          name="description"
          content="KPSS çalışma programlarını yönetin"
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
                  <i className="bi bi-calendar-week me-2"></i>
                  Ders Programları
                </h1>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Yeni Program Ekle
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
                  onClick={fetchPrograms}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-calendar4-event display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">Henüz program bulunmuyor</h3>
                <p className="text-muted">
                  Sistemde henüz hiç ders programı eklenmemiş.
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Programı Ekle
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Program ID</th>
                      <th>Gün Sayısı</th>
                      <th>Aktivite Sayısı</th>
                      <th>Son Güncelleme</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map((program) => (
                      <tr key={program.id}>
                        <td>
                          <strong>{program.name}</strong>
                        </td>
                        <td>
                          <span className="badge bg-primary">
                            {program.dayCount} Gün
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {program.activityCount} Aktivite
                          </span>
                        </td>
                        <td>{formatTimestamp(program.updatedAt)}</td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => handleEditProgram(program.id)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteClick(program)}
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
          </div>
        </div>
      </main>

      {/* Create Modal */}
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
                  Yeni Program Oluştur
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="programId" className="form-label">
                    Program ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="programId"
                    value={newProgramId}
                    onChange={(e) => setNewProgramId(e.target.value)}
                    placeholder="Örn: kpss30, ags120"
                    disabled={creating}
                  />
                  <small className="form-text text-muted">
                    Küçük harf ve boşluksuz olacak şekilde benzersiz bir ID
                    girin.
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
                  onClick={handleCreateProgram}
                  disabled={creating || !newProgramId.trim()}
                >
                  {creating ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
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

      {/* Delete Modal */}
      {showDeleteModal && programToDelete && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Programı Sil
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProgramToDelete(null);
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>"{programToDelete.name}"</strong> programını silmek
                  istediğinizden emin misiniz?
                </p>
                <div className="alert alert-warning mb-0">
                  Bu işlem programdaki tüm gün ve aktiviteleri silecektir.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProgramToDelete(null);
                  }}
                  disabled={deleting}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteProgram}
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

