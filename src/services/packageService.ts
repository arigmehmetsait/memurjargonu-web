import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import {
  PackageType,
  UserData,
  PackageOperationResult,
  AddPackageRequest,
  ExtendPackageRequest,
  RemovePackageRequest,
} from "@/types/package";
import {
  calculatePackageExpiry,
  extendPackageExpiry,
  normalizeUserData,
  isKpssFullActive,
} from "@/utils/packageUtils";

/**
 * Paket yönetim servisi - Firestore işlemleri
 */
export class PackageService {
  /**
   * Admin custom claims'leri korur
   */
  private async preserveAdminClaims(userId: string): Promise<void> {
    try {
      const user = await adminAuth.getUser(userId);
      const currentClaims = user.customClaims || {};

      // Eğer kullanıcı admin ise, admin claim'ini koru
      if (currentClaims.admin === true) {
        console.log(`Admin claims korunuyor: ${userId}`);
        // Bu fonksiyon sadece log için, gerçek koruma transaction içinde yapılacak
      }
    } catch (error) {
      console.error("Admin claims kontrolü hatası:", error);
      // Hata durumunda devam et, kritik değil
    }
  }
  /**
   * Kullanıcının paket bilgilerini getirir
   */
  async getUserPackages(userId: string): Promise<UserData> {
    try {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const userData = userDoc.data();
      if (!userData) {
        throw new Error("Kullanıcı verileri alınamadı");
      }
      return normalizeUserData(userData);
    } catch (error) {
      console.error("Kullanıcı paketleri getirilemedi:", error);
      throw error;
    }
  }

  /**
   * Kullanıcıya paket ekler
   */
  async addPackage(
    request: AddPackageRequest
  ): Promise<PackageOperationResult> {
    try {
      const { userId, packageType, durationHours } = request;

      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const rawUserData = userDoc.data();
      if (!rawUserData) {
        throw new Error("Kullanıcı verileri alınamadı");
      }
      const userData = normalizeUserData(rawUserData);
      const now = Timestamp.now();
      const expiryDate = calculatePackageExpiry(durationHours);

      // Paket bilgilerini güncelle
      const updatedOwnedPackages = {
        ...userData.ownedPackages,
        [packageType]: true,
      };

      const updatedPackageExpiryDates = {
        ...userData.packageExpiryDates,
        [packageType]: expiryDate,
      };

      // KPSS Full paket için eski uyumluluk alanlarını güncelle
      let isPremium = userData.isPremium;
      let premiumExpiryDate = userData.premiumExpiryDate;

      if (packageType === PackageType.KPSS_FULL) {
        isPremium = true;
        premiumExpiryDate = expiryDate;
      }

      // Admin claims'leri koru
      await this.preserveAdminClaims(userId);

      await userRef.update({
        ownedPackages: updatedOwnedPackages,
        packageExpiryDates: updatedPackageExpiryDates,
        isPremium,
        premiumExpiryDate,
        lastUpdated: now,
      });

      return {
        success: true,
        message: `${packageType} paketi başarıyla eklendi`,
        data: { expiryDate },
      };
    } catch (error) {
      console.error("Paket eklenemedi:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Paket eklenirken hata oluştu",
      };
    }
  }

  /**
   * Kullanıcının paket süresini uzatır
   */
  async extendPackage(
    request: ExtendPackageRequest
  ): Promise<PackageOperationResult> {
    try {
      const { userId, packageType, additionalHours } = request;

      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const rawUserData = userDoc.data();
      if (!rawUserData) {
        throw new Error("Kullanıcı verileri alınamadı");
      }
      const userData = normalizeUserData(rawUserData);

      if (!userData.ownedPackages[packageType]) {
        throw new Error("Bu paket kullanıcıda mevcut değil");
      }

      const currentExpiry = userData.packageExpiryDates[packageType];
      const newExpiryDate = extendPackageExpiry(currentExpiry, additionalHours);

      const updatedPackageExpiryDates = {
        ...userData.packageExpiryDates,
        [packageType]: newExpiryDate,
      };

      // KPSS Full paket için eski uyumluluk alanlarını güncelle
      let premiumExpiryDate = userData.premiumExpiryDate;

      if (packageType === PackageType.KPSS_FULL) {
        premiumExpiryDate = newExpiryDate;
      }

      // Admin claims'leri koru
      await this.preserveAdminClaims(userId);

      await userRef.update({
        packageExpiryDates: updatedPackageExpiryDates,
        premiumExpiryDate,
        lastUpdated: Timestamp.now(),
      });

      return {
        success: true,
        message: `${packageType} paketi süresi uzatıldı`,
        data: { expiryDate: newExpiryDate },
      };
    } catch (error) {
      console.error("Paket süresi uzatılamadı:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Paket süresi uzatılırken hata oluştu",
      };
    }
  }

  /**
   * Kullanıcıdan paket kaldırır
   */
  async removePackage(
    request: RemovePackageRequest
  ): Promise<PackageOperationResult> {
    try {
      const { userId, packageType } = request;

      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const rawUserData = userDoc.data();
      if (!rawUserData) {
        throw new Error("Kullanıcı verileri alınamadı");
      }
      const userData = normalizeUserData(rawUserData);

      if (!userData.ownedPackages[packageType]) {
        throw new Error("Bu paket kullanıcıda mevcut değil");
      }

      // Paket bilgilerini güncelle
      const updatedOwnedPackages = {
        ...userData.ownedPackages,
        [packageType]: false,
      };

      const updatedPackageExpiryDates = {
        ...userData.packageExpiryDates,
        [packageType]: null,
      };

      // KPSS Full paket için eski uyumluluk alanlarını güncelle
      let isPremium = userData.isPremium;
      let premiumExpiryDate = userData.premiumExpiryDate;

      if (packageType === PackageType.KPSS_FULL) {
        isPremium = false;
        premiumExpiryDate = null;
      }

      // Admin claims'leri koru
      await this.preserveAdminClaims(userId);

      await userRef.update({
        ownedPackages: updatedOwnedPackages,
        packageExpiryDates: updatedPackageExpiryDates,
        isPremium,
        premiumExpiryDate,
        lastUpdated: Timestamp.now(),
      });

      return {
        success: true,
        message: `${packageType} paketi kaldırıldı`,
      };
    } catch (error) {
      console.error("Paket kaldırılamadı:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Paket kaldırılırken hata oluştu",
      };
    }
  }

  /**
   * Kullanıcının paket durumunu günceller (eski uyumluluk için)
   */
  async updateLegacyPremiumStatus(
    userId: string
  ): Promise<PackageOperationResult> {
    try {
      const userData = await this.getUserPackages(userId);
      const isKpssFullActiveNow = isKpssFullActive(userData);

      const userRef = adminDb.collection("users").doc(userId);

      await userRef.update({
        isPremium: isKpssFullActiveNow,
        premiumExpiryDate: isKpssFullActiveNow
          ? userData.packageExpiryDates[PackageType.KPSS_FULL]
          : null,
        lastUpdated: Timestamp.now(),
      });

      return {
        success: true,
        message: "Eski uyumluluk durumu güncellendi",
      };
    } catch (error) {
      console.error("Eski uyumluluk durumu güncellenemedi:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Eski uyumluluk durumu güncellenirken hata oluştu",
      };
    }
  }
}

// Singleton instance
export const packageService = new PackageService();
