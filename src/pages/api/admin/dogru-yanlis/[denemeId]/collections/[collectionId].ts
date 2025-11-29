import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { denemeId, collectionId } = req.query;

  if (!denemeId || typeof denemeId !== "string" || !collectionId || typeof collectionId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Deneme ID ve Koleksiyon ID gerekli",
    });
  }

  if (req.method === "PUT") {
    // Koleksiyon adını güncelle (tüm dokümanları yeni koleksiyona taşı)
    try {
      const { newCollectionName } = req.body;

      if (!newCollectionName || typeof newCollectionName !== "string" || !newCollectionName.trim()) {
        return res.status(400).json({
          success: false,
          error: "Yeni koleksiyon adı gereklidir",
        });
      }

      const cleanNewName = newCollectionName.trim();

      if (cleanNewName === collectionId) {
        return res.status(400).json({
          success: false,
          error: "Yeni ad eski adla aynı olamaz",
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

      // Eski koleksiyonun var olup olmadığını kontrol et
      const oldCollectionRef = denemeDoc.ref.collection(collectionId);
      const oldCollectionSnapshot = await oldCollectionRef.get();

      if (oldCollectionSnapshot.empty) {
        return res.status(404).json({
          success: false,
          error: "Koleksiyon bulunamadı",
        });
      }

      // Yeni koleksiyonun zaten var olup olmadığını kontrol et
      const collections = await denemeDoc.ref.listCollections();
      const existingCollection = collections.find((col) => col.id === cleanNewName);

      if (existingCollection) {
        return res.status(409).json({
          success: false,
          error: "Bu isimde bir koleksiyon zaten mevcut",
        });
      }

      // Tüm dokümanları yeni koleksiyona taşı
      const batch = adminDb.batch();
      const newCollectionRef = denemeDoc.ref.collection(cleanNewName);

      oldCollectionSnapshot.docs.forEach((doc) => {
        batch.set(newCollectionRef.doc(doc.id), doc.data());
        batch.delete(oldCollectionRef.doc(doc.id));
      });

      await batch.commit();

      console.log(`Koleksiyon yeniden adlandırıldı: ${denemeId}/${collectionId} -> ${cleanNewName}`);

      res.status(200).json({
        success: true,
        message: "Koleksiyon başarıyla güncellendi",
        data: {
          oldId: collectionId,
          newId: cleanNewName,
          soruSayisi: oldCollectionSnapshot.size,
        },
      });
    } catch (error) {
      console.error("Koleksiyon güncelleme hatası:", error);
      res.status(500).json({
        success: false,
        error: "Koleksiyon güncellenemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  } else if (req.method === "DELETE") {
    // Koleksiyonu sil (tüm dokümanları sil)
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

      // Koleksiyonun var olup olmadığını kontrol et
      const collectionRef = denemeDoc.ref.collection(collectionId);
      const collectionSnapshot = await collectionRef.get();

      if (collectionSnapshot.empty) {
        return res.status(404).json({
          success: false,
          error: "Koleksiyon bulunamadı",
        });
      }

      const soruSayisi = collectionSnapshot.size;

      // Tüm dokümanları sil
      const batch = adminDb.batch();
      collectionSnapshot.docs.forEach((doc) => {
        batch.delete(collectionRef.doc(doc.id));
      });

      await batch.commit();

      console.log(`Koleksiyon silindi: ${denemeId}/${collectionId} (${soruSayisi} soru silindi)`);

      res.status(200).json({
        success: true,
        message: "Koleksiyon başarıyla silindi",
        data: {
          collectionId,
          deletedQuestionsCount: soruSayisi,
        },
      });
    } catch (error) {
      console.error("Koleksiyon silme hatası:", error);
      res.status(500).json({
        success: false,
        error: "Koleksiyon silinemedi",
        details: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

