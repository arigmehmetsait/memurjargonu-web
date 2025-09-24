import Head from "next/head";
import Header from "@/components/Header";
import DenemeList from "@/components/DenemeList";

export default function TarihDenemelerPage() {
  return (
    <>
      <Head>
        <title>Tarih Denemeleri - Memur Jargonu</title>
        <meta
          name="description"
          content="Tarih denemeleri ile kendinizi test edin"
        />
      </Head>

      <Header />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <DenemeList
              denemeType="tarih"
              title="Tarih Denemeleri"
              description="Tarih bilginizi test edin ve kendinizi geliştirin"
            />
          </div>
        </div>
      </main>
    </>
  );
}
