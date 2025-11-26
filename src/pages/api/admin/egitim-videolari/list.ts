import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
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

    // EgitimVideos koleksiyonunu getir
    const snapshot = await adminDb.collection("EgitimVideos").get();

    const documents = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Her dokümandaki video sayısını say
        const videoKeys = Object.keys(data).filter(
          (key) => key !== "createdAt" && key !== "updatedAt"
        );

        return {
          id: doc.id,
          name: doc.id,
          videoCount: videoKeys.length,
          videos: videoKeys,
          ...data,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Eğitim videoları listesi yüklenirken hata:", error);
    return res.status(500).json({
      success: false,
      error: "Eğitim videoları yüklenirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

