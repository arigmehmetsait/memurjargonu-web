"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/ConfirmModal";
import ExcelImportModal from "@/components/ExcelImportModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as XLSX from "xlsx";
import { getValidToken } from "@/utils/tokenCache";

export interface Question {
  answer: string;
  options: string[];
  questionText?: string;
}

interface QuestionsManagementProps {
  pdfId: string;
  pdfTitle?: string;
  apiBasePath: string; // Örn: "/api/admin/pdf-files" veya "/api/admin/content/pdfs"
  apiTitlePath?: string; // PDF başlığını almak için alternatif endpoint
  subcategory?: string; // PDF subcategory (sadece content/pdfs için gerekli)
  onBack?: () => void;
}

export default function QuestionsManagement({
  pdfId,
  pdfTitle: initialPdfTitle,
  apiBasePath,
  apiTitlePath,
  subcategory,
  onBack,
}: QuestionsManagementProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState(initialPdfTitle || "");
  const [questions, setQuestions] = useState<Record<string, Question>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    questionKey: "",
    questionText: "",
    answer: "",
    options: ["", "", "", ""],
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);

  useEffect(() => {
    if (pdfId) {
      if (!initialPdfTitle && apiTitlePath) {
        fetchPDFTitle();
      }
      fetchQuestions();
    }
  }, [pdfId, apiBasePath, apiTitlePath, initialPdfTitle]);

  const fetchPDFTitle = async () => {
    if (!apiTitlePath) return;

    try {
      const token = await getValidToken();
      const response = await fetch(`${apiTitlePath}/${pdfId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data?.title) {
        setPdfTitle(data.data.title);
      }
    } catch (err) {
      console.error("PDF başlığı yüklenirken hata:", err);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getValidToken();
      const subcategoryParam = subcategory ? `?subcategory=${subcategory}` : "";
      const url = `${apiBasePath}/${pdfId}/questions${subcategoryParam}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(data.data || {});
      } else {
        setError(data.error || "Sorular yüklenemedi");
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

  const getNextQuestionKey = () => {
    const questionKeys = Object.keys(questions);
    if (questionKeys.length === 0) {
      return "soru1";
    }

    // Mevcut soru anahtarlarından sayıları çıkar ve en büyüğünü bul
    const numbers = questionKeys
      .map((key) => {
        const match = key.match(/^soru(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `soru${maxNumber + 1}`;
  };

  const handleOpenModal = (mode: "add" | "edit", questionKey?: string) => {
    setModalMode(mode);
    setShowModal(true);

    if (mode === "edit" && questionKey && questions[questionKey]) {
      setEditingKey(questionKey);
      const question = questions[questionKey];
      setFormData({
        questionKey,
        questionText: question.questionText || "",
        answer: question.answer || "",
        options: [...question.options, "", "", "", ""].slice(0, 4),
      });
    } else {
      setEditingKey(null);
      const nextKey = getNextQuestionKey();
      setFormData({
        questionKey: nextKey,
        questionText: "",
        answer: "",
        options: ["", "", "", ""],
      });
    }
  };

  const handleSaveQuestion = async () => {
    const validOptions = formData.options
      .map((opt) => opt.trim())
      .filter(Boolean);

    if (validOptions.length < 2) {
      toast.warn("En az iki seçenek gereklidir");
      return;
    }

    try {
      setSaving(true);
      const token = await getValidToken();

      const subcategoryParam = subcategory ? `?subcategory=${subcategory}` : "";
      const url = `${apiBasePath}/${pdfId}/questions${subcategoryParam}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      // Add modunda otomatik questionKey oluştur
      const questionKey =
        modalMode === "add"
          ? getNextQuestionKey()
          : formData.questionKey.trim();

      const body =
        modalMode === "add"
          ? {
              questionKey: questionKey,
              questionText: formData.questionText.trim(),
              answer: formData.answer.trim(),
              options: validOptions,
            }
          : {
              updateQuestionKey: editingKey || formData.questionKey.trim(),
              questionText: formData.questionText.trim(),
              updateAnswer: formData.answer.trim(),
              updateOptions: validOptions,
            };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          modalMode === "add" ? "Soru eklendi" : "Soru güncellendi"
        );
        setShowModal(false);
        fetchQuestions();
      } else {
        toast.error(data.error || "Soru kaydedilemedi");
      }
    } catch (err) {
      console.error("Soru kaydetme hatası:", err);
      toast.error("Soru kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (questionKey: string) => {
    setQuestionToDelete(questionKey);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;

    try {
      const token = await getValidToken();
      const subcategoryParam = subcategory ? `?subcategory=${subcategory}` : "";
      const response = await fetch(
        `${apiBasePath}/${pdfId}/questions${subcategoryParam}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deleteQuestionKey: questionToDelete }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Soru silindi");
        fetchQuestions();
      } else {
        toast.error(data.error || "Soru silinemedi");
      }
    } catch (err) {
      console.error("Soru silme hatası:", err);
      toast.error("Soru silinirken bir hata oluştu");
    } finally {
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  const handleExcelExport = () => {
    const questionKeys = Object.keys(questions);
    const hasQuestions = questionKeys.length > 0;

    // Import schema'ya uygun export - questionKey, questionText, answer, option1, option2, option3, option4
    const exportRows = hasQuestions
      ? questionKeys.map((key) => {
          const question = questions[key];
          return {
            questionKey: key,
            questionText: question.questionText || "",
            answer: question.answer || "",
            option1: question.options[0] || "",
            option2: question.options[1] || "",
            option3: question.options[2] || "",
            option4: question.options[3] || "",
          };
        })
      : [
          {
            questionKey: "",
            questionText: "",
            answer: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
          },
        ];

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sorular");

    const fileName = `${
      pdfTitle?.replace(/[<>:"/\\|?*]+/g, "-") || "sorular"
    }-${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    toast.success(
      hasQuestions
        ? "Sorular Excel olarak indirildi."
        : "Boş şablon Excel olarak indirildi."
    );
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

      const imported: Array<{
        key: string;
        questionText: string;
        answer: string;
        options: string[];
      }> = [];

      // Mevcut soru anahtarlarını al
      const existingKeys = new Set(Object.keys(questions));

      // Otomatik questionKey için başlangıç sayısını belirle
      const existingNumbers = Array.from(existingKeys)
        .map((key) => {
          const match = key.match(/^soru(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num) => num > 0);
      let nextAutoNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

      rows.forEach((row, index) => {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim().toLowerCase()] = row[key];
        });

        let questionKey = String(
          normalized["questionkey"] ||
            normalized["key"] ||
            normalized["soru"] ||
            ""
        ).trim();

        // Eğer questionKey yoksa veya boşsa, otomatik oluştur
        if (!questionKey) {
          // Çakışma olmaması için mevcut key'leri kontrol et
          while (existingKeys.has(`soru${nextAutoNumber}`)) {
            nextAutoNumber++;
          }
          questionKey = `soru${nextAutoNumber}`;
          existingKeys.add(questionKey);
          nextAutoNumber++;
        }

        const questionText = String(
          normalized["questiontext"] ||
            normalized["sorutext"] ||
            normalized["sorumetni"] ||
            ""
        ).trim();
        const answer = String(
          normalized["answer"] || normalized["cevap"] || ""
        ).trim();

        const optionKeys = ["option1", "option2", "option3", "option4"];
        const options = optionKeys
          .map((optKey) => normalized[optKey])
          .filter((opt) => opt !== undefined && String(opt).trim() !== "")
          .map((opt) => String(opt).trim());

        if (options.length < 2) {
          return;
        }

        imported.push({
          key: questionKey,
          questionText,
          answer,
          options,
        });
      });

      if (imported.length === 0) {
        toast.warn("Excel dosyasında geçerli soru bulunamadı");
        return;
      }

      // Her soruyu backend'e kaydet
      const token = await getValidToken();
      let successCount = 0;
      let errorCount = 0;

      const subcategoryParam = subcategory ? `?subcategory=${subcategory}` : "";

      for (const question of imported) {
        try {
          const response = await fetch(
            `${apiBasePath}/${pdfId}/questions${subcategoryParam}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                questionKey: question.key,
                questionText: question.questionText,
                answer: question.answer,
                options: question.options,
              }),
            }
          );

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`Soru "${question.key}" kaydedilirken hata:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} soru başarıyla içe aktarıldı`);
        fetchQuestions();
      }

      if (errorCount > 0) {
        toast.warn(`${errorCount} soru kaydedilemedi`);
      }
    } catch (err) {
      console.error("Excel içe aktarım hatası:", err);
      toast.error("Excel dosyası okunamadı");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          {onBack && (
            <button className="btn btn-outline-secondary mb-2" onClick={onBack}>
              <i className="bi bi-arrow-left me-2"></i>
              Geri Dön
            </button>
          )}
          <h1 className="h3 mb-0">
            <i className="bi bi-question-circle me-2"></i>
            Sorular Yönetimi
          </h1>
          <p className="text-muted mb-0">{pdfTitle}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-outline-success"
            onClick={handleExcelExport}
          >
            <i className="bi bi-download me-2"></i>
            Excel'e Aktar
          </button>
          <button
            className="btn btn-outline-info"
            onClick={() => setShowExcelModal(true)}
          >
            <i className="bi bi-file-earmark-spreadsheet me-2"></i>
            Excel'den İçe Aktar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenModal("add")}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Yeni Soru Ekle
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            className="btn btn-outline-danger btn-sm ms-3"
            onClick={fetchQuestions}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Tekrar Dene
          </button>
        </div>
      ) : Object.keys(questions).length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-question-circle display-1 text-muted"></i>
          <h3 className="mt-3 text-muted">Soru bulunamadı</h3>
          <p className="text-muted">
            Yeni soru eklemek için "Yeni Soru Ekle" butonunu kullanın.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {Object.entries(questions).map(([key, question]) => (
            <div key={key} className="col-12 col-lg-6">
              <div className="card h-100 shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-primary">{key}</h5>
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => handleOpenModal("edit", key)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleDeleteClick(key)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {question.questionText && (
                    <div className="mb-3">
                      <strong>Soru Metni:</strong>
                      <p className="mb-0 mt-1">{question.questionText}</p>
                    </div>
                  )}
                  <div className="mb-3">
                    <strong>Doğru Cevap:</strong>
                    <br />
                    <span className="badge bg-success">{question.answer}</span>
                  </div>
                  <div>
                    <strong>Seçenekler:</strong>
                    <ul className="list-group mt-2">
                      {question.options.map((option, idx) => (
                        <li
                          key={idx}
                          className={`list-group-item ${
                            option === question.answer
                              ? "list-group-item-success"
                              : ""
                          }`}
                        >
                          <strong>{String.fromCharCode(65 + idx)}.</strong>{" "}
                          {option}
                          {option === question.answer && (
                            <span className="badge bg-success ms-2">Doğru</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-question-circle me-2"></i>
                  {modalMode === "add" ? "Yeni Soru Ekle" : "Soru Düzenle"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {modalMode === "edit" && (
                  <div className="mb-3">
                    <label className="form-label">
                      Soru Anahtarı <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.questionKey}
                      disabled
                      readOnly
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Soru Metni</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.questionText}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        questionText: e.target.value,
                      }))
                    }
                    placeholder="Soru metnini buraya yazın..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Doğru Cevap</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        answer: e.target.value,
                      }))
                    }
                    placeholder="a"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Seçenekler <span className="text-danger">*</span>
                  </label>
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="input-group mb-2">
                      <span className="input-group-text text-dark">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={option}
                        onChange={(e) => {
                          const newOpts = [...formData.options];
                          newOpts[idx] = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            options: newOpts,
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveQuestion}
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
                  ) : modalMode === "add" ? (
                    "Ekle"
                  ) : (
                    "Kaydet"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuestionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Soru Silme Onayı"
        message={`"${questionToDelete}" anahtarlı soruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        confirmVariant="danger"
        icon="bi-exclamation-triangle"
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onFileSelect={handleExcelImport}
        title="Excel'den Soru İçe Aktar"
        description="PDF sorularını Excel dosyasından toplu olarak içe aktarabilirsiniz."
        columns={[
          {
            name: "questionKey",
            required: false,
            description: "Soru anahtarı (boş bırakılırsa otomatik oluşturulur)",
          },
          {
            name: "questionText",
            required: false,
            description: "Soru metni",
          },
          { name: "answer", required: false },
          { name: "option1", required: true },
          { name: "option2", required: true },
          { name: "option3", required: false },
          { name: "option4", required: false },
        ]}
        exampleData={[
          {
            questionKey: "",
            questionText: "Bu bir örnek soru metnidir.",
            answer: "a",
            option1: "Seçenek A",
            option2: "Seçenek B",
            option3: "Seçenek C",
            option4: "Seçenek D",
          },
          {
            questionKey: "",
            questionText: "Başka bir örnek soru metni.",
            answer: "b",
            option1: "İlk seçenek",
            option2: "İkinci seçenek",
            option3: "Üçüncü seçenek",
            option4: "",
          },
        ]}
      />
    </div>
  );
}
