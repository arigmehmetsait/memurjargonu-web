import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // boslukdoldurma koleksiyonundan tüm dokümanları getir
    const boslukdoldurmaSnapshot = await adminDb
      .collection("boslukdoldurma")
      .get();

    const denemeler = boslukdoldurmaSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name || doc.id,
        description: data.description || "",
        soruSayisi: data.soruSayisi || 0,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        status: data.status || "active",
      };
    });

    // Alt koleksiyonları ve soru sayılarını hesapla
    const denemelerWithCollections = await Promise.all(
      denemeler.map(async (deneme) => {
        try {
          const denemeRef = adminDb.collection("boslukdoldurma").doc(deneme.id);
          
          // Alt koleksiyonları listele
          const collections = await denemeRef.listCollections();
          
          // Her koleksiyonun soru sayısını al (metadata dokümanını hariç tut)
          const collectionsWithCount = await Promise.all(
            collections.map(async (collection) => {
              const snapshot = await collection.get();
              // Metadata dokümanını saymadan soru sayısını hesapla
              const soruSayisi = snapshot.docs.filter(
                (doc) => doc.id !== "_metadata"
              ).length;
              return {
                id: collection.id,
                name: collection.id,
                soruSayisi,
              };
            })
          );
          
          // Toplam soru sayısını hesapla
          const toplamSoruSayisi = collectionsWithCount.reduce(
            (sum, col) => sum + col.soruSayisi,
            0
          );

          return {
            ...deneme,
            soruSayisi: toplamSoruSayisi,
            collections: collectionsWithCount,
          };
        } catch (error) {
          console.error(`${deneme.id} alt koleksiyonları alınırken hata:`, error);
          return {
            ...deneme,
            collections: [],
          };
        }
      })
    );

    // İsme göre sırala
    denemelerWithCollections.sort((a, b) => a.name.localeCompare(b.name, "tr"));

    console.log(
      `Boşluk Doldurma denemeleri hazırlandı: ${denemelerWithCollections.length} deneme`
    );

    res.status(200).json({
      success: true,
      data: denemelerWithCollections,
    });
  } catch (error) {
    console.error("Boşluk Doldurma denemeleri listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Boşluk Doldurma denemeleri listesi alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
