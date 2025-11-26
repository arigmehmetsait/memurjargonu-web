import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

    const { title, pdfUrl, video, questions } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Başlık zorunludur" });
    }

    if (!pdfUrl || !pdfUrl.trim()) {
      return res.status(400).json({ error: "PDF URL zorunludur" });
    }

    // Yeni PDF dosyası oluştur
    const newPdfFile = {
      title: title.trim(),
      pdfUrl: pdfUrl.trim(),
      video: video?.trim() || "",
      questions: questions || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("pdfFiles").add(newPdfFile);

    return res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newPdfFile,
      },
    });
  } catch (error) {
    console.error("PDF File create API error:", error);
    return res.status(500).json({
      success: false,
      error: "PDF dosyası oluşturulurken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

