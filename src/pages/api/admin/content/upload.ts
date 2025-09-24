import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { PDFService } from "@/services/pdfService";
import {
  PDFDocumentRequest,
  PDFCategory,
  PDFSubcategory,
  PDFStatus,
} from "@/types/pdf";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Next.js'in default body parser'ını devre dışı bırak
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Admin - PDF Upload Endpoint
 * POST /api/admin/content/upload
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

    // Form verilerini parse et
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filter: ({ mimetype }) => {
        return mimetype === "application/pdf";
      },
    });

    const [fields, files] = await form.parse(req);

    // Dosya kontrolü
    const uploadedFile = Array.isArray(files.pdfFile)
      ? files.pdfFile[0]
      : files.pdfFile;
    if (!uploadedFile) {
      return res.status(400).json({ error: "PDF dosyası bulunamadı" });
    }

    // Form verilerini validate et
    const getFieldValue = (field: string | string[] | undefined): string => {
      if (Array.isArray(field)) return field[0] || "";
      return field || "";
    };

    const pdfRequest: PDFDocumentRequest = {
      title: getFieldValue(fields.title),
      description: getFieldValue(fields.description),
      category: getFieldValue(fields.category) as PDFCategory,
      subcategory: getFieldValue(fields.subcategory) as PDFSubcategory,
      visibleInPackages: getFieldValue(fields.visibleInPackages)
        .split(",")
        .filter((p) => p.trim()),
      isPremiumOnly: getFieldValue(fields.isPremiumOnly) === "true",
      sortOrder: parseInt(getFieldValue(fields.sortOrder)) || 1,
      tags: getFieldValue(fields.tags)
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      status: getFieldValue(fields.status) as PDFStatus,
    };

    // Validation
    if (!pdfRequest.title.trim()) {
      return res.status(400).json({ error: "Başlık zorunludur" });
    }
    if (!pdfRequest.category || !pdfRequest.subcategory) {
      return res.status(400).json({ error: "Kategori bilgileri zorunludur" });
    }
    if (pdfRequest.visibleInPackages.length === 0) {
      return res
        .status(400)
        .json({ error: "En az bir paket seçmeniz gerekir" });
    }

    // TODO: Firebase Storage'a dosya yükleme
    // Şimdilik local storage simülasyonu
    const fileName = `pdf_${Date.now()}_${uploadedFile.originalFilename}`;
    const fileSize = uploadedFile.size;

    // Mock PDF URL - gerçekte Firebase Storage URL'i olacak
    const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/your-bucket/o/pdfs%2F${fileName}?alt=media`;

    // TODO: Gerçek Firebase Storage implementasyonu
    /*
    import { admin } from "@/lib/firebaseAdmin";
    
    const bucket = admin.storage().bucket();
    const file = bucket.file(`pdfs/${fileName}`);
    
    const stream = file.createWriteStream({
      metadata: {
        contentType: "application/pdf",
      },
    });
    
    const uploadPromise = new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', async () => {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/pdfs/${fileName}`;
        resolve(publicUrl);
      });
    });
    
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    stream.end(fileBuffer);
    
    const pdfUrl = await uploadPromise;
    */

    // PDF'i veritabanına kaydet
    const pdfService = new PDFService();
    const result = await pdfService.addPDF(
      pdfRequest,
      pdfUrl,
      fileName,
      fileSize,
      decodedToken.uid
    );

    // Geçici dosyayı temizle
    fs.unlinkSync(uploadedFile.filepath);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("PDF upload API error:", error);
    res.status(500).json({
      error: "PDF yüklenirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
