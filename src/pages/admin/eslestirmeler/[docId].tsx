import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getValidToken } from "@/utils/tokenCache";
import { toast } from "react-toastify";

interface FieldValue {
  [key: string]: any;
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
    setEditingField(fieldPath);
    setFieldValue(JSON.stringify(currentValue, null, 2));
    setShowEditModal(true);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setFieldValue("");
    setShowEditModal(false);
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
      const keys = Object.keys(value);
      const hasNestedObjects = keys.some(
        (k) => typeof value[k] === "object" && value[k] !== null
      );

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
                {hasNestedObjects && (
                  <span className="badge bg-info">Nested</span>
                )}
              </div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => startEditing(fieldPath, value)}
              >
                <i className="bi bi-pencil me-1"></i>
                <span className="d-none d-sm-inline">Düzenle</span>
              </button>
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
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => startEditing(fieldPath, value)}
              >
                <i className="bi bi-pencil me-1"></i>
                <span className="d-none d-sm-inline">Düzenle</span>
              </button>
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
  const filteredFields = fields.filter((key) => {
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
                    {filteredFields.map((key) =>
                      renderField(key, document[key])
                    )}
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
    </AdminGuard>
  );
}
