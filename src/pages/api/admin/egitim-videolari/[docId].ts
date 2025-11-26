import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    const { docId } = req.query;

    if (!docId || typeof docId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Doküman ID gerekli",
      });
    }

    const docRef = adminDb.collection("EgitimVideos").doc(docId);

    // GET - Dokümanı getir
    if (req.method === "GET") {
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doküman bulunamadı",
        });
      }

      const data = doc.data();
      const videoKeys = Object.keys(data || {}).filter(
        (key) => key !== "createdAt" && key !== "updatedAt"
      );

      // Her video için detayları getir
      const videos = videoKeys.map((key) => ({
        id: key,
        ...(data?.[key] || {}),
      }));

      return res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          videos,
          ...data,
        },
      });
    }

    // DELETE - Dokümanı sil
    if (req.method === "DELETE") {
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doküman bulunamadı",
        });
      }

      await docRef.delete();

      console.log(`Eğitim videosu dokümanı silindi: ${docId}`);

      return res.status(200).json({
        success: true,
        message: "Doküman başarıyla silindi",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Eğitim videosu dokümanı işlemi hatası:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem sırasında hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

