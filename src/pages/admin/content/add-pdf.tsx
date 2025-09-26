"use client";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Alert from "@/components/Alert";
import Link from "next/link";
import { useRouter } from "next/router";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getValidToken } from "@/utils/tokenCache";
import {
  PDFCategory,
  PDFSubcategory,
  PDFStatus,
  PDFDocumentRequest,
} from "@/types/pdf";
import { PackageType } from "@/types/package";
import {
  PDF_CATEGORY_INFO,
  getSubcategoriesByCategory,
} from "@/constants/pdfCategories";
import { PACKAGE_INFO } from "@/constants/packages";

export default function AddPDF() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<PDFDocumentRequest>({
    title: "",
    description: "",
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_EGITIM,
    visibleInPackages: [],
    isPremiumOnly: false,
    sortOrder: 1,
    tags: [],
    status: PDFStatus.DRAFT,
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // URL'den subcategory parametresini al
  useEffect(() => {
    if (router.query.subcategory) {
      const subcategory = router.query.subcategory as PDFSubcategory;
      if (Object.values(PDFSubcategory).includes(subcategory)) {
        const categoryInfo = PDF_CATEGORY_INFO[subcategory];
        setFormData((prev) => ({
          ...prev,
          category: categoryInfo.category,
          subcategory: subcategory,
          visibleInPackages: categoryInfo.packageTypes,
        }));
      }
    }
  }, [router.query]);

  // Kategori değiştiğinde alt kategorileri güncelle
  useEffect(() => {
    const subcategories = getSubcategoriesByCategory(formData.category);
    if (
      subcategories.length > 0 &&
      !subcategories.includes(formData.subcategory)
    ) {
      setFormData((prev) => ({
        ...prev,
        subcategory: subcategories[0],
        visibleInPackages: PDF_CATEGORY_INFO[subcategories[0]].packageTypes,
      }));
    }
  }, [formData.category]);

  // Alt kategori değiştiğinde ilgili paketleri otomatik seç
  useEffect(() => {
    const categoryInfo = PDF_CATEGORY_INFO[formData.subcategory];
    setFormData((prev) => ({
      ...prev,
      visibleInPackages: categoryInfo.packageTypes,
    }));
  }, [formData.subcategory]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "tags") {
      // Tags virgülle ayrılmış string olarak geliyor
      const tagsArray = value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      setFormData((prev) => ({ ...prev, tags: tagsArray }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePackageChange = (packageType: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      visibleInPackages: checked
        ? [...prev.visibleInPackages, packageType]
        : prev.visibleInPackages.filter((p) => p !== packageType),
    }));
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setMessage(null);

      // Dosya adından başlık önerisi
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.pdf$/i, "");
        setFormData((prev) => ({ ...prev, title: nameWithoutExt }));
      }
    } else {
      setMessage("❌ Lütfen sadece PDF dosyası seçin.");
      setSelectedFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Başlık zorunludur.";
    if (!selectedFile) return "PDF dosyası seçmeniz gerekir.";
    if (formData.visibleInPackages.length === 0)
      return "En az bir paket seçmeniz gerekir.";
    if (formData.sortOrder < 1)
      return "Sıra numarası 1 veya daha büyük olmalıdır.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage(`❌ ${validationError}`);
      return;
    }

    if (!selectedFile) {
      setMessage("❌ PDF dosyası seçmeniz gerekir.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setMessage("📤 PDF yükleniyor...");

    try {
      // Firebase token al
      const idToken = await getValidToken(); // Cache'li token

      // FormData oluştur
      const uploadFormData = new FormData();
      uploadFormData.append("pdfFile", selectedFile);
      uploadFormData.append("title", formData.title);
      uploadFormData.append("description", formData.description || "");
      uploadFormData.append("category", formData.category);
      uploadFormData.append("subcategory", formData.subcategory);
      uploadFormData.append(
        "visibleInPackages",
        formData.visibleInPackages.join(",")
      );
      uploadFormData.append("isPremiumOnly", formData.isPremiumOnly.toString());
      uploadFormData.append("sortOrder", formData.sortOrder.toString());
      uploadFormData.append("tags", formData.tags?.join(",") || "");
      uploadFormData.append("status", formData.status);

      // Progress tracking için XMLHttpRequest kullan
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error"));
        });

        xhr.open("POST", "/api/admin/content/upload");
        xhr.setRequestHeader("Authorization", `Bearer ${idToken}`);
        xhr.send(uploadFormData);
      });

      const result = await uploadPromise;

      setMessage("✅ PDF başarıyla eklendi!");

      // Form temizle
      setFormData({
        title: "",
        description: "",
        category: PDFCategory.AGS,
        subcategory: PDFSubcategory.AGS_EGITIM,
        visibleInPackages: [],
        isPremiumOnly: false,
        sortOrder: 1,
        tags: [],
        status: PDFStatus.DRAFT,
      });
      setSelectedFile(null);
      setUploadProgress(0);

      // 2 saniye sonra liste sayfasına yönlendir
      setTimeout(() => {
        router.push("/admin/content");
      }, 2000);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "PDF yüklenirken hata oluştu.";
      setMessage(`❌ ${errorMessage}`);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const availableSubcategories = getSubcategoriesByCategory(formData.category);
  const availablePackages = Object.values(PackageType).filter((packageType) => {
    return formData.category === PDFCategory.AGS
      ? packageType.startsWith("ags_")
      : packageType.startsWith("kpss_");
  });

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Page Header */}
              <div className="text-center mb-5">
                <h1 className="display-6 fw-bold text-dark mb-3">
                  <i className="bi bi-plus-circle me-3"></i>
                  Yeni PDF Ekle
                </h1>
                <p className="lead text-muted">
                  Sisteme yeni bir PDF dosyası ekleyin ve kategori ayarlarını
                  yapın.
                </p>
              </div>

              {/* Breadcrumb */}
              <Breadcrumb
                showHome={false}
                items={[
                  { label: "Admin", href: "/admin", icon: "bi-shield-check" },
                  {
                    label: "İçerik Yönetimi",
                    href: "/admin/content",
                    icon: "bi-file-earmark-pdf",
                  },
                  {
                    label: "Yeni PDF Ekle",
                    icon: "bi-plus-circle",
                    active: true,
                  },
                ]}
              />

              {/* Main Form */}
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-file-earmark-plus me-2"></i>
                    PDF Bilgileri
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    {/* File Upload Area */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-cloud-upload me-2"></i>
                        PDF Dosyası *
                      </label>
                      <div
                        className={`file-drop-area ${
                          dragActive ? "drag-active" : ""
                        } ${selectedFile ? "file-selected" : ""}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() =>
                          document.getElementById("pdfFile")?.click()
                        }
                      >
                        <input
                          type="file"
                          id="pdfFile"
                          accept=".pdf"
                          onChange={(e) =>
                            e.target.files &&
                            handleFileSelect(e.target.files[0])
                          }
                          className="d-none"
                        />

                        {selectedFile ? (
                          <div className="text-center">
                            <i className="bi bi-file-earmark-pdf text-success display-4 mb-2"></i>
                            <h6 className="text-success">
                              {selectedFile.name}
                            </h6>
                            <p className="text-muted mb-0">
                              Boyut:{" "}
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <small className="text-muted">
                              Değiştirmek için tıklayın
                            </small>
                          </div>
                        ) : (
                          <div className="text-center">
                            <i className="bi bi-cloud-upload text-primary display-4 mb-2"></i>
                            <h6>PDF dosyasını buraya sürükleyin</h6>
                            <p className="text-muted mb-0">
                              veya dosya seçmek için tıklayın
                            </p>
                            <small className="text-muted">
                              Maksimum dosya boyutu: 10MB
                            </small>
                          </div>
                        )}
                      </div>

                      {/* Upload Progress */}
                      {loading && uploadProgress > 0 && (
                        <div className="mt-3">
                          <div className="progress">
                            <div
                              className="progress-bar progress-bar-striped progress-bar-animated"
                              style={{ width: `${uploadProgress}%` }}
                            >
                              {uploadProgress}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label fw-semibold">
                        <i className="bi bi-type me-2"></i>
                        Başlık *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-control"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="PDF'in başlığını girin"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                      <label
                        htmlFor="description"
                        className="form-label fw-semibold"
                      >
                        <i className="bi bi-text-paragraph me-2"></i>
                        Açıklama
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="PDF hakkında kısa açıklama (opsiyonel)"
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label
                          htmlFor="category"
                          className="form-label fw-semibold"
                        >
                          <i className="bi bi-folder me-2"></i>
                          Ana Kategori *
                        </label>
                        <select
                          id="category"
                          name="category"
                          className="form-select"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          <option value={PDFCategory.AGS}>AGS</option>
                          <option value={PDFCategory.KPSS}>KPSS</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label
                          htmlFor="subcategory"
                          className="form-label fw-semibold"
                        >
                          <i className="bi bi-tags me-2"></i>
                          Alt Kategori *
                        </label>
                        <select
                          id="subcategory"
                          name="subcategory"
                          className="form-select"
                          value={formData.subcategory}
                          onChange={handleInputChange}
                          required
                        >
                          {availableSubcategories.map((subcategory) => (
                            <option key={subcategory} value={subcategory}>
                              {PDF_CATEGORY_INFO[subcategory].name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Package Visibility */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-eye me-2"></i>
                        Görünürlük Paketleri *
                      </label>
                      <div className="form-text mb-2">
                        Bu PDF hangi paketlerde görünecek?
                      </div>
                      <div className="row">
                        {availablePackages.map((packageType) => (
                          <div key={packageType} className="col-md-6 mb-2">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                id={`package-${packageType}`}
                                className="form-check-input"
                                checked={formData.visibleInPackages.includes(
                                  packageType
                                )}
                                onChange={(e) =>
                                  handlePackageChange(
                                    packageType,
                                    e.target.checked
                                  )
                                }
                              />
                              <label
                                htmlFor={`package-${packageType}`}
                                className="form-check-label"
                              >
                                {PACKAGE_INFO[packageType as PackageType]
                                  ?.name || packageType}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Settings Row */}
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label
                          htmlFor="sortOrder"
                          className="form-label fw-semibold"
                        >
                          <i className="bi bi-list-ol me-2"></i>
                          Sıra No *
                        </label>
                        <input
                          type="number"
                          id="sortOrder"
                          name="sortOrder"
                          className="form-control"
                          min="1"
                          value={formData.sortOrder}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label
                          htmlFor="status"
                          className="form-label fw-semibold"
                        >
                          <i className="bi bi-toggle-on me-2"></i>
                          Durum *
                        </label>
                        <select
                          id="status"
                          name="status"
                          className="form-select"
                          value={formData.status}
                          onChange={handleInputChange}
                          required
                        >
                          <option value={PDFStatus.DRAFT}>Taslak</option>
                          <option value={PDFStatus.ACTIVE}>Aktif</option>
                          <option value={PDFStatus.INACTIVE}>Pasif</option>
                        </select>
                      </div>
                      <div className="col-md-4 d-flex align-items-end">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            id="isPremiumOnly"
                            name="isPremiumOnly"
                            className="form-check-input"
                            checked={formData.isPremiumOnly}
                            onChange={handleInputChange}
                          />
                          <label
                            htmlFor="isPremiumOnly"
                            className="form-check-label fw-semibold"
                          >
                            <i className="bi bi-star me-2"></i>
                            Sadece Premium
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
                      <label htmlFor="tags" className="form-label fw-semibold">
                        <i className="bi bi-hash me-2"></i>
                        Etiketler
                      </label>
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        className="form-control"
                        value={formData.tags?.join(", ") || ""}
                        onChange={handleInputChange}
                        placeholder="Virgülle ayırarak etiket ekleyin (örn: tarih, osmanlı, sınav)"
                      />
                      <div className="form-text">
                        Arama ve filtreleme için kullanılacak etiketler
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-3 justify-content-end">
                      <Link href="/admin/content" className="btn btn-secondary">
                        <i className="bi bi-x-circle me-2"></i>
                        İptal
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Yükleniyor...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            PDF Ekle
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Message Alert */}
              {message && (
                <Alert
                  type={
                    message.includes("✅")
                      ? "success"
                      : message.includes("❌")
                      ? "danger"
                      : "info"
                  }
                  message={message}
                  className="mt-4"
                />
              )}
            </div>
          </div>
        </div>

        <Footer variant="admin" />
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .file-drop-area {
          border: 2px dashed #9ca3af;
          border-radius: 0.75rem;
          padding: 2.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f9fafb;
        }
        .file-drop-area:hover {
          border-color: #2563eb;
          background: #eff6ff;
        }
        .file-drop-area.drag-active {
          border-color: #2563eb;
          background: #dbeafe;
          transform: scale(1.02);
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.1);
        }
        .file-drop-area.file-selected {
          border-color: #059669;
          background: #ecfdf5;
        }

        /* Checkbox styling improvements */
        .form-check {
          padding: 0.75rem;
          border-radius: 0.5rem;
          transition: background-color 0.2s ease;
        }

        .form-check:hover {
          background-color: #f8fafc;
        }

        .form-check-input:checked + .form-check-label {
          color: #1f2937 !important;
          font-weight: 600;
        }

        /* Button improvements */
        .btn-lg {
          padding: 0.75rem 1.5rem;
          font-size: 1.1rem;
          font-weight: 600;
        }
      `}</style>
    </AdminGuard>
  );
}
