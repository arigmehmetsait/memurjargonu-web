import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminStorage } from "@/lib/firebaseAdmin";
import formidable from "formidable";
import fs from "fs";

// Next.js'in default body parser'ını devre dışı bırak
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Admin - PDF Dosya Yükleme Endpoint (Sadece dosya yükleme, veritabanına kaydetmez)
 * POST /api/admin/content/upload-file
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

    // Firebase Storage'a dosya yükleme
    const fileName = `pdf_${Date.now()}_${uploadedFile.originalFilename}`;
    const fileSize = uploadedFile.size;
    const storagePath = `pdfs/${fileName}`;

    // Firebase Storage bucket'ını al
    const storageBucket =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      "kpssapp-7cc8b.appspot.com";
    const bucket = adminStorage.bucket(storageBucket);
    const file = bucket.file(storagePath);

    // Dosyayı Firebase Storage'a yükle
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: "application/pdf",
      },
    });

    // Dosyayı public yap
    await file.makePublic();

    // Token içeren URL'i al
    const [metadata] = await file.getMetadata();
    const token = metadata.metadata?.firebaseStorageDownloadTokens;

    // Token içeren URL oluştur
    const pdfUrl = token
      ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`
      : `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(storagePath)}?alt=media`;

    // Geçici dosyayı temizle
    fs.unlinkSync(uploadedFile.filepath);

    res.status(200).json({
      success: true,
      data: {
        downloadUrl: pdfUrl,
        fileName: fileName,
        fileSize: fileSize,
      },
    });
  } catch (error) {
    console.error("PDF file upload API error:", error);
    res.status(500).json({
      error: "PDF yüklenirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

