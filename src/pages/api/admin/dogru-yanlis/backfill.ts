import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Doğru-Yanlış sorular backfill işlemi başlatılıyor...");

    // Önce mevcut dogruyanlis dokümanlarını kontrol et
    const dogruyanlisSnapshot = await adminDb.collection("dogruyanlis").get();
    console.log(
      `Mevcut dogruyanlis doküman sayısı: ${dogruyanlisSnapshot.size}`
    );

    const batch = adminDb.batch();
    let processedCount = 0;
    let createdCount = 0;

    // Her dogruyanlis dokümanı için sorular alt koleksiyonunu oluştur
    for (const doc of dogruyanlisSnapshot.docs) {
      try {
        const docId = doc.id;
        console.log(`İşleniyor: ${docId}`);

        // sorular alt koleksiyonunu kontrol et
        const sorularRef = doc.ref.collection("sorular");
        const sorularSnapshot = await sorularRef.get();

        if (sorularSnapshot.size === 0) {
          console.log(
            `${docId} için sorular alt koleksiyonu boş, örnek sorular ekleniyor...`
          );

          // Örnek doğru-yanlış soruları ekle (soru1'den soru10'a kadar)
          const sampleQuestions = [
            {
              id: "soru1",
              questionText:
                "Altın işletme sanatındaki maharetiyle Asya Hun Devleti Bozkırın Kuyumcuları olarak anılır.",
              correctAnswer: "Yanlış",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru2",
              questionText: "Türkiye'nin başkenti Ankara'dır.",
              correctAnswer: "Doğru",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru3",
              questionText: "İstanbul iki kıtada yer alan tek şehirdir.",
              correctAnswer: "Doğru",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru4",
              questionText: "KPSS sınavı yılda iki kez yapılır.",
              correctAnswer: "Yanlış",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru5",
              questionText: "Türkiye'nin en uzun nehri Kızılırmak'tır.",
              correctAnswer: "Doğru",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru6",
              questionText: "Ankara'nın plaka kodu 06'dır.",
              correctAnswer: "Doğru",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru7",
              questionText: "Türkiye'nin en yüksek dağı Ağrı Dağı'dır.",
              correctAnswer: "Doğru",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru8",
              questionText: "İstanbul'un eski adı Konstantinopolis'tir.",
              correctAnswer: "Doğru",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru9",
              questionText: "Türkiye'nin en büyük gölü Van Gölü'dür.",
              correctAnswer: "Doğru",
              options: ["Doğru", "Yanlış"],
            },
            {
              id: "soru10",
              questionText: "KPSS sınavında 120 soru sorulur.",
              correctAnswer: "Yanlış",
              options: ["Doğru", "Yanlış"],
            },
          ];

          // Her soru için doküman oluştur
          for (const question of sampleQuestions) {
            const soruRef = sorularRef.doc(question.id);
            batch.set(soruRef, {
              questionText: question.questionText,
              correctAnswer: question.correctAnswer,
              options: question.options,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: "active",
            });
            createdCount++;
            console.log(`${docId}/sorular/${question.id} oluşturuluyor`);
          }
        } else {
          console.log(
            `${docId} için sorular alt koleksiyonu zaten mevcut (${sorularSnapshot.size} soru)`
          );
        }

        processedCount++;
      } catch (error) {
        console.error(`${doc.id} işlenirken hata:`, error);
      }
    }

    // Batch işlemini uygula
    if (createdCount > 0) {
      await batch.commit();
      console.log(`Backfill tamamlandı: ${createdCount} soru oluşturuldu`);
    }

    res.status(200).json({
      success: true,
      message: "Doğru-Yanlış sorular backfill işlemi tamamlandı",
      data: {
        processedDocuments: processedCount,
        createdQuestions: createdCount,
      },
    });
  } catch (error) {
    console.error("Doğru-Yanlış backfill hatası:", error);
    res.status(500).json({
      success: false,
      error: "Backfill işlemi başarısız",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
