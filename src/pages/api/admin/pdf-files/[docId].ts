import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { docId } = req.query;

  if (!docId || typeof docId !== "string") {
    return res.status(400).json({ error: "docId gerekli" });
  }

  try {
    // Authorization header kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Yetki token'i bulunamadı" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Token doğrulama
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: "Geçersiz token" });
    }

    // Admin yetkisi kontrolü
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({ error: "Admin yetkisi gerekli" });
    }

    const docRef = adminDb.collection("pdfFiles").doc(docId);

    switch (req.method) {
      case "GET":
        const doc = await docRef.get();
        if (!doc.exists) {
          return res.status(404).json({ error: "PDF dosyası bulunamadı" });
        }
        return res.status(200).json({
          success: true,
          data: {
            id: doc.id,
            ...doc.data(),
          },
        });

      case "PUT":
        const { title, pdfUrl, video, questions } = req.body;

        const updateData: Record<string, any> = {
          updatedAt: new Date(),
        };

        if (title !== undefined) updateData.title = title.trim();
        if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl.trim();
        if (video !== undefined) updateData.video = video.trim();
        if (questions !== undefined) updateData.questions = questions;

        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        return res.status(200).json({
          success: true,
          data: {
            id: updatedDoc.id,
            ...updatedDoc.data(),
          },
        });

      case "DELETE":
        await docRef.delete();
        return res.status(200).json({
          success: true,
          message: "PDF dosyası silindi",
        });

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("PDF File API error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem gerçekleştirilirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

