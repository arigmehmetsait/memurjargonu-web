import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { denemeId, collection } = req.query;

  if (!denemeId || typeof denemeId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Deneme ID gerekli",
    });
  }

  // Koleksiyon adı yoksa varsayılan olarak "sorular" kullan
  const collectionName = typeof collection === "string" ? collection : "sorular";

  if (req.method === "GET") {
    // Soruları listele
    try {
      // Deneme dokümanını kontrol et
      const denemeDoc = await adminDb
        .collection("boslukdoldurma")
        .doc(denemeId)
        .get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Boşluk Doldurma denemesi bulunamadı",
        });
      }

      // Seçilen alt koleksiyonu getir
      const sorularSnapshot = await denemeDoc.ref.collection(collectionName).get();

      // Metadata dokümanını filtrele
      const sorular = sorularSnapshot.docs
        .filter((doc) => doc.id !== "_metadata")
        .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          soru: data.questionText || "",
          cevap: data.correctAnswer || "",
          secenekler: data.options || [],
          dogruSecenek: 0, // Boşluk doldurmada doğru cevap options array'indeki index
          aciklama: data.explanation || "",
          zorluk: data.difficulty || "orta",
          konu: data.subject || "Boşluk Doldurma",
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          status: data.status || "active",
        };
      });

      // Soruları ID'ye göre sırala
      sorular.sort((a, b) => {
        const aNum = parseInt(a.id.replace("soru", ""));
        const bNum = parseInt(b.id.replace("soru", ""));
        return aNum - bNum;
      });

      res.status(200).json({
        success: true,
        data: {
          denemeId,
          denemeName: denemeDoc.data()?.name || denemeId,
          collectionName,
          sorular,
          totalCount: sorular.length,
        },
      });
    } catch (error) {
      console.error("Sorular listesi alınırken hata:", error);
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
      } = req.body;

      if (!questionText || !questionText.trim()) {
        return res.status(400).json({
          success: false,
          error: "Soru metni gereklidir",
        });
      }

      if (!correctAnswer || !correctAnswer.trim()) {
        return res.status(400).json({
          success: false,
          error: "Doğru cevap gereklidir",
        });
      }

      if (!options || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Seçenekler gereklidir",
        });
      }

      // Deneme dokümanını kontrol et
      const denemeDoc = await adminDb
        .collection("boslukdoldurma")
        .doc(denemeId)
        .get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Boşluk Doldurma denemesi bulunamadı",
        });
      }

      // Body'den koleksiyon adını al (POST için)
      const targetCollection = req.body.collection || collectionName;

      // Yeni soru ID'si oluştur (metadata'yı saymadan)
      const sorularSnapshot = await denemeDoc.ref.collection(targetCollection).get();
      const gercekSoruSayisi = sorularSnapshot.docs.filter((doc) => doc.id !== "_metadata").length;
      const yeniSoruNumarasi = gercekSoruSayisi + 1;
      const soruId = `soru${yeniSoruNumarasi}`;

      // Soru verisini oluştur
      const soruData = {
        questionText: questionText.trim(),
        correctAnswer: correctAnswer.trim(),
        options: options
          .map((opt: string) => opt.trim())
          .filter((opt: string) => opt.length > 0),
        explanation: explanation?.trim() || "",
        difficulty: difficulty || "orta",
        subject: subject || "Boşluk Doldurma",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
      };

      // Soruyu ekle
      await denemeDoc.ref.collection(targetCollection).doc(soruId).set(soruData);

      // Deneme soru sayısını güncelle
      await denemeDoc.ref.update({
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
      console.error("Soru ekleme hatası:", error);
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
