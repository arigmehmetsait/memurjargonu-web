import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import SoruList from "@/components/SoruList";

export default function AdminTarihSorularPage() {
  const router = useRouter();
  const { denemeId } = router.query;

  return (
    <AdminGuard>
      <Head>
        <title>Tarih Denemesi Soruları - Admin Panel</title>
        <meta name="description" content="Tarih denemesi soruları yönetimi" />
      </Head>

      <Header variant="admin" />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            {denemeId && typeof denemeId === "string" ? (
              <SoruList denemeType="tarih" denemeId={denemeId} isAdmin={true} />
            ) : (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="mt-3 text-muted">Deneme yükleniyor...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
