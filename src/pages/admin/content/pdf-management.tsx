"use client";
import AdminGuard from "@/components/AdminGuard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getValidToken } from "@/utils/tokenCache";
import { PDFCategory, PDFSubcategory, PDFStats } from "@/types/pdf";
import {
  PDF_CATEGORY_INFO,
  getSubcategoriesByCategory,
} from "@/constants/pdfCategories";

export default function PDFManagement() {
  const [stats, setStats] = useState<PDFStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PDFCategory | "all">(
    "all"
  );

  // İstatistikleri yükle
  const loadStats = async () => {
    setLoading(true);
    try {
      const idToken = await getValidToken(); // Cache'li token

      const response = await fetch("/api/admin/content/stats", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("İstatistikler alınamadı:", response.statusText);
        // Fallback mock data
        setStats({
          totalCount: 0,
          countByCategory: {
            [PDFCategory.AGS]: 0,
            [PDFCategory.KPSS]: 0,
          },
          countBySubcategory: Object.fromEntries(
            Object.values(PDFSubcategory).map((cat) => [cat, 0])
          ) as Record<PDFSubcategory, number>,
          countByStatus: {
            active: 0,
            inactive: 0,
            draft: 0,
          },
          totalFileSize: 0,
        });
      }
    } catch (error) {
      console.error("İstatistikler yüklenemedi:", error);
      // Fallback mock data
      setStats({
        totalCount: 0,
        countByCategory: {
          [PDFCategory.AGS]: 0,
          [PDFCategory.KPSS]: 0,
        },
        countBySubcategory: Object.fromEntries(
          Object.values(PDFSubcategory).map((cat) => [cat, 0])
        ) as Record<PDFSubcategory, number>,
        countByStatus: {
          active: 0,
          inactive: 0,
          draft: 0,
        },
        totalFileSize: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const filteredSubcategories =
    selectedCategory === "all"
      ? Object.values(PDFSubcategory)
      : getSubcategoriesByCategory(selectedCategory);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AdminGuard>
      <div className="min-vh-100 bg-light">
        <Header variant="admin" />

        {/* Main Content */}
        <div className="container py-5">
          <div className="row">
            <div className="col-12">
              {/* Page Header */}
              <div className="text-center mb-5">
                <h1 className="display-5 fw-bold text-dark mb-3">
                  <i className="bi bi-file-earmark-pdf me-3"></i>
                  PDF İçerik Yönetimi
                </h1>
                <p className="lead text-muted">
                  PDF dosyalarını yönetin, kategorilere göre organize edin ve
                  kullanıcı erişimlerini kontrol edin.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <h5 className="mb-0">
                          <i className="bi bi-tools me-2"></i>
                          Hızlı İşlemler
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                          <Link
                            href="/admin/content/add-pdf"
                            className="btn btn-primary"
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Yeni PDF Ekle
                          </Link>
                          {/* <Link
                            href="/admin/content/bulk-upload"
                            className="btn btn-outline-primary"
                          >
                            <i className="bi bi-cloud-upload me-2"></i>
                            Toplu Yükleme
                          </Link> */}
                          {/* <Link
                            href="/admin/content/list"
                            className="btn btn-outline-info"
                          >
                            <i className="bi bi-list me-2"></i>
                            Tüm PDF'leri Görüntüle
                          </Link> */}
                          {/* <Link
                            href="/admin/content/categories"
                            className="btn btn-outline-secondary"
                          >
                            <i className="bi bi-tags me-2"></i>
                            Kategori Yönetimi
                          </Link> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card shadow-sm">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="bi bi-funnel me-2"></i>
                        Kategori Filtresi
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="btn-group flex-wrap" role="group">
                        <button
                          type="button"
                          className={`btn ${
                            selectedCategory === "all"
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => setSelectedCategory("all")}
                        >
                          <i className="bi bi-list me-1"></i>
                          Tümü
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            selectedCategory === PDFCategory.AGS
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => setSelectedCategory(PDFCategory.AGS)}
                        >
                          <i className="bi bi-mortarboard me-1"></i>
                          AGS ({stats?.countByCategory[PDFCategory.AGS] || 0})
                        </button>
                        <button
                          type="button"
                          className={`btn ${
                            selectedCategory === PDFCategory.KPSS
                              ? "btn-primary"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => setSelectedCategory(PDFCategory.KPSS)}
                        >
                          <i className="bi bi-building me-1"></i>
                          KPSS ({stats?.countByCategory[PDFCategory.KPSS] || 0})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Cards */}
              <div className="row g-4">
                {filteredSubcategories.map((subcategory) => {
                  const categoryInfo = PDF_CATEGORY_INFO[subcategory];
                  const count = stats?.countBySubcategory[subcategory] || 0;

                  return (
                    <div key={subcategory} className="col-lg-4 col-md-6">
                      <div className="card h-100 shadow-sm hover-card d-flex flex-column">
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <div className="me-3">
                              <div className="category-icon mb-2">
                                <i
                                  className={`${categoryInfo.icon} display-6 text-primary`}
                                ></i>
                              </div>
                              <h6 className="fw-bold text-dark mb-1">
                                {categoryInfo.name}
                              </h6>
                              <small className="text-muted">
                                {categoryInfo.description}
                              </small>
                            </div>
                            <span className="badge bg-primary fs-6">
                              {count}
                            </span>
                          </div>

                          <div className="mb-3">
                            <small className="text-muted">
                              İlgili Paketler:
                            </small>
                            <div className="mt-1">
                              {categoryInfo.packageTypes.map((packageType) => (
                                <span
                                  key={packageType}
                                  className="badge bg-light text-dark me-1 mb-1"
                                >
                                  {packageType.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="d-grid gap-2 mt-auto">
                            <Link
                              href={`/admin/content/list?subcategory=${subcategory}`}
                              className="btn btn-outline-primary btn-sm"
                            >
                              <i className="bi bi-eye me-1"></i>
                              PDF'leri Görüntüle ({count})
                            </Link>
                            <Link
                              href={`/admin/content/add-pdf?subcategory=${subcategory}`}
                              className="btn btn-primary btn-sm"
                            >
                              <i className="bi bi-plus me-1"></i>
                              Bu Kategoriye PDF Ekle
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity */}
              <div className="row mt-5">
                <div className="col-12">
                  <div className="card shadow-sm">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>
                        Son Aktiviteler
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="text-center text-muted py-4">
                        <i className="bi bi-info-circle display-4 mb-3"></i>
                        <p>Henüz aktivite bulunmuyor.</p>
                        <p className="small">
                          PDF ekleme ve düzenleme işlemleriniz burada görünecek.
                        </p>
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

      {/* Custom Styles */}
      <style jsx>{`
        .hover-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }
        .category-icon {
          text-align: center;
        }
        .btn-group .btn {
          border-radius: 0.375rem !important;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </AdminGuard>
  );
}
