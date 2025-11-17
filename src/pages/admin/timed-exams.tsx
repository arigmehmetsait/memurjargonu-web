"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmModal from "@/components/ConfirmModal";
import CreateTimedExamModal from "@/components/admin/CreateTimedExamModal";
import { TimedExamListItem, TimedExamStats } from "@/types/timedExam";
import { formatDate } from "@/utils/formatDate";

export default function AdminTimedExams() {
  const router = useRouter();
  const [exams, setExams] = useState<TimedExamListItem[]>([]);
  const [stats, setStats] = useState<TimedExamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<TimedExamListItem | null>(
    null
  );
  const [filter, setFilter] = useState<
    "all" | "active" | "upcoming" | "completed"
  >("all");

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/admin/timed-exams/list");
      const result = await response.json();

      if (result.success) {
        setExams(result.data);
      } else {
        console.error("Sınavlar alınamadı:", result.error);
      }
    } catch (error) {
      console.error("Sınavlar alınırken hata:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/timed-exams/stats");
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("İstatistikler alınırken hata:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchExams(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDeleteExam = async () => {
    if (!selectedExam) return;

    try {
      const response = await fetch(
        `/api/admin/timed-exams/delete?examId=${selectedExam.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        await fetchExams();
        await fetchStats();
        setShowDeleteModal(false);
        setSelectedExam(null);
      } else {
        alert(result.error || "Sınav silinemedi");
      }
    } catch (error) {
      console.error("Sınav silme hatası:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const getExamStatus = (exam: TimedExamListItem) => {
    const now = new Date();
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);

    if (now < startDate) return "upcoming";
    if (now >= startDate && now <= endDate) return "active";
    return "completed";
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      upcoming: "bg-warning text-dark",
      active: "bg-success",
      completed: "bg-secondary",
    };

    const statusText = {
      upcoming: "Yaklaşan",
      active: "Aktif",
      completed: "Tamamlandı",
    };

    return (
      <span
        className={`badge ${
          statusClasses[status as keyof typeof statusClasses]
        }`}
      >
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  const filteredExams = exams.filter((exam) => {
    if (filter === "all") return true;
    return getExamStatus(exam) === filter;
  });

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
          <LoadingSpinner />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        <div className="container py-4">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="mb-0">Zamanlı Sınav Yönetimi</h2>
                  <p className="text-muted mb-0">
                    Sınavları oluşturun, düzenleyin ve yönetin
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Sınav Oluştur
                </button>
              </div>

              {/* İstatistikler */}
              {stats && (
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title text-primary">
                          {stats.totalExams}
                        </h5>
                        <p className="card-text">Toplam Sınav</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title text-success">
                          {stats.activeExams}
                        </h5>
                        <p className="card-text">Aktif Sınav</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title text-info">
                          {stats.totalParticipants}
                        </h5>
                        <p className="card-text">Toplam Katılımcı</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title text-warning">
                          {stats.averageScore}
                        </h5>
                        <p className="card-text">Ortalama Puan</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtreler */}
              <div className="mb-3">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${
                      filter === "all" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => setFilter("all")}
                  >
                    Tümü ({exams.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filter === "active"
                        ? "btn-success"
                        : "btn-outline-success"
                    }`}
                    onClick={() => setFilter("active")}
                  >
                    Aktif (
                    {exams.filter((e) => getExamStatus(e) === "active").length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filter === "upcoming"
                        ? "btn-warning"
                        : "btn-outline-warning"
                    }`}
                    onClick={() => setFilter("upcoming")}
                  >
                    Yaklaşan (
                    {
                      exams.filter((e) => getExamStatus(e) === "upcoming")
                        .length
                    }
                    )
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filter === "completed"
                        ? "btn-secondary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setFilter("completed")}
                  >
                    Tamamlanan (
                    {
                      exams.filter((e) => getExamStatus(e) === "completed")
                        .length
                    }
                    )
                  </button>
                </div>
              </div>

              {/* Sınav Listesi */}
              <div className="card">
                <div className="card-body">
                  {filteredExams.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-clipboard-data display-1 text-muted"></i>
                      <h5 className="mt-3">Henüz sınav bulunmuyor</h5>
                      <p className="text-muted">
                        İlk zamanlı sınavınızı oluşturmak için yukarıdaki butonu
                        kullanın.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Sınav Başlığı</th>
                            <th>Durum</th>
                            <th>Başlangıç</th>
                            <th>Bitiş</th>
                            <th>Süre</th>
                            <th>Katılımcı</th>
                            <th>Ortalama Puan</th>
                            <th>Sorular</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExams.map((exam) => {
                            const status = getExamStatus(exam);
                            return (
                              <tr key={exam.id}>
                                <td>
                                  <strong>{exam.title}</strong>
                                </td>
                                <td>{getStatusBadge(status)}</td>
                                <td>{formatDate(exam.startDate)}</td>
                                <td>{formatDate(exam.endDate)}</td>
                                <td>{exam.duration} dk</td>
                                <td>{exam.totalParticipants}</td>
                                <td>{exam.averageScore.toFixed(1)}</td>
                                <td>{exam.totalQuestions}</td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn btn-outline-primary"
                                      title="Sınav Detayları"
                                    >
                                      <i className="bi bi-eye"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-info"
                                      title="Sıralama"
                                      onClick={() => {
                                        router.push(
                                          `/admin/timed-exams/${exam.id}/rankings`
                                        );
                                      }}
                                    >
                                      <i className="bi bi-trophy"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-danger"
                                      title="Sil"
                                      onClick={() => {
                                        setSelectedExam(exam);
                                        setShowDeleteModal(true);
                                      }}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer variant="admin" />

        {/* Modals */}
        <CreateTimedExamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchExams();
            fetchStats();
          }}
        />

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedExam(null);
          }}
          onConfirm={handleDeleteExam}
          title="Sınavı Sil"
          message={`"${selectedExam?.title}" sınavını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          confirmVariant="danger"
        />
      </div>
    </AdminGuard>
  );
}
