import {
  PackageType,
  PackageCategory,
  PackageInfo,
  DurationOption,
} from "@/types/package";

/**
 * Paket bilgileri - tüm sistem paketleri
 */
export const PACKAGE_INFO: Record<PackageType, PackageInfo> = {
  // KPSS Paketleri
  [PackageType.KPSS_FULL]: {
    type: PackageType.KPSS_FULL,
    name: "KPSS Full Paket",
    category: PackageCategory.KPSS,
    description: "Tüm KPSS konularını içeren kapsamlı paket",
  },
  [PackageType.KPSS_GUNCEL]: {
    type: PackageType.KPSS_GUNCEL,
    name: "KPSS Güncel Bilgiler",
    category: PackageCategory.KPSS,
    description: "Güncel olaylar ve bilgiler",
  },
  [PackageType.KPSS_TARIH]: {
    type: PackageType.KPSS_TARIH,
    name: "KPSS Tarih",
    category: PackageCategory.KPSS,
    description: "Tarih konuları",
  },
  [PackageType.KPSS_VATANDASLIK]: {
    type: PackageType.KPSS_VATANDASLIK,
    name: "KPSS Vatandaşlık",
    category: PackageCategory.KPSS,
    description: "Vatandaşlık bilgileri",
  },
  [PackageType.KPSS_COGRAFYA]: {
    type: PackageType.KPSS_COGRAFYA,
    name: "KPSS Coğrafya",
    category: PackageCategory.KPSS,
    description: "Coğrafya konuları",
  },

  // AGS Paketleri
  [PackageType.AGS_FULL]: {
    type: PackageType.AGS_FULL,
    name: "AGS Full Paket",
    category: PackageCategory.AGS,
    description: "Tüm AGS konularını içeren kapsamlı paket",
  },
  [PackageType.AGS_MEVZUAT]: {
    type: PackageType.AGS_MEVZUAT,
    name: "AGS Mevzuat",
    category: PackageCategory.AGS,
    description: "Mevzuat bilgileri",
  },
  [PackageType.AGS_EGITIM_TEMELLERI]: {
    type: PackageType.AGS_EGITIM_TEMELLERI,
    name: "AGS Eğitim Temelleri",
    category: PackageCategory.AGS,
    description: "Eğitim temel bilgileri",
  },
  [PackageType.AGS_COGRAFYA]: {
    type: PackageType.AGS_COGRAFYA,
    name: "AGS Coğrafya",
    category: PackageCategory.AGS,
    description: "Coğrafya konuları",
  },
  [PackageType.AGS_TARIH]: {
    type: PackageType.AGS_TARIH,
    name: "AGS Tarih",
    category: PackageCategory.AGS,
    description: "Tarih konuları",
  },
};

/**
 * Paket kategorilerine göre gruplandırılmış paket türleri
 */
export const PACKAGE_CATEGORIES: Record<PackageCategory, PackageType[]> = {
  [PackageCategory.KPSS]: [
    PackageType.KPSS_FULL,
    PackageType.KPSS_GUNCEL,
    PackageType.KPSS_TARIH,
    PackageType.KPSS_VATANDASLIK,
    PackageType.KPSS_COGRAFYA,
  ],
  [PackageCategory.AGS]: [
    PackageType.AGS_FULL,
    PackageType.AGS_MEVZUAT,
    PackageType.AGS_EGITIM_TEMELLERI,
    PackageType.AGS_COGRAFYA,
    PackageType.AGS_TARIH,
  ],
};

/**
 * Süre seçenekleri - saat cinsinden
 */
export const DURATION_OPTIONS: DurationOption[] = [
  { value: 1, label: "1 Saat" },
  { value: 6, label: "6 Saat" },
  { value: 12, label: "12 Saat" },
  { value: 24, label: "1 Gün" },
  { value: 72, label: "3 Gün" },
  { value: 168, label: "1 Hafta" },
  { value: 720, label: "1 Ay (30 gün)" },
  { value: 2160, label: "3 Ay" },
  { value: 4320, label: "6 Ay" },
  { value: 8760, label: "1 Yıl" },
];

/**
 * Paket türüne göre isim almak için yardımcı fonksiyon
 */
export const getPackageName = (packageType: PackageType): string => {
  return PACKAGE_INFO[packageType]?.name || packageType;
};

/**
 * Paket türüne göre kategori almak için yardımcı fonksiyon
 */
export const getPackageCategory = (
  packageType: PackageType
): PackageCategory => {
  return PACKAGE_INFO[packageType]?.category || PackageCategory.KPSS;
};

/**
 * Kategoriye göre paket türlerini almak için yardımcı fonksiyon
 */
export const getPackagesByCategory = (
  category: PackageCategory
): PackageType[] => {
  return PACKAGE_CATEGORIES[category] || [];
};

/**
 * Tüm paket türlerini almak için yardımcı fonksiyon
 */
export const getAllPackageTypes = (): PackageType[] => {
  return Object.values(PackageType);
};

/**
 * Paket türünün geçerli olup olmadığını kontrol etmek için yardımcı fonksiyon
 */
export const isValidPackageType = (
  packageType: string
): packageType is PackageType => {
  return Object.values(PackageType).includes(packageType as PackageType);
};
