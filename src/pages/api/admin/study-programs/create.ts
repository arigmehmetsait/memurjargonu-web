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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({ error: "Admin yetkisi gerekli" });
    }

    const { programId } = req.body;

    if (!programId || !programId.trim()) {
      return res.status(400).json({
        success: false,
        error: "Program ID gereklidir",
      });
    }

    const cleanId = programId.trim().toLowerCase();

    const existingDoc = await adminDb
      .collection("studyPrograms")
      .doc(cleanId)
      .get();

    if (existingDoc.exists) {
      return res.status(400).json({
        success: false,
        error: "Bu ID'ye sahip bir program zaten mevcut",
      });
    }

    const programData = {
      days: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("studyPrograms").doc(cleanId).set(programData);

    return res.status(201).json({
      success: true,
      data: {
        id: cleanId,
        ...programData,
      },
      message: "Ders programı başarıyla oluşturuldu",
    });
  } catch (error) {
    console.error("Study program create error:", error);
    return res.status(500).json({
      success: false,
      error: "Ders programı oluşturulamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

