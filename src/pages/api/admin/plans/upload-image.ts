import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminStorage } from "@/lib/firebaseAdmin";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Admin - Plan Resim Yükleme Endpoint
 * POST /api/admin/plans/upload-image
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
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: ({ mimetype }) => {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        return mimetype ? allowedTypes.includes(mimetype) : false;
      },
    });

    const [fields, files] = await form.parse(req);

    // Dosya kontrolü
    const uploadedFile = Array.isArray(files.image)
      ? files.image[0]
      : files.image;
    if (!uploadedFile) {
      return res.status(400).json({ error: "Resim dosyası bulunamadı" });
    }

    // Firebase Storage'a dosya yükleme
    const fileName = `plan_${Date.now()}_${uploadedFile.originalFilename}`;
    const fileSize = uploadedFile.size;
    const storagePath = `plans/${fileName}`;

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
        contentType: uploadedFile.mimetype || "image/jpeg",
      },
    });

    // Dosyayı public yap
    await file.makePublic();

    // Metadata'yı kontrol et ve token'ı al/oluştur
    const [metadata] = await file.getMetadata();
    let downloadToken = metadata.metadata?.firebaseStorageDownloadTokens;

    // Token yoksa oluştur ve ekle
    if (!downloadToken) {
      const { randomUUID } = require("crypto");
      downloadToken = randomUUID();

      // Metadata'yı güncelle (token'ı ekle)
      await file.setMetadata({
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      });
    }

    // Token ile public URL oluştur
    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(
      storagePath
    )}?alt=media&token=${downloadToken}`;

    // Geçici dosyayı temizle
    fs.unlinkSync(uploadedFile.filepath);

    res.status(200).json({
      success: true,
      data: {
        imageUrl: imageUrl,
        fileName: fileName,
        fileSize: fileSize,
      },
    });
  } catch (error) {
    console.error("Plan image upload API error:", error);
    res.status(500).json({
      error: "Resim yüklenirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
