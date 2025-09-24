import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { denemeId } = req.query;

    if (!denemeId || typeof denemeId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Deneme ID gerekli",
      });
    }

    console.log("Doğru-Yanlış denemesi siliniyor:", denemeId);

    // Deneme dokümanını kontrol et
    const denemeDoc = await adminDb
      .collection("dogruyanlis")
      .doc(denemeId)
      .get();

    if (!denemeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Doğru-Yanlış denemesi bulunamadı",
      });
    }

    const denemeData = denemeDoc.data();

    // Önce sorular alt koleksiyonunu sil
    const sorularSnapshot = await denemeDoc.ref.collection("sorular").get();
    const batch = adminDb.batch();

    sorularSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Deneme dokümanını sil
    batch.delete(denemeDoc.ref);

    // Batch işlemini uygula
    await batch.commit();

    console.log(
      `Doğru-Yanlış denemesi silindi: ${denemeId} (${sorularSnapshot.size} soru)`
    );

    res.status(200).json({
      success: true,
      data: {
        denemeId,
        denemeName: denemeData?.name || denemeId,
        deletedQuestionsCount: sorularSnapshot.size,
      },
      message: "Doğru-Yanlış denemesi başarıyla silindi",
    });
  } catch (error) {
    console.error("Doğru-Yanlış denemesi silme hatası:", error);
    res.status(500).json({
      success: false,
      error: "Doğru-Yanlış denemesi silinemedi",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
