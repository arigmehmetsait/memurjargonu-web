import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { packageService } from "@/services/packageService";
import {
  calculateAllPackageStatuses,
  formatDate,
  calculateRemainingTime,
} from "@/utils/packageUtils";
import { PACKAGE_INFO } from "@/constants/packages";

/**
 * Kullanıcının paketlerini listeleme API'si
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
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

    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        error: "userId gerekli",
      });
    }

    // Kullanıcı paketlerini getir
    const userData = await packageService.getUserPackages(userId);
    const packageStatuses = calculateAllPackageStatuses(userData);

    // Paket bilgilerini formatla
    const packages = Object.entries(packageStatuses).map(
      ([packageType, status]) => {
        const packageInfo =
          PACKAGE_INFO[packageType as keyof typeof PACKAGE_INFO];

        return {
          type: packageType,
          name: packageInfo?.name || packageType,
          category: packageInfo?.category || "Unknown",
          description: packageInfo?.description || "",
          isOwned: status.isOwned,
          isExpired: status.isExpired,
          expiryDate: status.expiryDate,
          expiryDateFormatted: formatDate(status.expiryDate),
          remainingTime: calculateRemainingTime(status.expiryDate),
          status: status.isOwned
            ? status.isExpired
              ? "expired"
              : "active"
            : "not_owned",
        };
      }
    );

    // Eski uyumluluk bilgileri
    const legacyInfo = {
      isPremium: userData.isPremium,
      premiumExpiryDate: userData.premiumExpiryDate,
      premiumExpiryDateFormatted: formatDate(userData.premiumExpiryDate),
      premiumRemainingTime: calculateRemainingTime(userData.premiumExpiryDate),
    };

    res.status(200).json({
      success: true,
      data: {
        userId,
        packages,
        legacyInfo,
        summary: {
          totalPackages: packages.length,
          ownedPackages: packages.filter((p) => p.isOwned).length,
          activePackages: packages.filter((p) => p.isOwned && !p.isExpired)
            .length,
          expiredPackages: packages.filter((p) => p.isOwned && p.isExpired)
            .length,
        },
      },
    });
  } catch (error: any) {
    console.error("List packages API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
