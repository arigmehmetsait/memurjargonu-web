import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { denemeId, soruId } = req.query;

  if (!denemeId || typeof denemeId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Deneme ID gerekli",
    });
  }

  if (!soruId || typeof soruId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Soru ID gerekli",
    });
  }

  // Token doğrulama
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Admin yetkisi kontrolü
  const userRecord = await adminAuth.getUser(decodedToken.uid);
  const customClaims = userRecord.customClaims || {};

  if (!customClaims.admin) {
    return res.status(403).json({ error: "Admin yetkisi gerekli" });
  }

  if (req.method === "PUT") {
    // Soru güncelle
    try {
      const {
        questionText,
        correctAnswer,
        options,
        explanation,
        difficulty,
        subject,
        soru,
        cevap,
        secenekler,
        konu,
        aciklama,
        zorluk,
      } = req.body;

      // Eski format desteği
      const finalQuestionText = questionText || soru || "";
      const finalCorrectAnswer = correctAnswer || cevap || "";
      const finalOptions = options || secenekler || [];
      const finalExplanation = explanation || aciklama || "";
      const finalDifficulty = difficulty || zorluk || "orta";
      const finalSubject = subject || konu || "Güncel Bilgiler";

      if (!finalQuestionText.trim()) {
        return res.status(400).json({
          success: false,
          error: "Soru metni gereklidir",
        });
      }

      // Deneme dokümanını kontrol et
      const denemeRef = adminDb.collection("denemeler").doc(denemeId);
      const denemeDoc = await denemeRef.get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Deneme bulunamadı",
        });
      }

      // Soru dokümanını kontrol et
      const soruRef = denemeRef.collection("sorular").doc(soruId);
      const soruDoc = await soruRef.get();

      if (!soruDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Soru bulunamadı",
        });
      }

      // Soru verisini güncelle
      const updateData: any = {
        questionText: finalQuestionText.trim(),
        correctAnswer: finalCorrectAnswer.trim(),
        options: finalOptions
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0),
        explanation: finalExplanation.trim() || "",
        difficulty: finalDifficulty,
        subject: finalSubject,
        updatedAt: new Date(),
      };

      await soruRef.update(updateData);

      res.status(200).json({
        success: true,
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
    // Soru sil
    try {
      // Deneme dokümanını kontrol et
      const denemeRef = adminDb.collection("denemeler").doc(denemeId);
      const denemeDoc = await denemeRef.get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Deneme bulunamadı",
        });
      }

      // Soru dokümanını sil
      const soruRef = denemeRef.collection("sorular").doc(soruId);
      await soruRef.delete();

      // Deneme soru sayısını güncelle
      const sorularSnapshot = await denemeRef.collection("sorular").get();
      await denemeRef.update({
        soruSayisi: sorularSnapshot.size,
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
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

