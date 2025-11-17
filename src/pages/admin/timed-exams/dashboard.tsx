"use client";
import { useState, useEffect } from "react";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  TimedExamListItem,
  RealTimeExamMonitoring,
  TimedExamStats,
} from "@/types/timedExam";

export default function TimedExamDashboard() {
  const [exams, setExams] = useState<TimedExamListItem[]>([]);
  const [stats, setStats] = useState<TimedExamStats | null>(null);
  const [monitoringData, setMonitoringData] = useState<
    RealTimeExamMonitoring[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string>("");

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/admin/timed-exams/list");
      const result = await response.json();

      if (result.success) {
        setExams(result.data);
        // Aktif sınavları otomatik seç
        const activeExams = result.data.filter((exam: TimedExamListItem) => {
          const now = new Date();
          const startDate = new Date(exam.startDate);
          const endDate = new Date(exam.endDate);
          return now >= startDate && now <= endDate;
        });

        if (activeExams.length > 0 && !selectedExam) {
          setSelectedExam(activeExams[0].id);
        }
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

  const fetchMonitoringData = async (examId: string) => {
    try {
      const response = await fetch(
        `/api/admin/timed-exams/${examId}/rankings?realtime=true`
      );
      const result = await response.json();

      if (result.success) {
        setMonitoringData([result.data]);
      }
    } catch (error) {
      console.error("Monitoring verisi alınırken hata:", error);
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

  useEffect(() => {
    if (selectedExam) {
      fetchMonitoringData(selectedExam);
      // Her 30 saniyede bir monitoring verisini güncelle
      const interval = setInterval(() => {
        fetchMonitoringData(selectedExam);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedExam]);

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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString("tr-TR");
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
          <LoadingSpinner />
        </div>
      </AdminGuard>
    );
  }

  const activeExams = exams.filter((exam) => getExamStatus(exam) === "active");
  const currentMonitoring = monitoringData[0];

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        <div className="container py-4">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="mb-0">Zamanlı Sınav Dashboard</h2>
                  <p className="text-muted mb-0">
                    Gerçek zamanlı sınav izleme ve istatistikler
                  </p>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bi bi-circle-fill text-success me-2"></i>
                  <small className="text-muted">Gerçek Zamanlı</small>
                </div>
              </div>

              {/* Genel İstatistikler */}
              {stats && (
                <div className="row mb-4">
                  <div className="col-md-3">
                    <div className="card text-center border-primary">
                      <div className="card-body">
                        <h3 className="card-title text-primary">
                          {stats.totalExams}
                        </h3>
                        <p className="card-text">Toplam Sınav</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center border-success">
                      <div className="card-body">
                        <h3 className="card-title text-success">
                          {stats.activeExams}
                        </h3>
                        <p className="card-text">Aktif Sınav</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center border-info">
                      <div className="card-body">
                        <h3 className="card-title text-info">
                          {stats.totalParticipants}
                        </h3>
                        <p className="card-text">Toplam Katılımcı</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center border-warning">
                      <div className="card-body">
                        <h3 className="card-title text-warning">
                          {stats.averageScore}
                        </h3>
                        <p className="card-text">Ortalama Puan</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aktif Sınav Seçimi */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Aktif Sınav İzleme</h5>
                    </div>
                    <div className="card-body">
                      {activeExams.length === 0 ? (
                        <div className="text-center py-4">
                          <i className="bi bi-clock-history display-4 text-muted"></i>
                          <h5 className="mt-3">
                            Şu anda aktif sınav bulunmuyor
                          </h5>
                          <p className="text-muted">
                            Aktif sınavlar burada görüntülenecek.
                          </p>
                        </div>
                      ) : (
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label">
                              İzlenecek Sınav:
                            </label>
                            <select
                              className="form-select"
                              value={selectedExam}
                              onChange={(e) => setSelectedExam(e.target.value)}
                            >
                              {activeExams.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                  {exam.title} - {exam.totalParticipants}{" "}
                                  katılımcı
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gerçek Zamanlı Monitoring */}
              {currentMonitoring && (
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="card border-success">
                      <div className="card-body text-center">
                        <h4 className="card-title text-success">
                          {currentMonitoring.currentParticipants}
                        </h4>
                        <p className="card-text">Aktif Katılımcı</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-info">
                      <div className="card-body text-center">
                        <h4 className="card-title text-info">
                          {currentMonitoring.averageProgress.toFixed(1)}%
                        </h4>
                        <p className="card-text">Ortalama İlerleme</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-warning">
                      <div className="card-body text-center">
                        <h4 className="card-title text-warning">
                          {currentMonitoring.recentSubmissions.length}
                        </h4>
                        <p className="card-text">Son Gönderimler</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sınav Detayları ve Sıralama */}
              {currentMonitoring && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">Sınav Bilgileri</h5>
                      </div>
                      <div className="card-body">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td>
                                <strong>Sınav:</strong>
                              </td>
                              <td>{currentMonitoring.examTitle}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Durum:</strong>
                              </td>
                              <td>
                                {getStatusBadge(currentMonitoring.examStatus)}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Toplam Katılımcı:</strong>
                              </td>
                              <td>{currentMonitoring.totalParticipants}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Aktif Katılımcı:</strong>
                              </td>
                              <td>{currentMonitoring.currentParticipants}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Ortalama İlerleme:</strong>
                              </td>
                              <td>
                                {currentMonitoring.averageProgress.toFixed(1)}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">Son Sonuçlar</h5>
                      </div>
                      <div className="card-body">
                        {currentMonitoring.recentSubmissions.length === 0 ? (
                          <p className="text-muted text-center py-3">
                            Henüz sonuç bulunmuyor
                          </p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Email</th>
                                  <th>Puan</th>
                                  <th>Süre</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentMonitoring.recentSubmissions
                                  .slice(0, 5)
                                  .map((submission, index) => (
                                    <tr key={index}>
                                      <td>
                                        <small>{submission.userEmail}</small>
                                      </td>
                                      <td>
                                        <span
                                          className={`badge ${
                                            submission.score >= 80
                                              ? "bg-success"
                                              : submission.score >= 60
                                              ? "bg-warning"
                                              : "bg-danger"
                                          }`}
                                        >
                                          {submission.score}
                                        </span>
                                      </td>
                                      <td>
                                        <small>
                                          {formatTime(
                                            submission.completionTime
                                          )}
                                        </small>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tüm Sınavlar Listesi */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Tüm Sınavlar</h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Sınav Başlığı</th>
                              <th>Durum</th>
                              <th>Başlangıç</th>
                              <th>Bitiş</th>
                              <th>Katılımcı</th>
                              <th>Ortalama Puan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exams.map((exam) => {
                              const status = getExamStatus(exam);
                              return (
                                <tr
                                  key={exam.id}
                                  className={
                                    status === "active" ? "table-success" : ""
                                  }
                                >
                                  <td>
                                    <strong>{exam.title}</strong>
                                    {status === "active" && (
                                      <i className="bi bi-broadcast ms-2 text-success"></i>
                                    )}
                                  </td>
                                  <td>{getStatusBadge(status)}</td>
                                  <td>{formatTime(exam.startDate)}</td>
                                  <td>{formatTime(exam.endDate)}</td>
                                  <td>{exam.totalParticipants}</td>
                                  <td>{exam.averageScore.toFixed(1)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer variant="admin" />
      </div>
    </AdminGuard>
  );
}
