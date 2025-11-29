import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { denemeId } = req.query;

  if (!denemeId || typeof denemeId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Deneme ID gerekli",
    });
  }

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

    // Alt koleksiyonları listele
    const collections = await denemeDoc.ref.listCollections();
    
    // Her koleksiyonun soru sayısını al
    const collectionsWithCount = await Promise.all(
      collections.map(async (collection) => {
        const snapshot = await collection.get();
        return {
          id: collection.id,
          name: collection.id,
          soruSayisi: snapshot.size,
        };
      })
    );

    // İsme göre sırala
    collectionsWithCount.sort((a, b) => a.name.localeCompare(b.name, "tr"));

    res.status(200).json({
      success: true,
      data: {
        denemeId,
        denemeName: denemeDoc.data()?.name || denemeId,
        collections: collectionsWithCount,
      },
    });
  } catch (error) {
    console.error("Alt koleksiyonlar alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Alt koleksiyonlar alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

