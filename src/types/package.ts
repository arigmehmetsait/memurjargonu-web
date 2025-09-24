import { Timestamp } from "firebase-admin/firestore";

/**
 * Paket türleri - sistemde desteklenen tüm paket türleri
 */
export enum PackageType {
  // KPSS Paketleri
  KPSS_FULL = "kpss_full_paket_subscription",
  KPSS_GUNCEL = "kpss_guncel_subscription",
  KPSS_TARIH = "kpss_tarih_subscription",
  KPSS_VATANDASLIK = "kpss_vatandaslik_subscription",
  KPSS_COGRAFYA = "kpss_cografya_subscription",

  // AGS Paketleri
  AGS_FULL = "ags_full_paket_subscription",
  AGS_MEVZUAT = "ags_mevzuat_subscription",
  AGS_EGITIM_TEMELLERI = "ags_egitim_temelleri_subscription",
  AGS_COGRAFYA = "ags_cografya_subscription",
  AGS_TARIH = "ags_tarih_subscription",
}

/**
 * Paket kategorileri
 */
export enum PackageCategory {
  KPSS = "KPSS",
  AGS = "AGS",
}

/**
 * Paket bilgileri
 */
export interface PackageInfo {
  type: PackageType;
  name: string;
  category: PackageCategory;
  description?: string;
}

/**
 * Kullanıcı paket durumu
 */
export interface UserPackageStatus {
  isOwned: boolean;
  expiryDate: Timestamp | null;
  isExpired: boolean;
}

/**
 * Kullanıcı paket koleksiyonu
 */
export interface UserPackages {
  [packageType: string]: UserPackageStatus;
}

/**
 * Kullanıcı veri yapısı - Firestore'da saklanan format
 */
export interface UserData {
  // Eski uyumluluk alanları
  isPremium: boolean;
  premiumExpiryDate: Timestamp | null;

  // Yeni paket sistemi
  ownedPackages: Record<PackageType, boolean>;
  packageExpiryDates: Record<PackageType, Timestamp | null>;

  // Diğer alanlar
  email?: string;
  forumNickname?: string;
  isBlocked?: boolean;
  lastUpdated: Timestamp;
}

/**
 * Paket işlem sonucu
 */
export interface PackageOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Paket ekleme isteği
 */
export interface AddPackageRequest {
  userId: string;
  packageType: PackageType;
  durationHours: number;
}

/**
 * Paket uzatma isteği
 */
export interface ExtendPackageRequest {
  userId: string;
  packageType: PackageType;
  additionalHours: number;
}

/**
 * Paket kaldırma isteği
 */
export interface RemovePackageRequest {
  userId: string;
  packageType: PackageType;
}

/**
 * Süre seçenekleri
 */
export interface DurationOption {
  value: number; // saat cinsinden
  label: string;
}

/**
 * Paket yönetim API yanıtı
 */
export interface PackageManagementResponse {
  success: boolean;
  message: string;
  userPackages?: UserPackages;
  expiryDate?: Timestamp;
}
