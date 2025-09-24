import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { denemeId } = req.query;

    if (!denemeId || typeof denemeId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Deneme ID gerekli",
      });
    }

    console.log(`Genel denemesi silme işlemi başlatılıyor: ${denemeId}`);

    // Deneme dokümanını kontrol et
    const denemeDoc = await adminDb.collection("denemeler").doc(denemeId).get();

    if (!denemeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Genel denemesi bulunamadı",
      });
    }

    const denemeData = denemeDoc.data();
    console.log(`Silinecek genel denemesi: ${denemeData?.name || denemeId}`);

    // Sorular alt koleksiyonunu kontrol et
    const sorularSnapshot = await denemeDoc.ref.collection("soru1").get();

    // Batch işlemi başlat
    const batch = adminDb.batch();

    // Tüm soruları sil
    sorularSnapshot.docs.forEach((soruDoc) => {
      batch.delete(soruDoc.ref);
      console.log(`Genel sorusu silinecek: ${soruDoc.id}`);
    });

    // Deneme dokümanını sil
    batch.delete(denemeDoc.ref);
    console.log(`Genel deneme dokümanı silinecek: ${denemeId}`);

    // Batch işlemini uygula
    await batch.commit();

    console.log(`Genel denemesi başarıyla silindi: ${denemeId}`);

    res.status(200).json({
      success: true,
      message: "Genel denemesi başarıyla silindi",
      data: {
        denemeId,
        denemeName: denemeData?.name || denemeId,
        deletedQuestionsCount: sorularSnapshot.size,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Genel denemesi silme işlemi hatası:", error);
    res.status(500).json({
      success: false,
      error: "Genel denemesi silme işlemi başarısız",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
