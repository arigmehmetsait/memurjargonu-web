import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { denemeId, soruId } = req.query;

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

  if (req.method === "PUT") {
    // Soruyu güncelle
    try {
      const {
        questionText,
        correctAnswer,
        options,
        explanation,
        difficulty,
        subject,
      } = req.body;

      if (!questionText || !questionText.trim()) {
        return res.status(400).json({
          success: false,
          error: "Soru metni gereklidir",
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
        .collection("sorular")
        .doc(soruId)
        .get();

      if (!soruDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Soru bulunamadı",
        });
      }

      // Güncellenmiş soru verisini oluştur
      const updatedSoruData = {
        questionText: questionText.trim(),
        correctAnswer: correctAnswer || "Doğru",
        options: options || ["Doğru", "Yanlış"],
        explanation: explanation?.trim() || "",
        difficulty: difficulty || "orta",
        subject: subject || "Doğru-Yanlış",
        updatedAt: new Date(),
      };

      // Soruyu güncelle
      await soruDoc.ref.update(updatedSoruData);

      // Deneme güncelleme tarihini güncelle
      await denemeDoc.ref.update({
        updatedAt: new Date(),
      });

      console.log(`Soru güncellendi: ${denemeId}/${soruId}`);

      res.status(200).json({
        success: true,
        data: {
          id: soruId,
          ...updatedSoruData,
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
      console.log(`Soru siliniyor: ${denemeId}/${soruId}`);

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
        .collection("sorular")
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
      const sorularSnapshot = await denemeDoc.ref.collection("sorular").get();
      await denemeDoc.ref.update({
        soruSayisi: sorularSnapshot.size,
        updatedAt: new Date(),
      });

      console.log(`Soru silindi: ${denemeId}/${soruId}`);

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
