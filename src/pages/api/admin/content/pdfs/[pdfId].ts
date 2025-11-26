import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { adminDb } from "@/lib/firebaseAdmin";
import { PDFSubcategory } from "@/types/pdf";
import { getFirebaseCollectionName } from "@/constants/pdfCategories";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { pdfId, subcategory } = req.query;

  if (!pdfId || typeof pdfId !== "string") {
    return res.status(400).json({ error: "pdfId gerekli" });
  }

  if (!subcategory || typeof subcategory !== "string") {
    return res.status(400).json({ error: "subcategory gerekli" });
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

    const collectionName = getFirebaseCollectionName(
      subcategory as PDFSubcategory
    );
    const docRef = adminDb.collection(collectionName).doc(pdfId);

    if (req.method === "GET") {
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
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("PDF API error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem gerçekleştirilirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

