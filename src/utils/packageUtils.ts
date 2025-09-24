import { Timestamp } from "firebase-admin/firestore";
import { PackageType, UserPackageStatus, UserData } from "@/types/package";
import { PACKAGE_INFO } from "@/constants/packages";

/**
 * Paket süresinin dolup dolmadığını kontrol eder
 */
export const isPackageExpired = (expiryDate: Timestamp | null): boolean => {
  if (!expiryDate) return true;

  const now = new Date();
  const expiry = expiryDate.toDate();

  return expiry < now;
};

/**
 * Kullanıcının paket durumunu hesaplar
 */
export const calculatePackageStatus = (
  isOwned: boolean,
  expiryDate: Timestamp | null
): UserPackageStatus => {
  const isExpired = isPackageExpired(expiryDate);

  return {
    isOwned,
    expiryDate,
    isExpired,
  };
};

/**
 * Kullanıcının tüm paket durumlarını hesaplar
 */
export const calculateAllPackageStatuses = (
  userData: UserData
): Record<PackageType, UserPackageStatus> => {
  const result: Record<PackageType, UserPackageStatus> = {} as Record<
    PackageType,
    UserPackageStatus
  >;

  Object.values(PackageType).forEach((packageType) => {
    const isOwned = userData.ownedPackages[packageType] || false;
    const expiryDate = userData.packageExpiryDates[packageType] || null;

    result[packageType] = calculatePackageStatus(isOwned, expiryDate);
  });

  return result;
};

/**
 * Kullanıcının aktif paketlerini getirir
 */
export const getActivePackages = (userData: UserData): PackageType[] => {
  const packageStatuses = calculateAllPackageStatuses(userData);

  return Object.entries(packageStatuses)
    .filter(([_, status]) => status.isOwned && !status.isExpired)
    .map(([packageType, _]) => packageType as PackageType);
};

/**
 * Kullanıcının süresi dolmuş paketlerini getirir
 */
export const getExpiredPackages = (userData: UserData): PackageType[] => {
  const packageStatuses = calculateAllPackageStatuses(userData);

  return Object.entries(packageStatuses)
    .filter(([_, status]) => status.isOwned && status.isExpired)
    .map(([packageType, _]) => packageType as PackageType);
};

/**
 * Kullanıcının hiç paketi olup olmadığını kontrol eder
 */
export const hasAnyPackage = (userData: UserData): boolean => {
  return Object.values(userData.ownedPackages).some((isOwned) => isOwned);
};

/**
 * Kullanıcının aktif paketi olup olmadığını kontrol eder
 */
export const hasActivePackage = (userData: UserData): boolean => {
  return getActivePackages(userData).length > 0;
};

/**
 * KPSS Full paketinin aktif olup olmadığını kontrol eder (eski uyumluluk için)
 */
export const isKpssFullActive = (userData: UserData): boolean => {
  const kpssFullStatus = calculatePackageStatus(
    userData.ownedPackages[PackageType.KPSS_FULL] || false,
    userData.packageExpiryDates[PackageType.KPSS_FULL] || null
  );

  return kpssFullStatus.isOwned && !kpssFullStatus.isExpired;
};

/**
 * Paket süresini uzatır
 */
export const extendPackageExpiry = (
  currentExpiry: Timestamp | null,
  additionalHours: number
): Timestamp => {
  const now = new Date();
  const baseDate =
    currentExpiry && currentExpiry.toDate() > now
      ? currentExpiry.toDate()
      : now;

  const newExpiry = new Date(
    baseDate.getTime() + additionalHours * 60 * 60 * 1000
  );

  return Timestamp.fromDate(newExpiry);
};

/**
 * Paket süresini hesaplar (şu andan itibaren)
 */
export const calculatePackageExpiry = (durationHours: number): Timestamp => {
  const now = new Date();
  const expiry = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  return Timestamp.fromDate(expiry);
};

/**
 * Paket bilgilerini formatlar
 */
export const formatPackageInfo = (packageType: PackageType): string => {
  const info = PACKAGE_INFO[packageType];
  return info ? `${info.name} (${info.category})` : packageType;
};

/**
 * Tarih formatlar (Türkçe)
 */
export const formatDate = (timestamp: Timestamp | null): string => {
  if (!timestamp) return "Yok";

  const date = timestamp.toDate();
  return date.toLocaleString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Kalan süreyi hesaplar
 */
export const calculateRemainingTime = (
  expiryDate: Timestamp | null
): string => {
  if (!expiryDate) return "Süre yok";

  const now = new Date();
  const expiry = expiryDate.toDate();

  if (expiry < now) return "Süresi dolmuş";

  const diff = expiry.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} gün ${hours} saat`;
  } else if (hours > 0) {
    return `${hours} saat`;
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} dakika`;
  }
};

/**
 * Kullanıcı verilerini temizler ve normalize eder
 */
export const normalizeUserData = (userData: any): UserData => {
  return {
    isPremium: userData.isPremium || false,
    premiumExpiryDate: userData.premiumExpiryDate || null,
    ownedPackages: userData.ownedPackages || {},
    packageExpiryDates: userData.packageExpiryDates || {},
    email: userData.email,
    forumNickname: userData.forumNickname,
    isBlocked: userData.isBlocked || false,
    lastUpdated: userData.lastUpdated || Timestamp.now(),
  };
};
