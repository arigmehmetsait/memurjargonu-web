import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { PDFService } from "@/services/pdfService";

/**
 * Admin - PDF İstatistikleri Endpoint
 * GET /api/admin/content/stats
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
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

    // PDF istatistiklerini getir
    const pdfService = new PDFService();
    const stats = await pdfService.getStats();

    res.status(200).json(stats);
  } catch (error) {
    console.error("PDF stats API error:", error);
    res.status(500).json({
      error: "İstatistikler alınırken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
