"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { TimedExamRanking } from "@/types/timedExam";

export default function ExamRankings() {
  const router = useRouter();
  const { examId } = router.query;
  const [rankings, setRankings] = useState<TimedExamRanking[]>([]);
  const [examTitle, setExamTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examId && typeof examId === "string") {
      fetchRankings();
    }
  }, [examId]);

  const fetchRankings = async () => {
    if (!examId || typeof examId !== "string") return;

    try {
      setLoading(true);

      // Sıralama verilerini getir
      const response = await fetch(`/api/admin/timed-exams/${examId}/rankings`);
      const result = await response.json();

      if (result.success) {
        setRankings(result.data);

        // Sınav başlığını almak için sınav listesini getir
        const listResponse = await fetch("/api/admin/timed-exams/list");
        const listResult = await listResponse.json();

        if (listResult.success) {
          const exam = listResult.data.find((e: any) => e.id === examId);
          if (exam) {
            setExamTitle(exam.title);
          }
        }
      } else {
        console.error("Sıralama verileri alınamadı:", result.error);
      }
    } catch (error) {
      console.error("Sıralama verileri alınırken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString("tr-TR");
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-danger";
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

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        <div className="container py-4">
          <div className="row">
            <div className="col-12">
              {/* Başlık ve Geri Dönüş */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <button
                    className="btn btn-outline-secondary mb-2"
                    onClick={() => router.back()}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Geri Dön
                  </button>
                  <h2 className="mb-0">Sınav Sıralaması</h2>
                  <p className="text-muted mb-0">
                    {examTitle || "Sınav başlığı yükleniyor..."}
                  </p>
                </div>
                <div className="text-end">
                  <h5 className="text-muted">
                    Toplam Katılımcı:{" "}
                    <span className="text-primary">{rankings.length}</span>
                  </h5>
                </div>
              </div>

              {/* Sıralama Tablosu */}
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-trophy me-2"></i>
                    Sıralama Listesi
                  </h5>
                </div>
                <div className="card-body">
                  {rankings.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-trophy display-1 text-muted"></i>
                      <h5 className="mt-3">Henüz sonuç bulunmuyor</h5>
                      <p className="text-muted">
                        Bu sınava henüz kimse katılmamış.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th style={{ width: "80px" }}>Sıra</th>
                            <th>Katılımcı</th>
                            <th style={{ width: "120px" }}>Puan</th>
                            <th style={{ width: "120px" }}>Doğru</th>
                            <th style={{ width: "120px" }}>Toplam</th>
                            <th style={{ width: "150px" }}>Başarı Oranı</th>
                            <th style={{ width: "180px" }}>
                              Tamamlanma Zamanı
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((ranking, index) => {
                            const successRate =
                              (ranking.correctAnswers /
                                ranking.totalQuestions) *
                              100;
                            return (
                              <tr key={ranking.userId}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {index === 0 && (
                                      <i className="bi bi-trophy-fill text-warning me-2"></i>
                                    )}
                                    {index === 1 && (
                                      <i className="bi bi-trophy-fill text-secondary me-2"></i>
                                    )}
                                    {index === 2 && (
                                      <i className="bi bi-trophy-fill text-warning me-2"></i>
                                    )}
                                    <strong>{index + 1}</strong>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <strong>{ranking.userEmail}</strong>
                                    {index < 3 && (
                                      <span className="badge bg-primary ms-2">
                                        {index === 0
                                          ? "1."
                                          : index === 1
                                          ? "2."
                                          : "3."}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${getScoreBadge(
                                      ranking.score
                                    )} fs-6`}
                                  >
                                    {ranking.score}
                                  </span>
                                </td>
                                <td>
                                  <span className="text-success fw-bold">
                                    {ranking.correctAnswers}
                                  </span>
                                </td>
                                <td>
                                  <span className="text-muted">
                                    {ranking.totalQuestions}
                                  </span>
                                </td>
                                <td>
                                  <div
                                    className="progress"
                                    style={{ height: "20px" }}
                                  >
                                    <div
                                      className={`progress-bar ${
                                        successRate >= 80
                                          ? "bg-success"
                                          : successRate >= 60
                                          ? "bg-warning"
                                          : "bg-danger"
                                      }`}
                                      style={{ width: `${successRate}%` }}
                                    >
                                      <small className="fw-bold">
                                        {successRate.toFixed(1)}%
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <small className="text-muted">
                                    {formatTime(ranking.completionTime)}
                                  </small>
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

              {/* İstatistikler */}
              {rankings.length > 0 && (
                <div className="row mt-4">
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title text-success">
                          {rankings.reduce(
                            (sum, r) => sum + r.correctAnswers,
                            0
                          )}
                        </h5>
                        <p className="card-text">Toplam Doğru Cevap</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title text-primary">
                          {Math.round(
                            rankings.reduce((sum, r) => sum + r.score, 0) /
                              rankings.length
                          )}
                        </h5>
                        <p className="card-text">Ortalama Puan</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card text-center">
                      <div className="card-body">
                        <h5 className="card-title text-info">
                          {Math.round(
                            (rankings.reduce(
                              (sum, r) =>
                                sum + r.correctAnswers / r.totalQuestions,
                              0
                            ) /
                              rankings.length) *
                              100
                          )}
                          %
                        </h5>
                        <p className="card-text">Ortalama Başarı Oranı</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer variant="admin" />
      </div>
    </AdminGuard>
  );
}
