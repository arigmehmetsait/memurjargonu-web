import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { PDFService } from "@/services/pdfService";
import { PDFSubcategory, PDFStatus, PDFDocumentRequest } from "@/types/pdf";

/**
 * Admin - PDF İşlemleri Endpoint
 * PUT /api/admin/content/update - PDF güncelleme
 * DELETE /api/admin/content/delete - PDF silme
 * PATCH /api/admin/content/status - PDF durum değiştirme
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { action } = req.query;

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

    const pdfService = new PDFService();

    switch (action) {
      case "update":
        return handleUpdate(req, res, pdfService, decodedToken.uid);

      case "delete":
        return handleDelete(req, res, pdfService);

      case "status":
        return handleStatusUpdate(req, res, pdfService, decodedToken.uid);

      default:
        return res.status(404).json({ error: "Geçersiz işlem" });
    }
  } catch (error) {
    console.error("PDF action API error:", error);
    res.status(500).json({
      error: "İşlem gerçekleştirilirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

/**
 * PDF güncelleme işlemi
 */
async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  pdfService: PDFService,
  adminUserId: string
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subcategory, pdfId, ...updates } = req.body;

  // Validation
  if (!subcategory || !pdfId) {
    return res.status(400).json({ error: "subcategory ve pdfId zorunludur" });
  }

  if (!Object.values(PDFSubcategory).includes(subcategory)) {
    return res.status(400).json({ error: "Geçersiz subcategory" });
  }

  // Güncelleme verilerini validate et
  const validUpdates: Partial<PDFDocumentRequest> = {};

  if (updates.title !== undefined) validUpdates.title = updates.title;
  if (updates.description !== undefined)
    validUpdates.description = updates.description;
  if (updates.visibleInPackages !== undefined)
    validUpdates.visibleInPackages = updates.visibleInPackages;
  if (updates.isPremiumOnly !== undefined)
    validUpdates.isPremiumOnly = updates.isPremiumOnly;
  if (updates.sortOrder !== undefined)
    validUpdates.sortOrder = updates.sortOrder;
  if (updates.tags !== undefined) validUpdates.tags = updates.tags;
  if (updates.status !== undefined) validUpdates.status = updates.status;

  const result = await pdfService.updatePDF(
    subcategory,
    pdfId,
    validUpdates,
    adminUserId
  );

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
}

/**
 * PDF silme işlemi
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  pdfService: PDFService
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subcategory, pdfId } = req.body;

  // Validation
  if (!subcategory || !pdfId) {
    return res.status(400).json({ error: "subcategory ve pdfId zorunludur" });
  }

  if (!Object.values(PDFSubcategory).includes(subcategory)) {
    return res.status(400).json({ error: "Geçersiz subcategory" });
  }

  const result = await pdfService.deletePDF(subcategory, pdfId);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
}

/**
 * PDF durum güncelleme işlemi
 */
async function handleStatusUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  pdfService: PDFService,
  adminUserId: string
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subcategory, pdfId, status } = req.body;

  // Validation
  if (!subcategory || !pdfId || !status) {
    return res
      .status(400)
      .json({ error: "subcategory, pdfId ve status zorunludur" });
  }

  if (!Object.values(PDFSubcategory).includes(subcategory)) {
    return res.status(400).json({ error: "Geçersiz subcategory" });
  }

  if (!Object.values(PDFStatus).includes(status)) {
    return res.status(400).json({ error: "Geçersiz status" });
  }

  const result = await pdfService.updatePDFStatus(
    subcategory,
    pdfId,
    status,
    adminUserId
  );

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
}
