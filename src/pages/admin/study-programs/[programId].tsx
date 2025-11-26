import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getValidToken } from "@/utils/tokenCache";
import { toast } from "react-toastify";

interface StudyProgramItem {
  title: string;
  duration: string;
}

type StudyProgramDays = Record<string, StudyProgramItem[]>;

export default function StudyProgramDetailPage() {
  const router = useRouter();
  const { programId } = router.query;

  const [days, setDays] = useState<StudyProgramDays>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDayModal, setShowDayModal] = useState(false);
  const [newDayKey, setNewDayKey] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", duration: "" });
  const [taskModalMode, setTaskModalMode] = useState<"add" | "edit">("add");
  const [taskModalDay, setTaskModalDay] = useState<string>("");
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

  const orderedDayEntries = useMemo(() => {
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
  }, [days]);

  useEffect(() => {
    if (programId && typeof programId === "string") {
      fetchProgram(programId);
    }
  }, [programId]);

  const fetchProgram = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getValidToken();
      const response = await fetch(
        `/api/admin/study-programs/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setDays(data.data?.days || {});
      } else {
        setError(data.error || "Program yüklenemedi");
      }
    } catch (err) {
      console.error("Program yüklenirken hata:", err);
      setError(
        "Program yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddDay = () => {
    if (!newDayKey.trim()) {
      toast.warn("Gün anahtarı gereklidir");
      return;
    }

    const key = newDayKey.trim();
    if (days[key]) {
      toast.warn("Bu gün zaten mevcut");
      return;
    }

    setDays((prev) => ({
      ...prev,
      [key]: [],
    }));
    setShowDayModal(false);
    setNewDayKey("");
  };

  const handleRemoveDay = (dayKey: string) => {
    const updated = { ...days };
    delete updated[dayKey];
    setDays(updated);
  };

  const openTaskModal = (
    mode: "add" | "edit",
    dayKey: string,
    index?: number
  ) => {
    setTaskModalMode(mode);
    setTaskModalDay(dayKey);
    setEditingTaskIndex(index ?? null);
    if (mode === "edit" && index !== undefined) {
      const task = days[dayKey][index];
      setTaskForm({
        title: task?.title || "",
        duration: task?.duration || "",
      });
    } else {
      setTaskForm({ title: "", duration: "" });
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = () => {
    if (!taskForm.title.trim() || !taskForm.duration.trim()) {
      toast.warn("Başlık ve süre gereklidir");
      return;
    }

    setDays((prev) => {
      const dayList = prev[taskModalDay] || [];
      let updatedList: StudyProgramItem[];
      if (taskModalMode === "edit" && editingTaskIndex !== null) {
        updatedList = [...dayList];
        updatedList[editingTaskIndex] = {
          title: taskForm.title.trim(),
          duration: taskForm.duration.trim(),
        };
      } else {
        updatedList = [
          ...dayList,
          {
            title: taskForm.title.trim(),
            duration: taskForm.duration.trim(),
          },
        ];
      }

      return {
        ...prev,
        [taskModalDay]: updatedList,
      };
    });

    setShowTaskModal(false);
    setTaskForm({ title: "", duration: "" });
    setEditingTaskIndex(null);
  };

  const handleDeleteTask = (dayKey: string, index: number) => {
    setDays((prev) => {
      const updated = [...(prev[dayKey] || [])];
      updated.splice(index, 1);
      return {
        ...prev,
        [dayKey]: updated,
      };
    });
  };

  const handleSaveProgram = async () => {
    if (!programId || typeof programId !== "string") return;

    try {
      setSaving(true);
      const token = await getValidToken();
      const response = await fetch(
        `/api/admin/study-programs/${encodeURIComponent(programId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ days }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Program başarıyla kaydedildi");
        await fetchProgram(programId);
      } else {
        toast.error(data.error || "Program kaydedilemedi");
      }
    } catch (err) {
      console.error("Program kaydedilirken hata:", err);
      toast.error("Program kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
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
              onClick={() => programId && fetchProgram(programId as string)}
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Head>
        <title>Ders Programı - {programId} | Admin Panel</title>
      </Head>

      <Header variant="admin" />

      <main className="container-fluid py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <div>
            <button
              className="btn btn-outline-secondary mb-2"
              onClick={() => router.back()}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Geri Dön
            </button>
            <h1 className="h3 mb-0">
              <i className="bi bi-calendar-week me-2"></i>
              Program: <code>{programId}</code>
            </h1>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => setShowDayModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Yeni Gün Ekle
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveProgram}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Programı Kaydet
                </>
              )}
            </button>
          </div>
        </div>

        {orderedDayEntries.length === 0 ? (
          <div className="alert alert-info d-flex align-items-center">
            <i className="bi bi-info-circle me-2"></i>
            Bu programda henüz gün bulunmuyor. "Yeni Gün Ekle" ile başlayın.
          </div>
        ) : (
          <div className="row g-4">
            {orderedDayEntries.map(([dayKey, items]) => (
              <div key={dayKey} className="col-12 col-lg-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0 text-primary text-capitalize">
                        {dayKey}
                      </h5>
                      <small className="text-muted">
                        {items.length} aktivite
                      </small>
                    </div>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-success"
                        onClick={() => openTaskModal("add", dayKey)}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleRemoveDay(dayKey)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {items.length === 0 ? (
                      <div className="text-muted text-center py-3">
                        Bu gün için henüz aktivite eklenmemiş.
                      </div>
                    ) : (
                      <div className="list-group">
                        {items.map((item, index) => (
                          <div
                            key={`${dayKey}-${index}`}
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                          >
                            <div className="me-3">
                              <div className="fw-bold">{item.title}</div>
                              <small className="text-muted">
                                Süre: {item.duration}
                              </small>
                            </div>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  openTaskModal("edit", dayKey, index)
                                }
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteTask(dayKey, index)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Day Modal */}
      {showDayModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Gün Ekle
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDayModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="dayKey" className="form-label">
                    Gün Anahtarı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="dayKey"
                    value={newDayKey}
                    onChange={(e) => setNewDayKey(e.target.value)}
                    placeholder="Örn: gun1, gun2"
                  />
                  <small className="form-text text-muted">
                    Gün anahtarını küçük harf ve boşluksuz girin.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDayModal(false)}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddDay}
                  disabled={!newDayKey.trim()}
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-journal-plus me-2"></i>
                  {taskModalMode === "add"
                    ? `${taskModalDay} için Aktivite Ekle`
                    : `${taskModalDay} Aktivitesini Düzenle`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTaskModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="taskTitle" className="form-label">
                    Başlık <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="taskTitle"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Örn: Paragraf Soruları: 20 soru"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="taskDuration" className="form-label">
                    Süre <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="taskDuration"
                    value={taskForm.duration}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    placeholder="Örn: 30 dk"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveTask}
                >
                  {taskModalMode === "add" ? "Ekle" : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}

