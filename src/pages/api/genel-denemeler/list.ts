import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(
      "Güncel Bilgiler Denemeler Firebase Admin DB bağlantısı test ediliyor..."
    );

    // denemeler koleksiyonundaki tüm denemeleri getir
    const denemelerSnapshot = await adminDb.collection("denemeler").get();

    console.log(`Bulunan genel deneme sayısı: ${denemelerSnapshot.size}`);
    console.log(
      "Genel deneme ID'leri:",
      denemelerSnapshot.docs.map((doc) => doc.id)
    );

    const denemeler = denemelerSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.id,
      soruSayisi: 0,
    }));

    // Her deneme için soru sayısını hesapla
    for (let i = 0; i < denemeler.length; i++) {
      try {
        // Genel yapısı: denemeler/Deneme 1/soru1
        const soru1Snapshot = await adminDb
          .collection("denemeler")
          .doc(denemeler[i].id)
          .collection("soru1")
          .get();

        denemeler[i].soruSayisi = soru1Snapshot.size;
        console.log(
          `${denemeler[i].id} genel denemesinde ${soru1Snapshot.size} soru bulundu`
        );
      } catch (soruError) {
        console.error(
          `${denemeler[i].id} için soru sayısı alınırken hata:`,
          soruError
        );
        denemeler[i].soruSayisi = 0;
      }
    }

    res.status(200).json({
      success: true,
      data: denemeler,
    });
  } catch (error) {
    console.error("Güncel Bilgiler Denemeler listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Güncel Bilgiler Denemeler listesi alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
