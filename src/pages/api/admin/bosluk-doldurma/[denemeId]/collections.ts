import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

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

  if (req.method === "POST") {
    // Yeni koleksiyon oluştur
    try {
      const { collectionName } = req.body;

      if (!collectionName || typeof collectionName !== "string" || !collectionName.trim()) {
        return res.status(400).json({
          success: false,
          error: "Koleksiyon adı gereklidir",
        });
      }

      const cleanCollectionName = collectionName.trim();

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

      // Koleksiyonun zaten var olup olmadığını kontrol et
      const collections = await denemeDoc.ref.listCollections();
      const existingCollection = collections.find((col) => col.id === cleanCollectionName);

      if (existingCollection) {
        return res.status(409).json({
          success: false,
          error: "Bu isimde bir koleksiyon zaten mevcut",
        });
      }

      // Yeni koleksiyon oluştur (metadata dokümanı ekleyerek)
      // Firebase'de koleksiyonlar otomatik oluşur, ancak boş koleksiyonlar görünmez
      // Bu yüzden bir metadata dokümanı ekliyoruz ve bırakıyoruz
      await denemeDoc.ref
        .collection(cleanCollectionName)
        .doc("_metadata")
        .set({
          _created: new Date(),
          _type: "collection_metadata",
          _empty: true,
        });

      console.log(`Yeni koleksiyon oluşturuldu: ${denemeId}/${cleanCollectionName}`);

      res.status(201).json({
        success: true,
        message: "Koleksiyon başarıyla oluşturuldu",
        data: {
          id: cleanCollectionName,
          name: cleanCollectionName,
          soruSayisi: 0,
        },
      });
    } catch (error) {
      console.error("Koleksiyon oluşturma hatası:", error);
      res.status(500).json({
        success: false,
        error: "Koleksiyon oluşturulamadı",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

