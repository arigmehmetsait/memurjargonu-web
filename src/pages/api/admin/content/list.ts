import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { PDFService } from "@/services/pdfService";
import { PDFSubcategory, PDFStatus } from "@/types/pdf";

/**
 * Admin - PDF Listesi Endpoint
 * GET /api/admin/content/list
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

    // Query parametrelerini al
    const {
      query,
      subcategory,
      status,
      isPremiumOnly,
      packageFilter,
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = "20",
      offset = "0",
    } = req.query;

    // Parametreleri validate et
    const searchParams = {
      query: query as string,
      subcategory: subcategory ? (subcategory as PDFSubcategory) : undefined,
      status: status ? (status as PDFStatus) : undefined,
      isPremiumOnly:
        isPremiumOnly === "true"
          ? true
          : isPremiumOnly === "false"
          ? false
          : undefined,
      packageFilter: packageFilter as string,
      sortBy: sortBy as "title" | "createdAt" | "updatedAt" | "sortOrder",
      sortOrder: sortOrder as "asc" | "desc",
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0,
    };

    // Limit kontrolü
    if (searchParams.limit > 100) {
      return res.status(400).json({ error: "Limit 100'den fazla olamaz" });
    }

    // PDF'leri getir
    const pdfService = new PDFService();
    const result = await pdfService.searchPDFs(searchParams);

    res.status(200).json(result);
  } catch (error) {
    console.error("PDF list API error:", error);
    res.status(500).json({
      error: "PDF'ler alınırken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
