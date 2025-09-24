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
    const { denemeId } = req.body;

    if (!denemeId) {
      return res.status(400).json({
        success: false,
        error: "Deneme ID gereklidir",
      });
    }

    console.log(`${denemeId} denemesinin soruları backfill ediliyor...`);

    // Deneme dokümanının var olup olmadığını kontrol et
    const denemeRef = adminDb.collection("MevzuatDeneme").doc(denemeId);
    const denemeDoc = await denemeRef.get();

    if (!denemeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Deneme bulunamadı",
      });
    }

    // Sorular alt koleksiyonunu kontrol et
    const sorularSnapshot = await denemeRef.collection("sorular").get();


    if (sorularSnapshot.size === 0) {
      return res.status(200).json({
        success: true,
        message: "Bu denemede henüz soru bulunmuyor",
        denemeId,
        processedCount: 0,
      });
    }

    const batch = adminDb.batch();
    const results = [];

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
        results.push({
          id: soruId,
          action: "missing_document_fixed",
          fields: Object.keys(minimalData),
        });

        console.log(`Missing document düzeltildi: ${soruId}`);
      } else {
        // Gerçek verileri koru, sadece eksik metadata alanları ekle
        const updateData: any = {};

        if (!soruData.createdAt) updateData.createdAt = new Date();
        if (!soruData.updatedAt) updateData.updatedAt = new Date();
        if (!soruData.status) updateData.status = "active";

        if (Object.keys(updateData).length > 0) {
          batch.update(soruDoc.ref, updateData);
          results.push({
            id: soruId,
            action: "metadata_added",
            fields: Object.keys(updateData),
          });
          console.log(`Metadata eklendi: ${soruId}`, updateData);
        } else {
          results.push({ id: soruId, action: "already_complete" });
          console.log(`Soru zaten tam: ${soruId}`);
        }
      }
    }

    // Batch işlemini commit et
    await batch.commit();

    console.log(
      `${denemeId} denemesi sorular backfill işlemi tamamlandı:`,
      results
    );

    res.status(200).json({
      success: true,
      message: "Sorular backfill işlemi başarıyla tamamlandı",
      denemeId,
      results: results,
      totalProcessed: results.length,
      created: results.filter((r) => r.action === "created_or_updated").length,
      updated: results.filter((r) => r.action === "updated").length,
      alreadyComplete: results.filter((r) => r.action === "already_complete")
        .length,
    });
  } catch (error) {
    console.error("Sorular backfill işlemi hatası:", error);
    res.status(500).json({
      success: false,
      error: "Sorular backfill işlemi başarısız",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
