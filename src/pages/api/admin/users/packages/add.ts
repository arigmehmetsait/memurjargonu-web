import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { packageService } from "@/services/packageService";
import { PackageType, AddPackageRequest } from "@/types/package";
import { isValidPackageType } from "@/constants/packages";

/**
 * Kullanıcıya paket ekleme API'si
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

    const { userId, packageType, durationHours } =
      req.body as AddPackageRequest;

    // Validasyon
    if (!userId || !packageType || !durationHours) {
      return res.status(400).json({
        error: "userId, packageType ve durationHours gerekli",
      });
    }

    if (!isValidPackageType(packageType)) {
      return res.status(400).json({
        error: "Geçersiz paket türü",
      });
    }

    if (durationHours <= 0) {
      return res.status(400).json({
        error: "Süre 0'dan büyük olmalı",
      });
    }

    // Paket ekleme işlemi
    const result = await packageService.addPackage({
      userId,
      packageType: packageType as PackageType,
      durationHours,
    });

    if (!result.success) {
      return res.status(500).json({
        error: result.message,
      });
    }

    // Custom claims güncelle (KPSS Full paket için)
    if (packageType === PackageType.KPSS_FULL) {
      const userData = await packageService.getUserPackages(userId);
      const isKpssFullActive =
        userData.ownedPackages[PackageType.KPSS_FULL] &&
        userData.packageExpiryDates[PackageType.KPSS_FULL] &&
        userData.packageExpiryDates[PackageType.KPSS_FULL].toDate() >
          new Date();

      const expMs =
        userData.packageExpiryDates[PackageType.KPSS_FULL]?.toMillis() ||
        Date.now();

      await adminAuth.setCustomUserClaims(userId, {
        premium: isKpssFullActive,
        premiumExp: expMs,
      });
      await adminAuth.revokeRefreshTokens(userId);
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Add package API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
