import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

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
        .collection("boslukdoldurma")
        .doc(denemeId)
        .get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Boşluk Doldurma denemesi bulunamadı",
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
        batch.set(newCollectionRef.doc(doc.id), doc.data());
        batch.delete(oldCollectionRef.doc(doc.id));
      });

      // Konu adını boslukdoldurmaTopics içinde de güncelle
      try {
        let denemeName = denemeDoc.data()?.name;
        
        // Deneme ismi yoksa ID'den bul
        if (!denemeName || !denemeName.trim()) {
          const idStr = typeof denemeId === "string" ? denemeId : "";
          if (idStr.startsWith("bosluk-")) {
            const namePart = idStr.replace(/^bosluk-/, "").replace(/-\d+$/, "");
            const nameMap: Record<string, string> = {
              cografya: "Coğrafya",
              tarih: "Tarih",
              vatandaslik: "Vatandaşlık",
              "guncel-bilgiler": "Güncel Bilgiler",
            };
            denemeName = nameMap[namePart] || namePart
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          } else {
             const nameMap: Record<string, string> = {
              cografya: "Coğrafya",
              tarih: "Tarih",
              vatandaslik: "Vatandaşlık",
              "guncel-bilgiler": "Güncel Bilgiler",
            };
            denemeName = nameMap[idStr] || idStr.charAt(0).toUpperCase() + idStr.slice(1);
          }
        }

        if (denemeName && denemeName.trim()) {
          const topicDocRef = adminDb.collection("boslukdoldurmaTopics").doc(denemeName.trim());
          const topicDoc = await topicDocRef.get();
          
          if (topicDoc.exists) {
             const data = topicDoc.data();
             const topics = data?.topics || [];
             
             // Listede eski ismi ara
             const oldIndex = topics.indexOf(collectionId);
             if (oldIndex !== -1) {
               // Bulunduysa değiştir
               const newTopics = [...topics];
               newTopics[oldIndex] = cleanNewName;
               batch.update(topicDocRef, { topics: newTopics });
             } else {
               // Bulunamadıysa (belki manuel silindi vs) yeni ismi ekle
               batch.update(topicDocRef, { topics: FieldValue.arrayUnion(cleanNewName) });
             }
          }
        }
      } catch (topicError) {
        console.error("Konu güncelleme hatası:", topicError);
      }

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
        .collection("boslukdoldurma")
        .doc(denemeId)
        .get();

      if (!denemeDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Boşluk Doldurma denemesi bulunamadı",
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

      // Konuyu boslukdoldurmaTopics koleksiyonundan sil
      try {
        let denemeName = denemeDoc.data()?.name;
        
        // Eğer name alanı yoksa, deneme ID'sinden isim çıkar
        if (!denemeName || !denemeName.trim()) {
          const idStr = typeof denemeId === "string" ? denemeId : "";
          if (idStr.startsWith("bosluk-")) {
            const namePart = idStr.replace(/^bosluk-/, "").replace(/-\d+$/, "");
            const nameMap: Record<string, string> = {
              cografya: "Coğrafya",
              tarih: "Tarih",
              vatandaslik: "Vatandaşlık",
              "guncel-bilgiler": "Güncel Bilgiler",
            };
            denemeName = nameMap[namePart] || namePart
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          } else {
             const nameMap: Record<string, string> = {
              cografya: "Coğrafya",
              tarih: "Tarih",
              vatandaslik: "Vatandaşlık",
              "guncel-bilgiler": "Güncel Bilgiler",
            };
            denemeName = nameMap[idStr] || idStr.charAt(0).toUpperCase() + idStr.slice(1);
          }
        }

        if (denemeName && denemeName.trim()) {
          const topicDocRef = adminDb.collection("boslukdoldurmaTopics").doc(denemeName.trim());
          const topicDoc = await topicDocRef.get();
          if (topicDoc.exists) {
            batch.update(topicDocRef, {
              topics: FieldValue.arrayRemove(collectionId)
            });
          }
        }
      } catch (topicError) {
        console.error("Konu silme hatası:", topicError);
        // Ana silme işlemi devam etsin
      }

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

