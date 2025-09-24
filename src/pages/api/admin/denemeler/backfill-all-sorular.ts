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
    console.log("Tüm denemeler için sorular backfill işlemi başlatılıyor...");

    // Tüm denemeleri getir
    const denemelerSnapshot = await adminDb.collection("MevzuatDeneme").get();

    console.log(`${denemelerSnapshot.size} deneme bulundu`);

    const results = [];
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalAlreadyComplete = 0;

    // Her deneme için sorular backfill işlemi
    for (const denemeDoc of denemelerSnapshot.docs) {
      const denemeId = denemeDoc.id;
      console.log(`\n${denemeId} denemesi işleniyor...`);

      try {
        // Sorular alt koleksiyonunu kontrol et
        const sorularSnapshot = await denemeDoc.ref.collection("sorular").get();

        if (sorularSnapshot.size === 0) {
          console.log(`${denemeId} denemesinde soru bulunamadı`);
          results.push({
            denemeId,
            status: "no_questions",
            processedCount: 0,
          });
          continue;
        }

        const batch = adminDb.batch();
        const denemeResults = [];

        // Her soru için backfill işlemi
        for (const soruDoc of sorularSnapshot.docs) {
          const soruId = soruDoc.id;
          const soruData = soruDoc.data();

          // Eğer soru dokümanında hiç alan yoksa (gerçekten missing document)
          if (!soruData || Object.keys(soruData).length === 0) {
            // Sadece missing document'ları düzelt, gerçek verileri koru
            const minimalData = {
              createdAt: new Date(),
              updatedAt: new Date(),
              status: "active",
            };

            batch.set(soruDoc.ref, minimalData, { merge: true });
            denemeResults.push({
              id: soruId,
              action: "missing_document_fixed",
            });
            totalCreated++;
          } else {
            // Gerçek verileri koru, sadece eksik metadata alanları ekle
            const updateData: any = {};

            if (!soruData.createdAt) updateData.createdAt = new Date();
            if (!soruData.updatedAt) updateData.updatedAt = new Date();
            if (!soruData.status) updateData.status = "active";

            if (Object.keys(updateData).length > 0) {
              batch.update(soruDoc.ref, updateData);
              denemeResults.push({
                id: soruId,
                action: "metadata_added",
              });
              totalUpdated++;
            } else {
              denemeResults.push({ id: soruId, action: "already_complete" });
              totalAlreadyComplete++;
            }
          }
          totalProcessed++;
        }

        // Batch işlemini commit et
        if (denemeResults.length > 0) {
          await batch.commit();
        }

        results.push({
          denemeId,
          status: "success",
          processedCount: denemeResults.length,
          results: denemeResults,
        });

        console.log(
          `${denemeId} denemesi tamamlandı: ${denemeResults.length} soru işlendi`
        );
      } catch (denemeError) {
        console.error(`${denemeId} denemesi işlenirken hata:`, denemeError);
        results.push({
          denemeId,
          status: "error",
          error:
            denemeError instanceof Error
              ? denemeError.message
              : "Bilinmeyen hata",
          processedCount: 0,
        });
      }
    }

    console.log("\nTüm denemeler için sorular backfill işlemi tamamlandı");

    res.status(200).json({
      success: true,
      message:
        "Tüm denemeler için sorular backfill işlemi başarıyla tamamlandı",
      summary: {
        totalDenemeler: denemelerSnapshot.size,
        totalProcessed,
        totalCreated,
        totalUpdated,
        totalAlreadyComplete,
      },
      results: results,
    });
  } catch (error) {
    console.error("Tüm denemeler sorular backfill işlemi hatası:", error);
    res.status(500).json({
      success: false,
      error: "Tüm denemeler sorular backfill işlemi başarısız",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
