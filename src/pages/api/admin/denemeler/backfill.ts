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
    console.log("Denemeler backfill işlemi başlatılıyor...");

    // Mevcut deneme ID'lerini manuel olarak belirt
    // Bu listeyi Firebase Console'dan kontrol ederek güncelleyebilirsiniz
    const denemeIds = [
      "Deneme 1",
      "Deneme 2",
      "Deneme 3",
      "Deneme 4",
      "Deneme 5",
      "Deneme 6",
      "Deneme 7",
      "Deneme 8",
      "Deneme 9",
      "Deneme 10",
      "Deneme 11",
      "Deneme 12",
      "Deneme 13",
      "Deneme 14",
      "Deneme 15",
      "Deneme 16",
      "Deneme 17",
      "Deneme 18",
      "Deneme 19",
      "Deneme 20",
      "Deneme 21",
      "Deneme 22",
    ];

    const batch = adminDb.batch();
    const results = [];

    for (const id of denemeIds) {
      const ref = adminDb.collection("MevzuatDeneme").doc(id);

      // Önce dokümanın var olup olmadığını kontrol et
      const docSnapshot = await ref.get();

      if (!docSnapshot.exists) {
        // Doküman yoksa oluştur
        batch.set(
          ref,
          {
            name: id,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "active",
          },
          { merge: true }
        );

        results.push({ id, action: "created" });
        console.log(`Deneme oluşturuldu: ${id}`);
      } else {
        // Doküman varsa sadece gerekli alanları ekle
        const data = docSnapshot.data();
        const updateData: any = {};

        if (!data?.name) updateData.name = id;
        if (!data?.createdAt) updateData.createdAt = new Date();
        if (!data?.updatedAt) updateData.updatedAt = new Date();
        if (!data?.status) updateData.status = "active";

        if (Object.keys(updateData).length > 0) {
          batch.update(ref, updateData);
          results.push({
            id,
            action: "updated",
            fields: Object.keys(updateData),
          });
          console.log(`Deneme güncellendi: ${id}`, updateData);
        } else {
          results.push({ id, action: "already_exists" });
          console.log(`Deneme zaten mevcut: ${id}`);
        }
      }
    }

    // Batch işlemini commit et
    await batch.commit();

    console.log("Backfill işlemi tamamlandı:", results);

    res.status(200).json({
      success: true,
      message: "Backfill işlemi başarıyla tamamlandı",
      results: results,
      totalProcessed: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      alreadyExists: results.filter((r) => r.action === "already_exists")
        .length,
    });
  } catch (error) {
    console.error("Backfill işlemi hatası:", error);
    res.status(500).json({
      success: false,
      error: "Backfill işlemi başarısız",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
