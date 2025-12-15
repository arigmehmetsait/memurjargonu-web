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
        .collection("dogruyanlis")
        .doc(denemeId)
        .get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doğru-Yanlış denemesi bulunamadı",
        });
      }

      // Seçilen alt koleksiyonu getir
      const sorularSnapshot = await denemeDoc.ref.collection(collectionName).get();

      // Metadata dokümanını filtrele
      const sorular = sorularSnapshot.docs
        .filter((doc) => doc.id !== "_metadata")
        .map((doc) => {
        const data = doc.data();
        // Resimdeki modele göre sadece text ve correct alanları
        const soruText = data.text || "";
        const correctAnswer = data.correct || "";
        const description = data.description || "";
        return {
          id: doc.id,
          soru: soruText,
          cevap: correctAnswer,
          secenekler: ["Doğru", "Yanlış"],
          dogruSecenek: correctAnswer === "Doğru" ? 0 : 1,
          aciklama: description,
          zorluk: "orta",
          konu: "Doğru-Yanlış",
          createdAt: null,
          updatedAt: null,
          status: "active",
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

      // Body'den koleksiyon adını al (POST için)
      const targetCollection = req.body.collection || collectionName;

      // Yeni soru ID'si oluştur (metadata'yı saymadan)
      const sorularSnapshot = await denemeDoc.ref.collection(targetCollection).get();
      const gercekSoruSayisi = sorularSnapshot.docs.filter((doc) => doc.id !== "_metadata").length;
      const yeniSoruNumarasi = gercekSoruSayisi + 1;
      const soruId = `soru${yeniSoruNumarasi}`;

      // Soru verisini oluştur - resimdeki modele göre sadece text ve correct
      const soruData = {
        text: text.trim(),
        correct: correct,
        description: description.trim(),
      };

      // Soruyu ekle
      await denemeDoc.ref.collection(targetCollection).doc(soruId).set(soruData);

      // _metadata dokümanını sil (eğer varsa)
      const metadataRef = denemeDoc.ref.collection(targetCollection).doc("_metadata");
      const metadataDoc = await metadataRef.get();
      if (metadataDoc.exists) {
        await metadataRef.delete();
      }

      // Konuyu dogruyanlisTopics koleksiyonuna kaydet
      // Deneme adını doküman adı olarak kullan (ör: "Güncel Bilgiler"), alt koleksiyon adını topics array'ine ekle
      let denemeName = denemeDoc.data()?.name;
      
      // Eğer name alanı yoksa, deneme ID'sinden isim çıkar
      if (!denemeName || !denemeName.trim()) {
        // ID formatı: "dogru-yanlis-guncel-bilgiler-1764076986462" veya sadece "cografya"
        const idStr = typeof denemeId === "string" ? denemeId : "";
        if (idStr.startsWith("dogru-yanlis-")) {
          // "dogru-yanlis-guncel-bilgiler-1764076986462" -> "Güncel Bilgiler"
          const namePart = idStr.replace(/^dogru-yanlis-/, "").replace(/-\d+$/, "");
          denemeName = namePart
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        } else {
          // "cografya" -> "Coğrafya", "tarih" -> "Tarih", "vatandaslik" -> "Vatandaşlık"
          const nameMap: Record<string, string> = {
            cografya: "Coğrafya",
            tarih: "Tarih",
            vatandaslik: "Vatandaşlık",
            "guncel-bilgiler": "Güncel Bilgiler",
          };
          denemeName = nameMap[idStr] || idStr.charAt(0).toUpperCase() + idStr.slice(1);
        }
      }
      
      // Deneme adı ve alt koleksiyon adı varsa topics'e ekle
      if (denemeName && denemeName.trim() && targetCollection && targetCollection.trim()) {
        try {
          const topicsCollectionRef = adminDb.collection("dogruyanlisTopics");
          const topicDocRef = topicsCollectionRef.doc(denemeName.trim());
          const topicDoc = await topicDocRef.get();

          if (topicDoc.exists) {
            // Doküman varsa, topics array'ini güncelle
            const existingData = topicDoc.data();
            const existingTopics = existingData?.topics || [];
            // Eğer alt koleksiyon adı zaten yoksa ekle
            if (!existingTopics.includes(targetCollection.trim())) {
              await topicDocRef.update({
                topics: [...existingTopics, targetCollection.trim()],
              });
            }
          } else {
            // Doküman yoksa oluştur (deneme adı doküman adı, alt koleksiyon adı topics array'ine)
            await topicDocRef.set({
              topics: [targetCollection.trim()],
            });
          }
        } catch (topicError) {
          // Konu kaydetme hatası soru eklemeyi engellemesin
          console.error("Konu kaydetme hatası:", topicError);
        }
      }

      // Deneme soru sayısını güncelle
      await denemeDoc.ref.update({
        soruSayisi: yeniSoruNumarasi,
        updatedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        data: {
          id: soruId,
          soru: soruData.text,
          cevap: soruData.correct,
          aciklama: soruData.description,
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
