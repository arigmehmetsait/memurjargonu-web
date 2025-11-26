import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { PDFService } from "@/services/pdfService";
import {
  PDFDocumentRequest,
  PDFCategory,
  PDFSubcategory,
  PDFStatus,
} from "@/types/pdf";

/**
 * Admin - PDF Oluşturma Endpoint (Dosya yüklemeden, sadece metadata ve URL ile)
 * POST /api/admin/content/create-pdf
 */
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

    const {
      title,
      description,
      category,
      subcategory,
      pdfUrl,
      fileName,
      fileSize,
      visibleInPackages,
      isPremiumOnly,
      sortOrder,
      tags,
      status,
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Başlık zorunludur" });
    }

    if (!category || !subcategory) {
      return res.status(400).json({ error: "Kategori bilgileri zorunludur" });
    }

    if (!pdfUrl || !pdfUrl.trim()) {
      return res.status(400).json({ error: "PDF URL zorunludur" });
    }

    if (!Array.isArray(visibleInPackages) || visibleInPackages.length === 0) {
      return res
        .status(400)
        .json({ error: "En az bir paket seçmeniz gerekir" });
    }

    const pdfRequest: PDFDocumentRequest = {
      title: title.trim(),
      description: description?.trim() || "",
      category: category as PDFCategory,
      subcategory: subcategory as PDFSubcategory,
      visibleInPackages: visibleInPackages,
      isPremiumOnly: isPremiumOnly || false,
      sortOrder: sortOrder || 1,
      tags: tags || [],
      status: (status as PDFStatus) || PDFStatus.DRAFT,
    };

    // PDF'i veritabanına kaydet
    const pdfService = new PDFService();
    const result = await pdfService.addPDF(
      pdfRequest,
      pdfUrl.trim(),
      fileName || pdfUrl.split("/").pop() || "imported.pdf",
      fileSize || 0,
      decodedToken.uid
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("PDF create API error:", error);
    res.status(500).json({
      error: "PDF oluşturulurken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

