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
    // boslukdoldurma koleksiyonundan tüm dokümanları getir
    const boslukdoldurmaSnapshot = await adminDb
      .collection("boslukdoldurma")
      .get();

    const denemeler = boslukdoldurmaSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || doc.id,
        description: data.description || "",
        soruSayisi: data.soruSayisi || 0,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        status: data.status || "active",
      };
    });

    // Soru sayılarını hesapla
    const denemelerWithSoruSayisi = await Promise.all(
      denemeler.map(async (deneme) => {
        try {
          const sorularSnapshot = await adminDb
            .collection("boslukdoldurma")
            .doc(deneme.id)
            .collection("sorular")
            .get();

          return {
            ...deneme,
            soruSayisi: sorularSnapshot.size,
          };
        } catch (error) {
          console.error(`${deneme.id} soru sayısı alınırken hata:`, error);
          return deneme;
        }
      })
    );

    // İsme göre sırala
    denemelerWithSoruSayisi.sort((a, b) => a.name.localeCompare(b.name, "tr"));

    console.log(
      `Boşluk Doldurma denemeleri hazırlandı: ${denemelerWithSoruSayisi.length} deneme`
    );

    res.status(200).json({
      success: true,
      data: denemelerWithSoruSayisi,
    });
  } catch (error) {
    console.error("Boşluk Doldurma denemeleri listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Boşluk Doldurma denemeleri listesi alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
