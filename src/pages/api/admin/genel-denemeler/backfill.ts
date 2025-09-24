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
    console.log("Güncel Bilgiler Denemeler backfill işlemi başlatılıyor...");

    // Önce mevcut denemeleri kontrol et
    const denemelerSnapshot = await adminDb.collection("denemeler").get();
    console.log(`Mevcut genel deneme sayısı: ${denemelerSnapshot.size}`);

    // Tüm denemeleri listele
    const existingDenemeler = denemelerSnapshot.docs.map((doc) => doc.id);
    console.log("Mevcut denemeler:", existingDenemeler);

    // Backfill için deneme listesi (Firebase konsolundan görünen denemeler)
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
      "Deneme 23",
      "Deneme 24",
      "Deneme 25",
      "Deneme 26",
      "Deneme 27",
      "Deneme 28",
      "Deneme 29",
      "Deneme 30",
      "Deneme 31",
      "Deneme 32",
      "Deneme 33",
      "Deneme 34",
      "Deneme 35",
      "Deneme 36",
      "Deneme 37",
      "Deneme 38",
      "Deneme 39",
      "Deneme 40",
      "Deneme 41",
      "Deneme 42",
      "Deneme 43",
      "Deneme 44",
      "Deneme 45",
      "Deneme 46",
      "Deneme 47",
      "Deneme 48",
      "Deneme 49",
      "Deneme 50",
      "Deneme 51",
      "Deneme 52",
      "Deneme 53",
      "Deneme 54",
      "Deneme 55",
      "Deneme 56",
      "Deneme 57",
      "Deneme 58",
      "Deneme 59",
      "Deneme 60",
      "Deneme 61",
      "Deneme 62",
      "Deneme 63",
      "Deneme 64",
      "Deneme 65",
      "Deneme 66",
      "Deneme 67",
      "Deneme 68",
      "Deneme 69",
      "Deneme 70",
      "Deneme 71",
      "Deneme 72",
      "Deneme 73",
      "Deneme 74",
      "Deneme 75",
      "Deneme 76",
      "Deneme 77",
      "Deneme 78",
      "Deneme 79",
      "Deneme 80",
      "Deneme 81",
      "Deneme 82",
      "Deneme 83",
      "Deneme 84",
      "Deneme 85",
      "Deneme 86",
      "Deneme 87",
      "Deneme 88",
      "Deneme 89",
      "Deneme 90",
      "Deneme 91",
      "Deneme 92",
      "Deneme 93",
      "Deneme 94",
      "Deneme 95",
      "Deneme 96",
      "Deneme 97",
      "Deneme 98",
      "Deneme 99",
      "Deneme 100",
    ];

    const batch = adminDb.batch();
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (const denemeId of denemeIds) {
      try {
        const denemeRef = adminDb.collection("denemeler").doc(denemeId);
        const denemeDoc = await denemeRef.get();

        if (denemeDoc.exists) {
          // Doküman var, eksik field'ları ekle
          const data = denemeDoc.data();
          const updates: any = {};

          if (!data?.name) {
            updates.name = denemeId;
          }
          if (!data?.createdAt) {
            updates.createdAt = new Date();
          }
          if (!data?.updatedAt) {
            updates.updatedAt = new Date();
          }
          if (!data?.status) {
            updates.status = "active";
          }

          if (Object.keys(updates).length > 0) {
            batch.update(denemeRef, updates);
            updatedCount++;
            console.log(`${denemeId} güncelleniyor:`, updates);
          }
        } else {
          // Doküman yok, yeni oluştur
          batch.set(denemeRef, {
            name: denemeId,
            description: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "active",
            soruSayisi: 0,
          });
          createdCount++;
          console.log(`${denemeId} oluşturuluyor`);
        }

        processedCount++;
      } catch (error) {
        console.error(`${denemeId} işlenirken hata:`, error);
      }
    }

    // Batch işlemini uygula
    if (processedCount > 0) {
      await batch.commit();
      console.log(`Backfill tamamlandı: ${processedCount} deneme işlendi`);
    }

    res.status(200).json({
      success: true,
      message: "Güncel Bilgiler Denemeler backfill işlemi tamamlandı",
      data: {
        processedCount,
        createdCount,
        updatedCount,
        existingCount: existingDenemeler.length,
      },
    });
  } catch (error) {
    console.error("Güncel Bilgiler Denemeler backfill hatası:", error);
    res.status(500).json({
      success: false,
      error: "Backfill işlemi başarısız",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
