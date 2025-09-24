import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { packageService } from "@/services/packageService";
import { PackageType } from "@/types/package";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Legacy premium API - eski uyumluluk için korunuyor
 * Yeni paket sistemi için /api/admin/users/packages/* endpoint'lerini kullanın
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const idToken = (req.headers.authorization || "").replace("Bearer ", "");
    if (!idToken) return res.status(401).json({ error: "No token" });

    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded?.admin) {
      return res.status(403).json({ error: "not admin" });
    }

    const {
      email,
      months = 1,
      action,
    } = req.body as {
      email?: string;
      months?: number;
      action?: "grant" | "revoke";
    };

    if (!email || !action)
      return res.status(400).json({ error: "email & action required" });

    const byEmail = await adminAuth.getUserByEmail(email).catch(() => null);
    if (!byEmail) return res.status(404).json({ error: "user not found" });

    const uid = byEmail.uid;

    if (action === "grant") {
      // KPSS Full paket ekle (eski uyumluluk için)
      const durationHours = months * 24 * 30; // yaklaşık ay cinsinden
      const result = await packageService.addPackage({
        userId: uid,
        packageType: PackageType.KPSS_FULL,
        durationHours,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }
    } else {
      // KPSS Full paket kaldır
      const result = await packageService.removePackage({
        userId: uid,
        packageType: PackageType.KPSS_FULL,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.message });
      }
    }

    // Custom claims güncelle
    const userData = await packageService.getUserPackages(uid);
    const isKpssFullActive =
      userData.ownedPackages[PackageType.KPSS_FULL] &&
      userData.packageExpiryDates[PackageType.KPSS_FULL] &&
      userData.packageExpiryDates[PackageType.KPSS_FULL].toDate() > new Date();

    const expMs =
      userData.packageExpiryDates[PackageType.KPSS_FULL]?.toMillis() ||
      Date.now();

    await adminAuth.setCustomUserClaims(uid, {
      ...(byEmail.customClaims || {}),
      premium: isKpssFullActive,
      premiumExp: expMs,
    });
    await adminAuth.revokeRefreshTokens(uid);

    res.status(200).json({
      ok: true,
      message: action === "grant" ? "Premium verildi" : "Premium kaldırıldı",
    });
  } catch (error: any) {
    console.error("Premium API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
