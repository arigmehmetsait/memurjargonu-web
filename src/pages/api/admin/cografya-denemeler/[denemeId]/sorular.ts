import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { denemeId } = req.query;

  if (!denemeId || typeof denemeId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Deneme ID gerekli",
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

  if (req.method === "GET") {
    // Soruları listele
    try {
      // Deneme dokümanını kontrol et
      const denemeRef = adminDb.collection("RealCografyaDenemeler").doc(denemeId);
      const denemeDoc = await denemeRef.get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Coğrafya denemesi bulunamadı",
        });
      }

      // Sorular alt koleksiyonunu getir (coğrafya yapısı: soru1 koleksiyonu)
      const sorularSnapshot = await denemeRef.collection("soru1").get();

      const sorular = sorularSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Doğru cevabı options array'indeki index'ini bul
        const correctAnswer = data.correctAnswer || "";
        const options = data.options || [];
        let dogruSecenek = 0;
        if (correctAnswer && options.length > 0) {
          const index = options.findIndex(
            (opt: string) => opt.trim() === correctAnswer.trim()
          );
          if (index >= 0) {
            dogruSecenek = index;
          }
        }

        return {
          id: doc.id,
          soru: data.questionText || "",
          cevap: correctAnswer,
          secenekler: options,
          dogruSecenek,
          aciklama: data.explanation || "",
          zorluk: data.difficulty || "orta",
          konu: data.subject || "Coğrafya",
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          status: data.status || "active",
        };
      });

      // Soruları ID'ye göre sırala (soru1, soru2, ...)
      sorular.sort((a, b) => {
        const aNum = parseInt(a.id.replace("soru", "")) || 0;
        const bNum = parseInt(b.id.replace("soru", "")) || 0;
        return aNum - bNum;
      });

      res.status(200).json({
        success: true,
        data: {
          denemeId,
          denemeName: denemeDoc.data()?.name || denemeId,
          sorular,
          totalCount: sorular.length,
        },
      });
    } catch (error) {
      console.error("Coğrafya soruları listesi alınırken hata:", error);
      res.status(500).json({
        success: false,
        error: "Sorular listesi alınamadı",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  } else if (req.method === "POST") {
    // Yeni soru ekle
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
      const finalSubject = subject || konu || "Coğrafya";

      if (!finalQuestionText.trim()) {
        return res.status(400).json({
          success: false,
          error: "Soru metni gereklidir",
        });
      }

      if (!finalCorrectAnswer.trim()) {
        return res.status(400).json({
          success: false,
          error: "Doğru cevap gereklidir",
        });
      }

      if (!finalOptions || !Array.isArray(finalOptions) || finalOptions.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Seçenekler gereklidir",
        });
      }

      // Deneme dokümanını kontrol et
      const denemeRef = adminDb.collection("RealCografyaDenemeler").doc(denemeId);
      const denemeDoc = await denemeRef.get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Coğrafya denemesi bulunamadı",
        });
      }

      // Yeni soru ID'si oluştur (coğrafya yapısı: soru1 koleksiyonu)
      const sorularSnapshot = await denemeRef.collection("soru1").get();
      const yeniSoruNumarasi = sorularSnapshot.size + 1;
      const soruId = `soru${yeniSoruNumarasi}`;

      // Soru verisini oluştur (Firebase formatına uygun)
      const soruData = {
        questionText: finalQuestionText.trim(),
        correctAnswer: finalCorrectAnswer.trim(),
        options: finalOptions
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0),
        explanation: finalExplanation.trim() || "",
        difficulty: finalDifficulty,
        subject: finalSubject,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
      };

      // Soruyu ekle (coğrafya yapısı: soru1 koleksiyonu)
      await denemeRef.collection("soru1").doc(soruId).set(soruData);

      // Deneme soru sayısını güncelle
      await denemeRef.update({
        soruSayisi: yeniSoruNumarasi,
        updatedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        data: {
          id: soruId,
          ...soruData,
        },
        message: "Soru başarıyla eklendi",
      });
    } catch (error) {
      console.error("Coğrafya soru ekleme hatası:", error);
      res.status(500).json({
        success: false,
        error: "Soru eklenemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

