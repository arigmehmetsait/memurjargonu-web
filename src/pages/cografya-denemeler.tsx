import Head from "next/head";
import Header from "@/components/Header";
import DenemeList from "@/components/DenemeList";

export default function CografyaDenemelerPage() {
  return (
    <>
      <Head>
        <title>Coğrafya Denemeleri - Memur Jargonu</title>
        <meta
          name="description"
          content="Coğrafya denemeleri ile kendinizi test edin"
        />
      </Head>

      <Header />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <DenemeList
              denemeType="cografya"
              title="Coğrafya Denemeleri"
              description="Coğrafya bilginizi test edin ve kendinizi geliştirin"
            />
          </div>
        </div>
      </main>
    </>
  );
}
