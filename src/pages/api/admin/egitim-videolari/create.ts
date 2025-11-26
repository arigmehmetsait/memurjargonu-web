import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Token doğrulama
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Admin yetkisi kontrolü
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({ error: "Admin yetkisi gerekli" });
    }

    const { docId } = req.body;

    if (!docId || !docId.trim()) {
      return res.status(400).json({
        success: false,
        error: "Doküman ID gereklidir",
      });
    }

    // Doküman ID'yi temizle
    const cleanDocId = docId.trim().toLowerCase();

    // Dokümanın zaten var olup olmadığını kontrol et
    const existingDoc = await adminDb
      .collection("EgitimVideos")
      .doc(cleanDocId)
      .get();

    if (existingDoc.exists) {
      return res.status(400).json({
        success: false,
        error: "Bu ID'ye sahip bir doküman zaten mevcut",
      });
    }

    // Yeni doküman oluştur
    const docData = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("EgitimVideos").doc(cleanDocId).set(docData);

    console.log(`Eğitim videosu dokümanı oluşturuldu: ${cleanDocId}`);

    res.status(201).json({
      success: true,
      data: {
        id: cleanDocId,
        ...docData,
      },
      message: "Eğitim videosu dokümanı başarıyla oluşturuldu",
    });
  } catch (error) {
    console.error("Eğitim videosu dokümanı oluşturma hatası:", error);
    return res.status(500).json({
      success: false,
      error: "Eğitim videosu dokümanı oluşturulamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

