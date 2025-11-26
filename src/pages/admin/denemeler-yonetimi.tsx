import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import AdminDenemeTable from "@/components/AdminDenemeTable";
import CreateDenemeModal from "@/components/CreateDenemeModal";
import { toast } from "react-toastify";

export default function AdminDenemelerYonetimiPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "mevzuat" | "cografya" | "tarih" | "genel"
  >("mevzuat");

  const handleCreateSuccess = () => {
    // Sayfa yenilenecek, AdminDenemeTable component'i otomatik olarak yeni listeyi çekecek
    window.location.reload();
  };

  const handleEditClick = (deneme: any) => {
    // TODO: Düzenleme modalı veya sayfası
    toast.info(
      `"${deneme.name}" denemesi düzenleme özelliği henüz hazır değil.`
    );
  };

  return (
    <AdminGuard>
      <Head>
        <title>Denemeler Yönetimi - Admin Panel</title>
        <meta name="description" content="Tüm denemeler yönetimi" />
      </Head>

      <Header variant="admin" />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <button
                  className="btn btn-outline-secondary mb-2"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                <h1 className="h2 mb-0">
                  <i className="bi bi-journal-text me-2"></i>
                  Denemeler Yönetimi
                </h1>
                <p className="text-muted mb-0">
                  Tüm denemeleri oluşturun, düzenleyin ve yönetin
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${
                    activeTab === "mevzuat" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("mevzuat")}
                  type="button"
                >
                  <i className="bi bi-journal-text me-2"></i>
                  Mevzuat Denemeleri
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${
                    activeTab === "cografya" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("cografya")}
                  type="button"
                >
                  <i className="bi bi-globe me-2"></i>
                  Coğrafya Denemeleri
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${
                    activeTab === "tarih" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("tarih")}
                  type="button"
                >
                  <i className="bi bi-clock-history me-2"></i>
                  Tarih Denemeleri
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${
                    activeTab === "genel" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("genel")}
                  type="button"
                >
                  <i className="bi bi-journal me-2"></i>
                  Güncel Bilgiler Denemeler
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "mevzuat" && (
                <div className="tab-pane fade show active">
                  <AdminDenemeTable
                    denemeType="mevzuat"
                    title=""
                    description=""
                    onCreateClick={() => setShowCreateModal(true)}
                    onEditClick={handleEditClick}
                  />
                </div>
              )}

              {activeTab === "cografya" && (
                <div className="tab-pane fade show active">
                  <AdminDenemeTable
                    denemeType="cografya"
                    title=""
                    description=""
                    onCreateClick={() => setShowCreateModal(true)}
                    onEditClick={handleEditClick}
                  />
                </div>
              )}

              {activeTab === "tarih" && (
                <div className="tab-pane fade show active">
                  <AdminDenemeTable
                    denemeType="tarih"
                    title=""
                    description=""
                    onCreateClick={() => setShowCreateModal(true)}
                    onEditClick={handleEditClick}
                  />
                </div>
              )}

              {activeTab === "genel" && (
                <div className="tab-pane fade show active">
                  <AdminDenemeTable
                    denemeType="genel"
                    title=""
                    description=""
                    onCreateClick={() => setShowCreateModal(true)}
                    onEditClick={handleEditClick}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Deneme Oluşturma Modalı */}
      <CreateDenemeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        denemeType={activeTab}
      />
    </AdminGuard>
  );
}
