import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import SoruList from "@/components/SoruList";

export default function CografyaDenemeDetayPage() {
  const router = useRouter();
  const { denemeId } = router.query;

  return (
    <>
      <Head>
        <title>Coğrafya Denemesi - Memur Jargonu</title>
        <meta name="description" content="Coğrafya denemesi soruları" />
      </Head>

      <Header />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            {denemeId && typeof denemeId === "string" ? (
              <SoruList
                denemeType="cografya"
                denemeId={denemeId}
                isAdmin={false}
              />
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
    </>
  );
}
