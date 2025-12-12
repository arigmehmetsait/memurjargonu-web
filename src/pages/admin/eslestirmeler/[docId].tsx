import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getValidToken } from "@/utils/tokenCache";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-toastify";

interface FieldValue {
  [key: string]: any;
}

// Soru tipleri
enum QuestionType {
  BOSLUK_DOLDURMA = 1,
  COKTAN_SECMELI = 2,
  ESLESTIRME = 3,
}

interface QuestionFormData {
  questionText: string;
  correctAnswer: string;
  options: string[];
  incorrectOptions: string[]; // Eşleştirme için yanlış seçenekler
  explanation?: string;
  difficulty?: string;
  levelNumber?: string; // Yeni soru eklerken level numarası
  levelGroup?: string; // Yeni soru eklerken level grubu (örn: level2, level3)
}

// Sortable Item Component
function SortableItem({
  id,
  children,
  handleEdit,
  handleDelete,
  handleToggle,
  isExpanded,
  itemCount,
}: {
  id: string;
  children?: React.ReactNode;
  handleEdit: () => void;
  handleDelete: () => void;
  handleToggle: () => void;
  isExpanded: boolean;
  itemCount: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <div className={`card border shadow-sm ${isDragging ? "border-primary" : ""}`}>
        <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center flex-wrap gap-2 flex-grow-1">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-move me-2 text-muted"
              style={{ cursor: "grab" }}
            >
              <i className="bi bi-grip-vertical fs-5"></i>
            </div>
            
            <button
              className="btn btn-sm btn-link p-0 text-decoration-none"
              onClick={handleToggle}
              style={{ minWidth: "24px" }}
            >
              <i
                className={`bi bi-chevron-${
                  isExpanded ? "down" : "right"
                } fs-5`}
              ></i>
            </button>
            <strong className="text-primary fs-6">{id}</strong>
            <span className="badge bg-secondary">{itemCount} alan</span>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={handleEdit}
            >
              <i className="bi bi-pencil me-1"></i>
              <span className="d-none d-sm-inline">Düzenle</span>
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleDelete}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminEslestirmeEditPage() {
  const router = useRouter();
  const { docId } = router.query;
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelTitle, setNewLevelTitle] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [questionFormData, setQuestionFormData] = useState<QuestionFormData>({
    questionText: "",
    correctAnswer: "",
    options: ["", "", "", ""],
    incorrectOptions: ["", ""],
    explanation: "",
    difficulty: "orta",
    levelNumber: "",
    levelGroup: "level2",
  });
  
  // Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (docId && typeof docId === "string") {
      fetchDocument();
    }
  }, [docId]);

  const fetchDocument = async () => {
    if (!docId || typeof docId !== "string") return;

    try {
      setLoading(true);
      setError(null);

      const idToken = await getValidToken();

      const response = await fetch(
        `/api/admin/eslestirmeler/${encodeURIComponent(docId)}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setDocument(data.data);
      } else {
        setError(data.error || "Doküman yüklenemedi");
      }
    } catch (err) {
      console.error("Doküman yüklenirken hata:", err);
      setError(
        "Doküman yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (fieldPath: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldPath)) {
      newExpanded.delete(fieldPath);
    } else {
      newExpanded.add(fieldPath);
    }
    setExpandedFields(newExpanded);
  };

  const startEditing = (fieldPath: string, currentValue: any) => {
    // Eğer level içinde bir soru düzenleniyorsa ve questionType varsa, özel modal aç
    if (
      fieldPath.includes("level") &&
      currentValue &&
      typeof currentValue === "object"
    ) {
      const qType = currentValue.questionType;
      if (qType && [1, 2, 3].includes(qType)) {
        openQuestionModal(qType, currentValue, fieldPath);
        return;
      }
    }

    // Normal JSON düzenleme
    setEditingField(fieldPath);
    setFieldValue(JSON.stringify(currentValue, null, 2));
    setShowEditModal(true);
  };

  const openQuestionModal = (
    type: QuestionType,
    data: any = null,
    fieldPath: string = ""
  ) => {
    setQuestionType(type);
    setEditingField(fieldPath);

    if (data) {
      // Mevcut veriyi düzenle
      setQuestionFormData({
        questionText: data.soru?.question || data.question || "",
        correctAnswer: data.soru?.correct || data.correctAnswer || "",
        options: data.soru?.options ||
          data.soru?.correct ||
          data.options || ["", "", "", ""],
        incorrectOptions: data.soru?.incorrect || ["", ""],
        explanation: data.aciklama || data.explanation || "",
        difficulty: data.zorluk || data.difficulty || "orta",
        levelNumber: "", // Düzenlemede gerek yok
        levelGroup: "level2",
      });
    } else {
      // Yeni soru ekle
      setQuestionFormData({
        questionText: "",
        correctAnswer: "",
        options: ["", "", "", ""],
        incorrectOptions: ["", ""],
        explanation: "",
        difficulty: "orta",
        levelNumber: "",
        levelGroup: "level2",
      });
    }

    setShowQuestionModal(true);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFieldValue("");
    setShowEditModal(false);
  };

  const cancelQuestionModal = () => {
    setShowQuestionModal(false);
    setQuestionType(null);
    setEditingField(null);
    setQuestionFormData({
      questionText: "",
      correctAnswer: "",
      options: ["", "", "", ""],
      incorrectOptions: ["", ""],
      explanation: "",
      difficulty: "orta",
      levelNumber: "",
      levelGroup: "level2",
    });
  };

  const expandAll = () => {
    const allFields = new Set<string>();
    const collectFields = (obj: any, path: string = "") => {
      Object.keys(obj).forEach((key) => {
        const fieldPath = path ? `${path}.${key}` : key;
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          allFields.add(fieldPath);
          collectFields(obj[key], fieldPath);
        }
      });
    };
    if (document) {
      collectFields(document);
    }
    setExpandedFields(allFields);
  };

  const collapseAll = () => {
    setExpandedFields(new Set());
  };

  const saveField = async (fieldPath: string) => {
    try {
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(fieldValue);
      } catch (e) {
        toast.warn("Geçersiz JSON formatı. Lütfen düzeltin.");
        return;
      }

      setSaving(true);

      const idToken = await getValidToken();

      const response = await fetch(
        `/api/admin/eslestirmeler/${encodeURIComponent(docId as string)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fieldPath,
            value: parsedValue,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setEditingField(null);
        setFieldValue("");
        setShowEditModal(false);
        await fetchDocument();
        toast.success("Alan başarıyla güncellendi!");
      } else {
        toast.error(data.error || "Alan güncellenemedi");
      }
    } catch (err) {
      console.error("Alan güncellenirken hata:", err);
      toast.error("Alan güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const saveQuestionField = async () => {
    // Yeni soru ekleme kontrolü
    const isNewQuestion = !editingField;

    if (isNewQuestion) {
      if (!questionFormData.levelGroup?.trim()) {
        toast.warn("Level grubu zorunludur (örn: level2)");
        return;
      }
      if (!questionFormData.levelNumber?.trim()) {
        toast.warn("Soru numarası zorunludur");
        return;
      }
    }

    // Validasyon
    if (!questionFormData.questionText.trim()) {
      toast.warn("Soru metni zorunludur");
      return;
    }

    const validOptions = questionFormData.options
      .map((opt) => opt.trim())
      .filter(Boolean);

    if (
      questionType === QuestionType.COKTAN_SECMELI &&
      validOptions.length < 2
    ) {
      toast.warn("Çoktan seçmeli sorular için en az 2 seçenek gereklidir");
      return;
    }

    if (
      questionType === QuestionType.BOSLUK_DOLDURMA &&
      validOptions.length < 2
    ) {
      toast.warn("Boşluk doldurma için en az 2 seçenek gereklidir");
      return;
    }

    try {
      setSaving(true);

      // Soru tipine göre veri formatla
      const questionData: any = {
        questionType: questionType,
      };

      if (questionType === QuestionType.BOSLUK_DOLDURMA) {
        questionData.soru = {
          question: questionFormData.questionText.trim(),
          options: validOptions,
          correct: questionFormData.correctAnswer.trim(),
        };
        if (questionFormData.explanation) {
          questionData.aciklama = questionFormData.explanation.trim();
        }
      } else if (questionType === QuestionType.COKTAN_SECMELI) {
        questionData.soru = {
          question: questionFormData.questionText.trim(),
          options: validOptions,
        };
        questionData.correctAnswer = questionFormData.correctAnswer.trim();
        if (questionFormData.explanation) {
          questionData.aciklama = questionFormData.explanation.trim();
        }
      } else if (questionType === QuestionType.ESLESTIRME) {
        // Eşleştirme için özel format
        const validIncorrectOptions = questionFormData.incorrectOptions
          .map((opt) => opt.trim())
          .filter(Boolean);

        questionData.soru = {
          question: questionFormData.questionText.trim(),
          correct: validOptions,
          incorrect: validIncorrectOptions,
        };
        if (questionFormData.explanation) {
          questionData.aciklama = questionFormData.explanation.trim();
        }
      }

      const idToken = await getValidToken();

      // Yeni soru için fieldPath oluştur
      const finalFieldPath = isNewQuestion
        ? `${questionFormData.levelGroup}.${questionFormData.levelNumber}`
        : editingField;

      const response = await fetch(
        `/api/admin/eslestirmeler/${encodeURIComponent(docId as string)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fieldPath: finalFieldPath,
            value: questionData,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        cancelQuestionModal();
        await fetchDocument();
        toast.success(
          isNewQuestion
            ? "Soru başarıyla eklendi!"
            : "Soru başarıyla güncellendi!"
        );
      } else {
        toast.error(data.error || "Soru kaydedilemedi");
      }
    } catch (err) {
      console.error("Soru güncellenirken hata:", err);
      toast.error("Soru güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const saveNewLevel = async () => {
    if (!newLevelName.trim()) {
      toast.warn("Level adı zorunludur");
      return;
    }

    if (!newLevelTitle.trim()) {
      toast.warn("Konu başlığı zorunludur");
      return;
    }

    // Level adı validasyonu
    const cleanLevelName = newLevelName.trim();

    // Mevcut level kontrolü
    if (document && document[cleanLevelName]) {
      toast.warn("Bu isimde bir level zaten var");
      return;
    }

    // Level numarasını isminden çıkarmaya çalış (örn: level5 -> 5)
    const levelNum = parseInt(cleanLevelName.replace(/\D/g, "")) || 0;

    try {
      setSaving(true);
      const idToken = await getValidToken();

      const response = await fetch(
        `/api/admin/eslestirmeler/${encodeURIComponent(docId as string)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fieldPath: cleanLevelName,
            value: {
              title: newLevelTitle.trim(),
              level: levelNum > 0 ? levelNum : undefined,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowLevelModal(false);
        setNewLevelName("");
        setNewLevelTitle("");
        await fetchDocument();
        toast.success("Level başarıyla oluşturuldu!");
      } else {
        toast.error(data.error || "Level oluşturulamadı");
      }
    } catch (err) {
      console.error("Level oluşturulurken hata:", err);
      toast.error("Level oluşturulurken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const deleteField = (fieldPath: string) => {
    setFieldToDelete(fieldPath);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fieldToDelete) return;

    try {
      setSaving(true);
      const idToken = await getValidToken();

      const response = await fetch(
        `/api/admin/eslestirmeler/${encodeURIComponent(docId as string)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            fieldPath: fieldToDelete,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchDocument();
        toast.success("Alan başarıyla silindi!");
        setShowDeleteModal(false);
        setFieldToDelete(null);
      } else {
        toast.error(data.error || "Alan silinemedi");
      }
    } catch (err) {
      console.error("Alan silinirken hata:", err);
      toast.error("Alan silinirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Sıralamayı güncelle
      const oldIndex = sortedFields.indexOf(active.id as string);
      const newIndex = sortedFields.indexOf(over?.id as string);
      
      // Sadece görsel olarak güncelle (optimistic update)
      // Gerçek veri fetchDocument ile güncellenecek
      
      try {
        setSaving(true);
        const idToken = await getValidToken();
        
        // Yeni sıralamayı kaydet
        // Burada sadece yer değiştiren iki öğenin değil, tüm listenin sırasını güncellemek gerekebilir
        // Veya sadece ilgili öğenin yeni sırasını (order) göndermek
        
        // Basitlik için: Sadece sürüklenen öğenin yeni sırasını hesaplayıp gönderelim
        // Ancak bu, aradaki diğer öğelerin sırasını bozabilir.
        // En doğrusu: Yeni sıralamadaki tüm level'ların order'ını güncellemek.
        
        const newSortedFields = arrayMove(sortedFields, oldIndex, newIndex);
        
        // Sadece level olanları filtrele ve yeni order'larını belirle
        const levelUpdates = newSortedFields
          .filter(key => key.startsWith("level"))
          .map((key, index) => ({
            fieldPath: key,
            order: index + 1
          }));
          
        // Batch update için backend'e gönder
        // Backend'de toplu güncelleme endpoint'i olmadığı için tek tek gönderiyoruz (şimdilik)
        // İdealde: /api/admin/eslestirmeler/[docId]/reorder gibi bir endpoint olmalı
        
        // Şimdilik sadece sürüklenen öğenin order'ını güncelleyelim (HACK)
        // Not: Bu tam çözüm değil, çünkü diğer öğelerin order'ı değişmeyince çakışma olabilir.
        // Doğru çözüm: Tüm level'ların order'ını güncellemek.
        
        const updatePromises = levelUpdates.map(update => 
          fetch(`/api/admin/eslestirmeler/${encodeURIComponent(docId as string)}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              fieldPath: update.fieldPath,
              value: { 
                ...document[update.fieldPath], 
                order: update.order 
              }
            }),
          })
        );
        
        await Promise.all(updatePromises);
        
        toast.success("Sıralama güncellendi");
        await fetchDocument();
        
      } catch (err) {
        console.error("Sıralama güncellenirken hata:", err);
        toast.error("Sıralama güncellenemedi");
      } finally {
        setSaving(false);
      }
    }
  };

  const renderField = (
    key: string,
    value: any,
    path: string = "",
    depth: number = 0
  ): JSX.Element | null => {
    const fieldPath = path ? `${path}.${key}` : key;
    const isExpanded = expandedFields.has(fieldPath);

    // Arama filtresi
    if (
      searchTerm &&
      !key.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !fieldPath.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return null;
    }

    if (value === null || value === undefined) {
      return (
        <div
          key={key}
          className="mb-2 ps-3 ps-md-4"
          style={{ paddingLeft: `${depth * 1.5}rem` }}
        >
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="text-muted fw-bold">{key}:</span>
            <span className="badge bg-secondary">null</span>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => startEditing(fieldPath, value)}
            >
              <i className="bi bi-pencil me-1"></i>
              <span className="d-none d-sm-inline">Düzenle</span>
            </button>
          </div>
        </div>
      );
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      // Soru kontrolü
      const isQuestion =
        value.questionType || (value.soru && value.soru.question);

      if (isQuestion) {
        let qTypeLabel = "Soru";
        let qTypeColor = "primary";

        if (value.questionType === QuestionType.BOSLUK_DOLDURMA) {
          qTypeLabel = "Boşluk Doldurma";
          qTypeColor = "success";
        } else if (value.questionType === QuestionType.COKTAN_SECMELI) {
          qTypeLabel = "Çoktan Seçmeli";
          qTypeColor = "warning";
        } else if (value.questionType === QuestionType.ESLESTIRME) {
          qTypeLabel = "Eşleştirme";
          qTypeColor = "info";
        }

        const questionText =
          value.soru?.question || value.question || "Soru metni yok";
        const shortQuestion =
          questionText.length > 100
            ? questionText.substring(0, 100) + "..."
            : questionText;

        return (
          <div key={key} className="mb-3">
            <div className={`card border-${qTypeColor} shadow-sm`}>
              <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <span className={`badge bg-${qTypeColor}`}>{qTypeLabel}</span>
                  <strong className="text-dark">{key}</strong>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => startEditing(fieldPath, value)}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Düzenle
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteField(fieldPath)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Sil
                  </button>
                </div>
              </div>
              <div className="card-body">
                <p className="card-text mb-2">{shortQuestion}</p>
                {value.aciklama && (
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-info-circle me-1"></i>
                    {value.aciklama}
                  </small>
                )}
                <div className="d-flex gap-2">
                  {value.soru?.options && (
                    <span className="badge bg-light text-dark border">
                      {value.soru.options.length} Seçenek
                    </span>
                  )}
                  {value.zorluk && (
                    <span className="badge bg-light text-dark border">
                      {value.zorluk}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      const keys = Object.keys(value);
      
      // Eğer bu bir Level ise (ana dizindeki levelX alanları)
      // SortableItem kullan, değilse normal kart
      const isLevel = path === "" && key.startsWith("level");

      if (isLevel) {
        return (
          <SortableItem
            key={key}
            id={key}
            handleEdit={() => startEditing(fieldPath, value)}
            handleDelete={() => deleteField(fieldPath)}
            handleToggle={() => toggleField(fieldPath)}
            isExpanded={isExpanded}
            itemCount={keys.length}
          >
            {isExpanded && (
              <div className="card-body">
                <div className="row g-2">
                  {keys.map((k) => {
                    const rendered = renderField(
                      k,
                      value[k],
                      fieldPath,
                      depth + 1
                    );
                    return rendered ? (
                      <div key={k} className="col-12">
                        {rendered}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </SortableItem>
        );
      }

      return (
        <div key={key} className="mb-3">
          <div className="card border shadow-sm">
            <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <button
                  className="btn btn-sm btn-link p-0 text-decoration-none"
                  onClick={() => toggleField(fieldPath)}
                  style={{ minWidth: "24px" }}
                >
                  <i
                    className={`bi bi-chevron-${
                      isExpanded ? "down" : "right"
                    } fs-5`}
                  ></i>
                </button>
                <strong className="text-primary fs-6">{key}</strong>
                <span className="badge bg-secondary">{keys.length} alan</span>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => startEditing(fieldPath, value)}
                >
                  <i className="bi bi-pencil me-1"></i>
                  <span className="d-none d-sm-inline">Düzenle</span>
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => deleteField(fieldPath)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="card-body">
                <div className="row g-2">
                  {keys.map((k) => {
                    const rendered = renderField(
                      k,
                      value[k],
                      fieldPath,
                      depth + 1
                    );
                    return rendered ? (
                      <div key={k} className="col-12">
                        {rendered}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-3">
          <div className="card border shadow-sm">
            <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <button
                  className="btn btn-sm btn-link p-0 text-decoration-none"
                  onClick={() => toggleField(fieldPath)}
                  style={{ minWidth: "24px" }}
                >
                  <i
                    className={`bi bi-chevron-${
                      isExpanded ? "down" : "right"
                    } fs-5`}
                  ></i>
                </button>
                <strong className="text-info fs-6">{key}</strong>
                <span className="badge bg-info">{value.length} öğe</span>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => startEditing(fieldPath, value)}
                >
                  <i className="bi bi-pencil me-1"></i>
                  <span className="d-none d-sm-inline">Düzenle</span>
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => deleteField(fieldPath)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="card-body">
                <div className="list-group list-group-flush">
                  {value.map((item, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex align-items-start">
                        <span className="badge bg-secondary me-2 mt-1">
                          {index}
                        </span>
                        <div className="flex-grow-1">
                          {typeof item === "object" && item !== null ? (
                            <pre className="mb-0 small bg-light p-2 rounded">
                              <code>{JSON.stringify(item, null, 2)}</code>
                            </pre>
                          ) : (
                            <span className="text-dark">{String(item)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="mb-2">
        <div className="card border-0 bg-light">
          <div className="card-body py-2">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="flex-grow-1">
                <strong className="text-dark d-block mb-1">{key}</strong>
                <span className="text-dark small">
                  {typeof value === "string" && value.length > 150
                    ? `${value.substring(0, 150)}...`
                    : String(value)}
                </span>
              </div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => startEditing(fieldPath, value)}
              >
                <i className="bi bi-pencil me-1"></i>
                <span className="d-none d-sm-inline">Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

  if (error || !document) {
    return (
      <AdminGuard>
        <Header variant="admin" />
        <div className="container my-5">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error || "Doküman bulunamadı"}
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

  const fields = Object.keys(document).filter((key) => key !== "id");

  // Level'ları order alanına göre sırala
  const sortedFields = fields.sort((a, b) => {
    const valA = document[a];
    const valB = document[b];

    // Level ile başlayan alanları order'a göre sırala
    if (a.startsWith("level") && b.startsWith("level")) {
      const orderA = valA?.order || parseInt(a.replace(/\D/g, "")) || 0;
      const orderB = valB?.order || parseInt(b.replace(/\D/g, "")) || 0;
      if (orderA !== orderB) return orderA - orderB;
    }
    // Level olmayan alanları alfabetik sırala
    if (!a.startsWith("level") && !b.startsWith("level")) {
      return a.localeCompare(b);
    }
    // Level'lar önce gelsin
    if (a.startsWith("level") && !b.startsWith("level")) return -1;
    if (!a.startsWith("level") && b.startsWith("level")) return 1;
    return a.localeCompare(b);
  });

  const filteredFields = sortedFields.filter((key) => {
    if (!searchTerm) return true;
    return key.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <AdminGuard>
      <Head>
        <title>Eşleştirme Düzenle - {docId} - Admin Panel</title>
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
                  <i className="bi bi-diagram-3 me-2"></i>
                  Eşleştirme Düzenle: <code className="fs-6">{docId}</code>
                </h1>
              </div>
            </div>

            {/* Toolbar */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-md-6 col-lg-4">
                    <label htmlFor="searchField" className="form-label mb-1">
                      <i className="bi bi-search me-1"></i>
                      Alan Ara
                    </label>
                    <input
                      type="text"
                      id="searchField"
                      className="form-control"
                      placeholder="Alan adı ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6 col-lg-8">
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={expandAll}
                      >
                        <i className="bi bi-arrows-expand me-1"></i>
                        Tümünü Genişlet
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={collapseAll}
                      >
                        <i className="bi bi-arrows-collapse me-1"></i>
                        Tümünü Daralt
                      </button>
                      <button
                        className="btn btn-outline-info btn-sm"
                        onClick={fetchDocument}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Yenile
                      </button>

                      {/* Soru Ekleme Butonları */}
                      <div className="ms-auto d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowLevelModal(true)}
                          title="Yeni Level Grubu Ekle"
                        >
                          <i className="bi bi-folder-plus me-1"></i>
                          Level Ekle
                        </button>
                        <div className="vr mx-1"></div>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() =>
                            openQuestionModal(QuestionType.BOSLUK_DOLDURMA)
                          }
                          title="Boşluk Doldurma Sorusu Ekle"
                        >
                          <i className="bi bi-plus-circle me-1"></i>
                          Boşluk Doldurma
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() =>
                            openQuestionModal(QuestionType.COKTAN_SECMELI)
                          }
                          title="Çoktan Seçmeli Soru Ekle"
                        >
                          <i className="bi bi-plus-circle me-1"></i>
                          Çoktan Seçmeli
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() =>
                            openQuestionModal(QuestionType.ESLESTIRME)
                          }
                          title="Eşleştirme Sorusu Ekle"
                        >
                          <i className="bi bi-plus-circle me-1"></i>
                          Eşleştirme
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="row">
              <div className="col-12">
                {fields.length === 0 ? (
                  <div className="card shadow-sm">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                      <h5 className="text-muted">
                        Bu dokümanda henüz alan bulunmuyor.
                      </h5>
                    </div>
                  </div>
                ) : filteredFields.length === 0 ? (
                  <div className="card shadow-sm">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-search display-4 text-muted d-block mb-3"></i>
                      <h5 className="text-muted">Arama sonucu bulunamadı.</h5>
                      <button
                        className="btn btn-outline-secondary mt-2"
                        onClick={() => setSearchTerm("")}
                      >
                        Aramayı Temizle
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="fields-container">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={filteredFields}
                        strategy={verticalListSortingStrategy}
                      >
                        {filteredFields.map((key) =>
                          renderField(key, document[key])
                        )}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && editingField && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Alan Düzenle:{" "}
                  <code className="text-white">{editingField}</code>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cancelEditing}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="fieldValue" className="form-label">
                    JSON Değeri
                  </label>
                  <textarea
                    id="fieldValue"
                    className="form-control font-monospace"
                    rows={15}
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    style={{ fontSize: "0.875rem" }}
                  />
                  <small className="form-text text-muted">
                    Geçerli bir JSON formatı giriniz.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => saveField(editingField)}
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
                      <i className="bi bi-check-circle me-1"></i>
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && questionType && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="bi bi-question-circle me-2"></i>
                  {questionType === QuestionType.BOSLUK_DOLDURMA
                    ? "Boşluk Doldurma Sorusu"
                    : questionType === QuestionType.COKTAN_SECMELI
                    ? "Çoktan Seçmeli Soru"
                    : "Eşleştirme Sorusu"}
                  {editingField && (
                    <small className="ms-2">
                      <code className="text-white">{editingField}</code>
                    </small>
                  )}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cancelQuestionModal}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                {/* Level Bilgileri - Sadece yeni soru eklerken */}
                {!editingField && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="levelGroup" className="form-label">
                        Level Grubu <span className="text-danger">*</span>
                      </label>
                      <select
                        id="levelGroup"
                        className="form-select"
                        value={questionFormData.levelGroup}
                        onChange={(e) =>
                          setQuestionFormData((prev) => ({
                            ...prev,
                            levelGroup: e.target.value,
                          }))
                        }
                      >
                        <option value="">Seçiniz...</option>
                        {sortedFields
                          .filter((key) => {
                            const val = document[key];
                            // Level ile başlıyorsa VEYA (obje ise VE (title var VEYA level var VEYA sorular var))
                            return (
                              key.startsWith("level") ||
                              (typeof val === "object" &&
                                val !== null &&
                                (val.title ||
                                  val.level ||
                                  Array.isArray(val.sorular)))
                            );
                          })
                          .map((level) => (
                            <option key={level} value={level}>
                              {level}{" "}
                              {document[level]?.title
                                ? `(${document[level].title})`
                                : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="levelNumber" className="form-label">
                        Soru Numarası <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="levelNumber"
                        className="form-control"
                        value={questionFormData.levelNumber}
                        onChange={(e) =>
                          setQuestionFormData((prev) => ({
                            ...prev,
                            levelNumber: e.target.value,
                          }))
                        }
                        placeholder="Örn: 1, 2, 3..."
                      />
                    </div>
                    <div className="col-12 mt-2">
                      <small className="form-text text-muted">
                        Soru{" "}
                        <code>
                          {questionFormData.levelGroup || "..."}.
                          {questionFormData.levelNumber || "..."}
                        </code>{" "}
                        olarak kaydedilecektir
                      </small>
                    </div>
                  </div>
                )}

                {/* Soru Metni */}
                <div className="mb-3">
                  <label htmlFor="questionText" className="form-label">
                    Soru Metni <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="questionText"
                    className="form-control"
                    rows={3}
                    value={questionFormData.questionText}
                    onChange={(e) =>
                      setQuestionFormData((prev) => ({
                        ...prev,
                        questionText: e.target.value,
                      }))
                    }
                    placeholder="Soru metnini girin..."
                  />
                </div>

                {/* Seçenekler */}
                {(questionType === QuestionType.BOSLUK_DOLDURMA ||
                  questionType === QuestionType.COKTAN_SECMELI) && (
                  <div className="mb-3">
                    <label className="form-label">
                      Seçenekler <span className="text-danger">*</span>
                    </label>
                    {questionFormData.options.map((option, idx) => (
                      <div key={idx} className="input-group mb-2">
                        <span className="input-group-text">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionFormData.options];
                            newOptions[idx] = e.target.value;
                            setQuestionFormData((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          placeholder={`Seçenek ${String.fromCharCode(
                            65 + idx
                          )}`}
                        />
                        {questionFormData.options.length > 2 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => {
                              const newOptions =
                                questionFormData.options.filter(
                                  (_, i) => i !== idx
                                );
                              setQuestionFormData((prev) => ({
                                ...prev,
                                options: newOptions,
                              }));
                            }}
                            title="Seçeneği Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setQuestionFormData((prev) => ({
                          ...prev,
                          options: [...prev.options, ""],
                        }));
                      }}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Seçenek Ekle
                    </button>
                  </div>
                )}

                {/* Eşleştirme için özel alan */}
                {questionType === QuestionType.ESLESTIRME && (
                  <div className="mb-3">
                    <label className="form-label">
                      Doğru Eşleştirmeler <span className="text-danger">*</span>
                    </label>
                    <small className="form-text text-muted d-block mb-2">
                      Her satıra bir eşleştirme girin
                    </small>
                    {questionFormData.options.map((option, idx) => (
                      <div key={idx} className="input-group mb-2">
                        <span className="input-group-text">{idx + 1}.</span>
                        <input
                          type="text"
                          className="form-control"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionFormData.options];
                            newOptions[idx] = e.target.value;
                            setQuestionFormData((prev) => ({
                              ...prev,
                              options: newOptions,
                            }));
                          }}
                          placeholder={`Eşleştirme ${idx + 1}`}
                        />
                        {questionFormData.options.length > 2 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => {
                              const newOptions =
                                questionFormData.options.filter(
                                  (_, i) => i !== idx
                                );
                              setQuestionFormData((prev) => ({
                                ...prev,
                                options: newOptions,
                              }));
                            }}
                            title="Eşleştirmeyi Sil"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setQuestionFormData((prev) => ({
                          ...prev,
                          options: [...prev.options, ""],
                        }));
                      }}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Eşleştirme Ekle
                    </button>
                  </div>
                )}

                {/* Yanlış Eşleştirmeler (Sadece Eşleştirme için) */}
                {questionType === QuestionType.ESLESTIRME && (
                  <div className="mb-3">
                    <label className="form-label">
                      Yanlış Eşleştirmeler (Opsiyonel)
                    </label>
                    <small className="form-text text-muted d-block mb-2">
                      Kullanıcıyı şaşırtmak için yanlış seçenekler
                      ekleyebilirsiniz
                    </small>
                    {questionFormData.incorrectOptions.map((option, idx) => (
                      <div key={idx} className="input-group mb-2">
                        <span className="input-group-text bg-warning text-dark">
                          <i className="bi bi-x"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [
                              ...questionFormData.incorrectOptions,
                            ];
                            newOptions[idx] = e.target.value;
                            setQuestionFormData((prev) => ({
                              ...prev,
                              incorrectOptions: newOptions,
                            }));
                          }}
                          placeholder={`Yanlış Seçenek ${idx + 1}`}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => {
                            const newOptions =
                              questionFormData.incorrectOptions.filter(
                                (_, i) => i !== idx
                              );
                            setQuestionFormData((prev) => ({
                              ...prev,
                              incorrectOptions: newOptions,
                            }));
                          }}
                          title="Sil"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning text-dark"
                      onClick={() => {
                        setQuestionFormData((prev) => ({
                          ...prev,
                          incorrectOptions: [...prev.incorrectOptions, ""],
                        }));
                      }}
                    >
                      <i className="bi bi-plus-circle me-1"></i>
                      Yanlış Seçenek Ekle
                    </button>
                  </div>
                )}

                {/* Doğru Cevap */}
                {questionType !== QuestionType.ESLESTIRME && (
                  <div className="mb-3">
                    <label htmlFor="correctAnswer" className="form-label">
                      Doğru Cevap
                    </label>
                    <input
                      type="text"
                      id="correctAnswer"
                      className="form-control"
                      value={questionFormData.correctAnswer}
                      onChange={(e) =>
                        setQuestionFormData((prev) => ({
                          ...prev,
                          correctAnswer: e.target.value,
                        }))
                      }
                      placeholder={
                        questionType === QuestionType.BOSLUK_DOLDURMA
                          ? "Doğru seçeneği girin"
                          : "Doğru cevabı girin (örn: A, B, C)"
                      }
                    />
                  </div>
                )}

                {/* Açıklama */}
                <div className="mb-3">
                  <label htmlFor="explanation" className="form-label">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    id="explanation"
                    className="form-control"
                    rows={2}
                    value={questionFormData.explanation}
                    onChange={(e) =>
                      setQuestionFormData((prev) => ({
                        ...prev,
                        explanation: e.target.value,
                      }))
                    }
                    placeholder="Cevap açıklaması..."
                  />
                </div>

                {/* Zorluk */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="difficulty" className="form-label">
                      Zorluk Seviyesi
                    </label>
                    <select
                      id="difficulty"
                      className="form-select"
                      value={questionFormData.difficulty}
                      onChange={(e) =>
                        setQuestionFormData((prev) => ({
                          ...prev,
                          difficulty: e.target.value,
                        }))
                      }
                    >
                      <option value="kolay">Kolay</option>
                      <option value="orta">Orta</option>
                      <option value="zor">Zor</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelQuestionModal}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={saveQuestionField}
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
                      <i className="bi bi-check-circle me-1"></i>
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Level Modal */}
      {showLevelModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-folder-plus me-2"></i>
                  Yeni Level Ekle
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowLevelModal(false)}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="newLevelName" className="form-label">
                    Level Adı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="newLevelName"
                    className="form-control"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    placeholder="Örn: level5"
                  />
                  <small className="form-text text-muted">
                    Yeni bir level grubu oluşturulacak.
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="newLevelTitle" className="form-label">
                    Konu Başlığı <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="newLevelTitle"
                    className="form-control"
                    value={newLevelTitle}
                    onChange={(e) => setNewLevelTitle(e.target.value)}
                    placeholder="Örn: Coğrafi Bölgeler"
                  />
                  <small className="form-text text-muted">
                    Bu level için bir başlık girin.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLevelModal(false)}
                  disabled={saving}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveNewLevel}
                  disabled={saving}
                >
                  {saving ? (
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
                      <i className="bi bi-check-circle me-1"></i>
                      Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Silme Onayı
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={saving}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0 text-dark">
                  <strong>{fieldToDelete}</strong> alanını silmek istediğinize
                  emin misiniz?
                </p>
                <p className="text-danger small mt-2 mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={saving}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
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
                      <i className="bi bi-trash me-1"></i>
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
