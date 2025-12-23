import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ExcelImportModal from "@/components/ExcelImportModal";
import { studyProgramsService } from "@/services/admin/studyProgramsService";

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
  const [showExcelModal, setShowExcelModal] = useState(false);

  const handleExcelExport = () => {
    try {
      const exportData: any[] = [];
      
      // Sort days alphabetically or logically effectively
      const sortedKeys = Object.keys(days).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      
      sortedKeys.forEach(dayKey => {
        const tasks = days[dayKey];
        tasks.forEach(task => {
          exportData.push({
            "Gün": dayKey,
            "Başlık": task.title,
            "Süre": task.duration
          });
        });
        if (tasks.length === 0) {
             exportData.push({
            "Gün": dayKey,
            "Başlık": "",
            "Süre": ""
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Program");
      XLSX.writeFile(workbook, `ders-programi-${programId}.xlsx`);
      toast.success("Excel dosyası indirildi");
    } catch (error) {
      console.error("Export hatası:", error);
      toast.error("Dışa aktarma başarısız oldu");
    }
  };

  const handleExcelImport = async (file: File) => {
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        toast.error("Excel dosyasında sayfa bulunamadı");
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });

      const newDays: StudyProgramDays = { ...days };

      rows.forEach((row) => {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim().toLowerCase()] = row[key];
        });
        
        const dayKeyRaw = normalized["gün"] || normalized["day"] || normalized["gun"] || "";
        const titleRaw = normalized["başlık"] || normalized["baslik"] || normalized["title"] || "";
        const durationRaw = normalized["süre"] || normalized["sure"] || normalized["duration"] || "";
        
        const dayKey = String(dayKeyRaw).trim();
        const title = String(titleRaw).trim();
        const duration = String(durationRaw).trim();
        
        if (!dayKey) return;
        
        if (!newDays[dayKey]) {
            newDays[dayKey] = [];
        }
        
        if (title || duration) {
            newDays[dayKey].push({ title, duration });
        }
      });

      setDays(newDays);
      toast.success("Program verileri içe aktarıldı. Kaydetmeyi unutmayın.");
    } catch (err) {
      console.error("Excel import hatası:", err);
      toast.error("Dosya okunamadı");
    }
  };

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

      const response = await studyProgramsService.getById(id);

      if (response.success) {
        setDays(response.data.days || {});
      } else {
        setError("Program yüklenemedi");
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
      
      const response = await studyProgramsService.update(programId, { days });

      if (response.success) {
        toast.success("Program başarıyla kaydedildi");
        await fetchProgram(programId);
      } else {
        toast.error(response.message || "Program kaydedilemedi");
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
              className="btn btn-outline-success"
              onClick={handleExcelExport}
            >
              <i className="bi bi-file-earmark-excel me-2"></i>
              Excel Dışa Aktar
            </button>
            <button
              className="btn btn-outline-info"
              onClick={() => setShowExcelModal(true)}
            >
              <i className="bi bi-file-earmark-spreadsheet me-2"></i>
              Excel İçe Aktar
            </button>
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
            Bu programda henüz gün bulunmuyor. "Yeni Gün Ekle" ile başlayın veya Excel'den aktarın.
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

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onFileSelect={handleExcelImport}
        title="Ders Programı İçe Aktar"
        description="Excel dosyasında 'Gün', 'Başlık' ve 'Süre' sütunları bulunmalıdır."
        columns={[
          { name: "Gün", required: true, description: "Örn: gun1, pazartesi" },
          { name: "Başlık", required: false, description: "Ders veya aktivite başlığı" },
          { name: "Süre", required: false, description: "Örn: 30 dk" },
        ]}
        exampleData={[
          { Gün: "gun1", Başlık: "Matematik - Çarpanlar", Süre: "40 dk" },
          { Gün: "gun1", Başlık: "Türkçe - Paragraf", Süre: "30 soru" },
          { Gün: "gun2", Başlık: "Tarih - Osmanlı", Süre: "50 dk" },
        ]}
      />

      {/* Add Day Modal ... (rest of modals) */}
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
                  <br />
                  <small className="form-text text-muted">
                    <strong>"Programı Kaydet" butonuna basmayı unutmayın.</strong>
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
                <small className="form-text text-muted">
                  <strong>Ekleme sonunda "Programı Kaydet" butonuna basmayı unutmayın.</strong>
                </small>
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

