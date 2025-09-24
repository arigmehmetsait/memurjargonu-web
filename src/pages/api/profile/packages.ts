import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { packageService } from "@/services/packageService";
import { PackageType, PackageCategory } from "@/types/package";

// Firebase Timestamp'ı kontrol eden yardımcı fonksiyon
const isTimestampExpired = (timestamp: any): boolean => {
  if (!timestamp) return true;

  try {
    let date: Date;
    if (timestamp._seconds) {
      // Firebase Timestamp objesi
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.toDate) {
      // Timestamp.toDate() metodu varsa
      date = timestamp.toDate();
    } else {
      return true;
    }

    return date < new Date();
  } catch {
    return true;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Firebase token'ı doğrula
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Kullanıcının paket bilgilerini getir
    const userData = await packageService.getUserPackages(userId);

    // Paket bilgilerini formatla
    const packageInfo = {
      KPSS_FULL: {
        type: PackageType.KPSS_FULL,
        name: "KPSS Full Paket",
        category: PackageCategory.KPSS,
        description: "Tüm KPSS konularını içeren kapsamlı paket",
        isOwned: userData.ownedPackages[PackageType.KPSS_FULL],
        expiryDate: userData.packageExpiryDates[PackageType.KPSS_FULL],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.KPSS_FULL]
        ),
      },
      KPSS_GUNCEL: {
        type: PackageType.KPSS_GUNCEL,
        name: "KPSS Güncel Olaylar",
        category: PackageCategory.KPSS,
        description: "Güncel olaylar ve haberler paketi",
        isOwned: userData.ownedPackages[PackageType.KPSS_GUNCEL],
        expiryDate: userData.packageExpiryDates[PackageType.KPSS_GUNCEL],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.KPSS_GUNCEL]
        ),
      },
      KPSS_TARIH: {
        type: PackageType.KPSS_TARIH,
        name: "KPSS Tarih",
        category: PackageCategory.KPSS,
        description: "Tarih konuları paketi",
        isOwned: userData.ownedPackages[PackageType.KPSS_TARIH],
        expiryDate: userData.packageExpiryDates[PackageType.KPSS_TARIH],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.KPSS_TARIH]
        ),
      },
      KPSS_VATANDASLIK: {
        type: PackageType.KPSS_VATANDASLIK,
        name: "KPSS Vatandaşlık",
        category: PackageCategory.KPSS,
        description: "Vatandaşlık bilgileri paketi",
        isOwned: userData.ownedPackages[PackageType.KPSS_VATANDASLIK],
        expiryDate: userData.packageExpiryDates[PackageType.KPSS_VATANDASLIK],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.KPSS_VATANDASLIK]
        ),
      },
      KPSS_COGRAFYA: {
        type: PackageType.KPSS_COGRAFYA,
        name: "KPSS Coğrafya",
        category: PackageCategory.KPSS,
        description: "Coğrafya konuları paketi",
        isOwned: userData.ownedPackages[PackageType.KPSS_COGRAFYA],
        expiryDate: userData.packageExpiryDates[PackageType.KPSS_COGRAFYA],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.KPSS_COGRAFYA]
        ),
      },
      AGS_FULL: {
        type: PackageType.AGS_FULL,
        name: "AGS Full Paket",
        category: PackageCategory.AGS,
        description: "Tüm AGS konularını içeren kapsamlı paket",
        isOwned: userData.ownedPackages[PackageType.AGS_FULL],
        expiryDate: userData.packageExpiryDates[PackageType.AGS_FULL],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.AGS_FULL]
        ),
      },
      AGS_MEVZUAT: {
        type: PackageType.AGS_MEVZUAT,
        name: "AGS Mevzuat",
        category: PackageCategory.AGS,
        description: "Mevzuat konuları paketi",
        isOwned: userData.ownedPackages[PackageType.AGS_MEVZUAT],
        expiryDate: userData.packageExpiryDates[PackageType.AGS_MEVZUAT],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.AGS_MEVZUAT]
        ),
      },
      AGS_EGITIM_TEMELLERI: {
        type: PackageType.AGS_EGITIM_TEMELLERI,
        name: "AGS Eğitim Temelleri",
        category: PackageCategory.AGS,
        description: "Eğitim temelleri konuları paketi",
        isOwned: userData.ownedPackages[PackageType.AGS_EGITIM_TEMELLERI],
        expiryDate:
          userData.packageExpiryDates[PackageType.AGS_EGITIM_TEMELLERI],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.AGS_EGITIM_TEMELLERI]
        ),
      },
      AGS_COGRAFYA: {
        type: PackageType.AGS_COGRAFYA,
        name: "AGS Coğrafya",
        category: PackageCategory.AGS,
        description: "Coğrafya konuları paketi",
        isOwned: userData.ownedPackages[PackageType.AGS_COGRAFYA],
        expiryDate: userData.packageExpiryDates[PackageType.AGS_COGRAFYA],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.AGS_COGRAFYA]
        ),
      },
      AGS_TARIH: {
        type: PackageType.AGS_TARIH,
        name: "AGS Tarih",
        category: PackageCategory.AGS,
        description: "Tarih konuları paketi",
        isOwned: userData.ownedPackages[PackageType.AGS_TARIH],
        expiryDate: userData.packageExpiryDates[PackageType.AGS_TARIH],
        isExpired: isTimestampExpired(
          userData.packageExpiryDates[PackageType.AGS_TARIH]
        ),
      },
    };

    // Kullanıcı bilgilerini de ekle
    const response = {
      user: {
        email: userData.email,
        forumNickname: userData.forumNickname,
        isPremium: userData.isPremium,
        premiumExpiryDate: userData.premiumExpiryDate,
        lastUpdated: userData.lastUpdated,
      },
      packages: packageInfo,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Profile packages API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
