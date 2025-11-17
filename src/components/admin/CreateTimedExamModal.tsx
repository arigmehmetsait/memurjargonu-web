"use client";
import { useState } from "react";
import { CreateTimedExamRequest, TimedExamQuestion } from "@/types/timedExam";

interface CreateTimedExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTimedExamModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTimedExamModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    duration: 60,
    startDate: "",
    endDate: "",
  });
  const [questions, setQuestions] = useState<TimedExamQuestion[]>([
    {
      questionText: "",
      correctAnswer: "",
      options: ["", "", "", "", ""],
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const createRequest: CreateTimedExamRequest = {
        title: formData.title,
        duration: formData.duration,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        questions: questions.filter((q) => q.questionText.trim() !== ""),
      };

      const response = await fetch("/api/admin/timed-exams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createRequest),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        alert(result.error || "Sınav oluşturulamadı");
      }
    } catch (error) {
      console.error("Sınav oluşturma hatası:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      duration: 60,
      startDate: "",
      endDate: "",
    });
    setQuestions([
      {
        questionText: "",
        correctAnswer: "",
        options: ["", "", "", "", ""],
      },
    ]);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        correctAnswer: "",
        options: ["", "", "", "", ""],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (
    index: number,
    field: keyof TimedExamQuestion,
    value: any
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Yeni Zamanlı Sınav Oluştur</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Temel Bilgiler */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label">Sınav Başlığı *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Süre (dakika) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label">Başlangıç Tarihi *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Bitiş Tarihi *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Sorular */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Sorular</h6>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={addQuestion}
                    disabled={loading}
                  >
                    <i className="bi bi-plus"></i> Soru Ekle
                  </button>
                </div>

                {questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <span>Soru {questionIndex + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeQuestion(questionIndex)}
                          disabled={loading}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">Soru Metni *</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={question.questionText}
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "questionText",
                              e.target.value
                            )
                          }
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Seçenekler *</label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="input-group mb-2">
                            <span className="input-group-text">
                              {String.fromCharCode(65 + optionIndex)})
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              value={option}
                              onChange={(e) =>
                                updateOption(
                                  questionIndex,
                                  optionIndex,
                                  e.target.value
                                )
                              }
                              required
                              disabled={loading}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Doğru Cevap *</label>
                        <select
                          className="form-select"
                          value={question.correctAnswer}
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "correctAnswer",
                              e.target.value
                            )
                          }
                          required
                          disabled={loading}
                        >
                          <option value="">Seçenek seçin</option>
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              {String.fromCharCode(65 + optionIndex)}) {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Oluşturuluyor...
                  </>
                ) : (
                  "Sınav Oluştur"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

