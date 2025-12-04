import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { packageService } from "@/services/packageService";
import { PackageType, RemovePackageRequest } from "@/types/package";
import { isValidPackageType } from "@/constants/packages";

/**
 * Kullanıcıdan paket kaldırma API'si
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Admin yetkisi kontrolü
    const idToken = (req.headers.authorization || "").replace("Bearer ", "");
    if (!idToken) return res.status(401).json({ error: "No token" });

    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded?.admin) {
      return res.status(403).json({ error: "not admin" });
    }

    const { userId, packageType } = req.body as RemovePackageRequest;

    // Validasyon
    if (!userId || !packageType) {
      return res.status(400).json({
        error: "userId ve packageType gerekli",
      });
    }

    if (!isValidPackageType(packageType)) {
      return res.status(400).json({
        error: "Geçersiz paket türü",
      });
    }

    // Paket kaldırma işlemi
    const result = await packageService.removePackage({
      userId,
      packageType: packageType as PackageType,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.message,
      });
    }

    // Custom claims güncelle (KPSS Full paket için)
    if (packageType === PackageType.KPSS_FULL) {
      // Mevcut claims'leri al ve koru (özellikle admin claim'ini)
      // ÖNEMLİ: userRecord'u paket silme işleminden ÖNCE alıyoruz
      // çünkü paket silme işlemi sırasında custom claims değişebilir
      const userRecord = await adminAuth.getUser(userId);
      const existingClaims = userRecord.customClaims || {};

      // Admin claim'ini özellikle koru
      const newClaims: {
        premium: boolean | null;
        premiumExp: number;
        admin?: boolean;
        [key: string]: any;
      } = {
        ...existingClaims, // Tüm mevcut claims'leri koru
        premium: false,
        premiumExp: Date.now(),
      };

      // Eğer kullanıcı seed listesindeyse, admin claim'ini zorunlu olarak ekle
      const seedUids = (process.env.ADMIN_SEED_UIDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (seedUids.includes(userId)) {
        newClaims.admin = true;
      }

      await adminAuth.setCustomUserClaims(userId, newClaims);
      // Not: revokeRefreshTokens çağrılmıyor çünkü kullanıcıyı otomatik çıkış yaptırır
      // Custom claims değişiklikleri bir sonraki token yenilemede otomatik yansıyacak
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Remove package API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
