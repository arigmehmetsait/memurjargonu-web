"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getValidToken } from "@/utils/tokenCache";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ExcelImportModal from "@/components/ExcelImportModal";

type DuelloOption = string;

interface DuelloQuestion {
  key: string;
  question: string;
  options: DuelloOption[];
  answer: string;
  index: number;
}

export default function DuelloQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<DuelloQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState({
    key: "",
    question: "",
    answer: "",
    index: 0,
    options: ["", "", "", ""],
  });
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getValidToken();
      const response = await fetch("/api/admin/duello-questions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const parsed = parseQuestions(data.data || {});
        setQuestions(parsed);
      } else {
        setError(data.error || "Sorular yüklenemedi");
      }
    } catch (err) {
      console.error("Duello soruları yüklenirken hata:", err);
      setError(
        "Sorular yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const parseQuestions = (raw: Record<string, any>): DuelloQuestion[] => {
    return Object.entries(raw).map(([key, value]) => {
      const firstEntry =
        value?.[0] ?? value?.["0"] ?? Array.isArray(value) ? value[0] : value;
      const optionsRaw = firstEntry?.options;
      const parsedOptions = Array.isArray(optionsRaw)
        ? optionsRaw
        : typeof optionsRaw === "object"
        ? Object.values(optionsRaw)
        : [];

      return {
        key,
        question: firstEntry?.question || "",
        answer: firstEntry?.answer || "",
        index:
          typeof firstEntry?.index === "number"
            ? firstEntry.index
            : parseInt(firstEntry?.index || "0", 10) || 0,
        options:
          parsedOptions.length > 0
            ? parsedOptions.map((opt) => String(opt))
            : ["", "", "", ""],
      };
    });
  };

  const handleOpenModal = (mode: "add" | "edit", question?: DuelloQuestion) => {
    setModalMode(mode);
    setShowModal(true);

    if (mode === "edit" && question) {
      setEditingKey(question.key);
      setFormData({
        key: question.key,
        question: question.question,
        answer: question.answer,
        index: question.index,
        options: [...question.options, "", "", "", ""].slice(0, 4),
      });
    } else {
      setEditingKey(null);
      setFormData({
        key: "",
        question: "",
        answer: "",
        index: questions.length,
        options: ["", "", "", ""],
      });
    }
  };

  const handleDeleteQuestion = (key: string) => {
    setQuestions((prev) => prev.filter((q) => q.key !== key));
  };

  const handleModalSave = () => {
    if (!formData.key.trim() || !formData.question.trim()) {
      toast.warn("Soru anahtarı ve metni zorunludur");
      return;
    }

    const sanitized: DuelloQuestion = {
      key: formData.key.trim(),
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      index: Number(formData.index) || 0,
      options: formData.options.map((opt) => opt.trim()).filter(Boolean),
    };

    if (sanitized.options.length < 2) {
      toast.warn("En az iki seçenek giriniz");
      return;
    }

    setQuestions((prev) => {
      const others = prev.filter((q) => q.key !== sanitized.key);
      return [...others, sanitized].sort((a, b) => a.key.localeCompare(b.key));
    });

    setShowModal(false);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const token = await getValidToken();
      const payload: Record<string, any> = {};

      questions.forEach((q) => {
        payload[q.key] = {
          0: {
            question: q.question,
            answer: q.answer,
            index: q.index,
            options: q.options,
          },
        };
      });

      const response = await fetch("/api/admin/duello-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questions: payload }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Düello soruları kaydedildi");
      } else {
        toast.error(data.error || "Sorular kaydedilemedi");
      }
    } catch (err) {
      console.error("Duello soruları kaydetme hatası:", err);
      toast.error("Sorular kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) return questions;
    return questions.filter(
      (q) =>
        q.key.toLowerCase().includes(search.toLowerCase()) ||
        q.question.toLowerCase().includes(search.toLowerCase())
    );
  }, [questions, search]);

  const handleExcelButtonClick = () => {
    setShowExcelModal(true);
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

      // Mevcut soruların en yüksek index'ini bul
      const maxIndex =
        questions.length > 0 ? Math.max(...questions.map((q) => q.index)) : -1;
      let autoIndexCounter = maxIndex + 1;

      const imported: DuelloQuestion[] = [];

      rows.forEach((row) => {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim().toLowerCase()] = row[key];
        });

        const key = String(
          normalized["key"] || normalized["id"] || normalized["soru"] || ""
        ).trim();
        const question = String(
          normalized["question"] || normalized["soru"] || ""
        ).trim();
        const answer = String(
          normalized["answer"] || normalized["cevap"] || ""
        ).trim();

        // Index belirtilmişse kullan, yoksa otomatik index ata
        const hasIndex =
          normalized["index"] !== undefined && normalized["index"] !== "";
        let indexValue: number;
        if (hasIndex) {
          const parsed = Number(normalized["index"]);
          indexValue = Number.isNaN(parsed) ? autoIndexCounter++ : parsed;
        } else {
          indexValue = autoIndexCounter++;
        }

        const optionKeys = ["option1", "option2", "option3", "option4"];
        const options = optionKeys
          .map((optKey) => normalized[optKey])
          .filter((opt) => opt !== undefined && String(opt).trim() !== "")
          .map((opt) => String(opt).trim());

        if (!key || !question || options.length < 2) {
          return;
        }

        imported.push({
          key,
          question,
          answer,
          index: indexValue,
          options,
        });
      });

      if (imported.length === 0) {
        toast.warn("Excel dosyasında geçerli soru bulunamadı");
        return;
      }

      // Güncellenmiş soruları hesapla
      const map = new Map<string, DuelloQuestion>();
      questions.forEach((q) => map.set(q.key, q));
      imported.forEach((q) => map.set(q.key, q));
      const finalQuestions = Array.from(map.values()).sort((a, b) =>
        a.key.localeCompare(b.key)
      );

      // State'i güncelle
      setQuestions(finalQuestions);

      toast.success(`${imported.length} soru içe aktarıldı`);

      // Otomatik olarak backend'e kaydet
      const token = await getValidToken();
      const payload: Record<string, any> = {};

      finalQuestions.forEach((q) => {
        payload[q.key] = {
          0: {
            question: q.question,
            answer: q.answer,
            index: q.index,
            options: q.options,
          },
        };
      });

      const response = await fetch("/api/admin/duello-questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questions: payload }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Sorular otomatik olarak kaydedildi");
      } else {
        toast.error(data.error || "Sorular kaydedilemedi");
      }
    } catch (err) {
      console.error("Excel içe aktarım hatası:", err);
      toast.error("Excel dosyası okunamadı");
    }
  };

  return (
    <AdminGuard>
      <Head>
        <title>Düello Soruları - Admin Panel</title>
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
              <i className="bi bi-crosshair me-2"></i>
              Düello Soruları Yönetimi
            </h1>
            <p className="text-muted mb-0">
              Düello oyununda kullanılacak soruları yönetin.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => handleOpenModal("add")}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Yeni Soru
            </button>
            <button
              className="btn btn-outline-info"
              onClick={handleExcelButtonClick}
            >
              <i className="bi bi-file-earmark-spreadsheet me-2"></i>
              Excel'den İçe Aktar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveAll}
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
                  Tümünü Kaydet
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label mb-1">
                  <i className="bi bi-search me-1"></i>
                  Soru Ara
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Anahtar veya soru metni ile ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
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
              onClick={fetchQuestions}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Tekrar Dene
            </button>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-crosshair display-1 text-muted"></i>
            <h3 className="mt-3 text-muted">Soru bulunamadı</h3>
            <p className="text-muted">
              Yeni soru eklemek için "Yeni Soru" butonunu kullanın.
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredQuestions.map((question) => (
              <div key={question.key} className="col-12 col-lg-6">
                <div className="card h-100 shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0 text-primary">{question.key}</h5>
                      <small className="text-muted">
                        Doğru Cevap: {question.answer || "-"}
                      </small>
                    </div>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => handleOpenModal("edit", question)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteQuestion(question.key)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="fw-bold">{question.question}</p>
                    <ul className="list-group">
                      {question.options.map((option, idx) => (
                        <li
                          key={`${question.key}-opt-${idx}`}
                          className={`list-group-item d-flex justify-content-between align-items-center ${
                            option === question.answer
                              ? "list-group-item-success"
                              : ""
                          }`}
                        >
                          <span>
                            <strong>{String.fromCharCode(65 + idx)}.</strong>{" "}
                            {option}
                          </span>
                          {option === question.answer && (
                            <span className="badge bg-success">Doğru</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-crosshair me-2"></i>
                  {modalMode === "add" ? "Yeni Soru Ekle" : "Soru Düzenle"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Soru Anahtarı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, key: e.target.value }))
                    }
                    disabled={modalMode === "edit"}
                    placeholder="soru1"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Soru Metni <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.question}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        question: e.target.value,
                      }))
                    }
                  ></textarea>
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
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Sıra (index)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.index}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        index: Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Seçenekler <span className="text-danger">*</span>
                  </label>
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="input-group mb-2">
                      <span className="input-group-text">
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
                  onClick={handleModalSave}
                >
                  {modalMode === "add" ? "Ekle" : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onFileSelect={handleExcelImport}
        title="Excel'den İçe Aktar"
        description="Düello sorularını Excel dosyasından toplu olarak içe aktarabilirsiniz."
        columns={[
          {
            name: "key",
            required: true,
            description: "Benzersiz soru anahtarı",
          },
          { name: "question", required: true },
          { name: "answer", required: false },
          { name: "index", required: false },
          { name: "option1", required: true },
          { name: "option2", required: true },
          { name: "option3", required: false },
          { name: "option4", required: false },
        ]}
        exampleData={[
          {
            key: "soru1",
            question: "Türkiye'nin başkenti neresidir?",
            answer: "Ankara",
            index: 0,
            option1: "İstanbul",
            option2: "Ankara",
            option3: "İzmir",
            option4: "Bursa",
          },
          {
            key: "soru2",
            question: "Dünyanın en uzun nehri hangisidir?",
            answer: "Nil",
            index: 1,
            option1: "Amazon",
            option2: "Nil",
            option3: "Mississippi",
            option4: "Yangtze",
          },
        ]}
      />
    </AdminGuard>
  );
}
