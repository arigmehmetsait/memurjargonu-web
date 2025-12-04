import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { packageService } from "@/services/packageService";
import { PackageType, ExtendPackageRequest } from "@/types/package";
import { isValidPackageType } from "@/constants/packages";

/**
 * Kullanıcı paket süresini uzatma API'si
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

    const { userId, packageType, additionalHours } =
      req.body as ExtendPackageRequest;

    // Validasyon
    if (!userId || !packageType || !additionalHours) {
      return res.status(400).json({
        error: "userId, packageType ve additionalHours gerekli",
      });
    }

    if (!isValidPackageType(packageType)) {
      return res.status(400).json({
        error: "Geçersiz paket türü",
      });
    }

    if (additionalHours <= 0) {
      return res.status(400).json({
        error: "Ek süre 0'dan büyük olmalı",
      });
    }

    // Paket süresini uzatma işlemi
    const result = await packageService.extendPackage({
      userId,
      packageType: packageType as PackageType,
      additionalHours,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.message,
      });
    }

    // Custom claims güncelle (KPSS Full paket için)
    if (packageType === PackageType.KPSS_FULL) {
      // Mevcut claims'leri al ve koru (özellikle admin claim'ini)
      const userRecord = await adminAuth.getUser(userId);
      const existingClaims = userRecord.customClaims || {};
      
      const userData = await packageService.getUserPackages(userId);
      const isKpssFullActive =
        userData.ownedPackages[PackageType.KPSS_FULL] &&
        userData.packageExpiryDates[PackageType.KPSS_FULL] &&
        userData.packageExpiryDates[PackageType.KPSS_FULL].toDate() >
          new Date();

      const expMs =
        userData.packageExpiryDates[PackageType.KPSS_FULL]?.toMillis() ||
        Date.now();

      // Admin claim'ini özellikle koru
      const newClaims = {
        ...existingClaims, // Tüm mevcut claims'leri koru
        premium: isKpssFullActive,
        premiumExp: expMs,
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
      data: result.data,
    });
  } catch (error: any) {
    console.error("Extend package API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
