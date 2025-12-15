import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { denemeId, soruId, collection } = req.query;

  if (
    !denemeId ||
    typeof denemeId !== "string" ||
    !soruId ||
    typeof soruId !== "string"
  ) {
    return res.status(400).json({
      success: false,
      error: "Deneme ID ve Soru ID gerekli",
    });
  }

  // Koleksiyon adı yoksa varsayılan olarak "sorular" kullan
  const collectionName = typeof collection === "string" ? collection : "sorular";

  if (req.method === "PUT") {
    // Soruyu güncelle
    try {
      // Resimdeki modele göre sadece text ve correct alanları
      const text = req.body.text;
      const correct = req.body.correct;
      const description = req.body.description || "";

      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          error: "Soru metni gereklidir",
        });
      }

      if (!correct || (correct !== "Doğru" && correct !== "Yanlış")) {
        return res.status(400).json({
          success: false,
          error: "Doğru cevap 'Doğru' veya 'Yanlış' olmalıdır",
        });
      }

      console.log(`Soru güncelleniyor: ${denemeId}/${soruId}`);

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

      // Soru dokümanını kontrol et
      const soruDoc = await denemeDoc.ref
        .collection(collectionName)
        .doc(soruId)
        .get();

      if (!soruDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Soru bulunamadı",
        });
      }

      // Güncellenmiş soru verisini oluştur - resimdeki modele göre sadece text ve correct
      const updatedSoruData = {
        text: text.trim(),
        correct: correct,
        description: description.trim(),
      };

      // Soruyu güncelle
      await soruDoc.ref.update(updatedSoruData);

      // Deneme güncelleme tarihini güncelle
      await denemeDoc.ref.update({
        updatedAt: new Date(),
      });

      console.log(`Soru güncellendi: ${denemeId}/${collectionName}/${soruId}`);

      res.status(200).json({
        success: true,
        data: {
          id: soruId,
          soru: updatedSoruData.text,
          cevap: updatedSoruData.correct,
          aciklama: updatedSoruData.description,
        },
        message: "Soru başarıyla güncellendi",
      });
    } catch (error) {
      console.error("Soru güncelleme hatası:", error);
      res.status(500).json({
        success: false,
        error: "Soru güncellenemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  } else if (req.method === "DELETE") {
    // Soruyu sil
    try {
      console.log(`Soru siliniyor: ${denemeId}/${collectionName}/${soruId}`);

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

      // Soru dokümanını kontrol et
      const soruDoc = await denemeDoc.ref
        .collection(collectionName)
        .doc(soruId)
        .get();

      if (!soruDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Soru bulunamadı",
        });
      }

      // Soruyu sil
      await soruDoc.ref.delete();

      // Kalan soru sayısını hesapla ve deneme soru sayısını güncelle
      const sorularSnapshot = await denemeDoc.ref.collection(collectionName).get();
      await denemeDoc.ref.update({
        soruSayisi: sorularSnapshot.size,
        updatedAt: new Date(),
      });

      console.log(`Soru silindi: ${denemeId}/${collectionName}/${soruId}`);

      res.status(200).json({
        success: true,
        data: {
          denemeId,
          soruId,
        },
        message: "Soru başarıyla silindi",
      });
    } catch (error) {
      console.error("Soru silme hatası:", error);
      res.status(500).json({
        success: false,
        error: "Soru silinemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
