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
    console.log("Firebase Admin DB bağlantısı test ediliyor...");

    // MevzuatDeneme koleksiyonundaki tüm denemeleri getir
    const denemelerSnapshot = await adminDb.collection("MevzuatDeneme").get();

    const denemeler = denemelerSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.id,
      soruSayisi: 0,
    }));

    // Her deneme için soru sayısını hesapla
    for (let i = 0; i < denemeler.length; i++) {
      try {
        const sorularSnapshot = await adminDb
          .collection("MevzuatDeneme")
          .doc(denemeler[i].id)
          .collection("sorular")
          .get();

        denemeler[i].soruSayisi = sorularSnapshot.size;
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
    console.error("Denemeler listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Denemeler listesi alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
