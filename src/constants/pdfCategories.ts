import { PDFCategory, PDFSubcategory, CategoryInfo } from "@/types/pdf";
import { PackageType } from "@/types/package";

/**
 * PDF Kategorilerinin detaylı bilgileri
 */
export const PDF_CATEGORY_INFO: Record<PDFSubcategory, CategoryInfo> = {
  // AGS Kategorileri
  [PDFSubcategory.AGS_EGITIM]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_EGITIM,
    name: "Eğitim Bilimleri",
    description: "Eğitim bilimleri ve psikoloji konuları",
    icon: "bi-book",
    packageTypes: [PackageType.AGS_FULL, PackageType.AGS_EGITIM_TEMELLERI],
  },

  [PDFSubcategory.AGS_EGITIM_TEMKAV]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_EGITIM_TEMKAV,
    name: "Eğitim Temel Kavramları",
    description: "Eğitimin temel kavram ve prensipleri",
    icon: "bi-lightbulb",
    packageTypes: [PackageType.AGS_FULL, PackageType.AGS_EGITIM_TEMELLERI],
  },

  [PDFSubcategory.AGS_MEVZUAT]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_MEVZUAT,
    name: "Mevzuat",
    description: "Eğitim mevzuatı ve yasal düzenlemeler",
    icon: "bi-journal-text",
    packageTypes: [PackageType.AGS_FULL, PackageType.AGS_MEVZUAT],
  },

  [PDFSubcategory.AGS_MEVZUAT_VATANDASLIK]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_MEVZUAT_VATANDASLIK,
    name: "Mevzuat Vatandaşlık",
    description: "Vatandaşlık mevzuatı ve hukuk",
    icon: "bi-shield-check",
    packageTypes: [PackageType.AGS_FULL, PackageType.AGS_MEVZUAT],
  },

  [PDFSubcategory.AGS_COGRAFYA]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_COGRAFYA,
    name: "Coğrafya",
    description: "Coğrafya konuları ve harita bilgisi",
    icon: "bi-globe",
    packageTypes: [PackageType.AGS_FULL, PackageType.AGS_COGRAFYA],
  },

  [PDFSubcategory.AGS_GUNCEL_BILGILER]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_GUNCEL_BILGILER,
    name: "Güncel Bilgiler",
    description: "Güncel olaylar ve genel kültür",
    icon: "bi-newspaper",
    packageTypes: [PackageType.AGS_FULL],
  },

  // KPSS Kategorileri
  // [PDFSubcategory.KPSS_TARIH]: {
  //   category: PDFCategory.KPSS,
  //   subcategory: PDFSubcategory.KPSS_TARIH,
  //   name: "Tarih",
  //   description: "Türk tarihi ve genel tarih konuları",
  //   icon: "bi-clock-history",
  //   packageTypes: [PackageType.KPSS_FULL, PackageType.KPSS_TARIH],
  // },

  // [PDFSubcategory.KPSS_COGRAFYA]: {
  //   category: PDFCategory.KPSS,
  //   subcategory: PDFSubcategory.KPSS_COGRAFYA,
  //   name: "Coğrafya",
  //   description: "Türkiye ve dünya coğrafyası",
  //   icon: "bi-geo-alt",
  //   packageTypes: [PackageType.KPSS_FULL, PackageType.KPSS_COGRAFYA],
  // },

  // [PDFSubcategory.KPSS_VATANDASLIK]: {
  //   category: PDFCategory.KPSS,
  //   subcategory: PDFSubcategory.KPSS_VATANDASLIK,
  //   name: "Vatandaşlık",
  //   description: "Vatandaşlık bilgisi ve anayasa",
  //   icon: "bi-person-badge",
  //   packageTypes: [PackageType.KPSS_FULL, PackageType.KPSS_VATANDASLIK],
  // },

  // [PDFSubcategory.KPSS_GUNCEL]: {
  //   category: PDFCategory.KPSS,
  //   subcategory: PDFSubcategory.KPSS_GUNCEL,
  //   name: "Güncel Bilgiler",
  //   description: "Güncel olaylar ve genel kültür",
  //   icon: "bi-calendar-event",
  //   packageTypes: [PackageType.KPSS_FULL, PackageType.KPSS_GUNCEL],
  // },
};

/**
 * Ana kategorilere göre alt kategorileri getir
 */
export const getSubcategoriesByCategory = (
  category: PDFCategory
): PDFSubcategory[] => {
  return Object.values(PDFSubcategory).filter(
    (subcategory) => PDF_CATEGORY_INFO[subcategory].category === category
  );
};

/**
 * Paket türüne göre ilgili kategorileri getir
 */
export const getCategoriesByPackageType = (
  packageType: PackageType
): PDFSubcategory[] => {
  return Object.values(PDFSubcategory).filter((subcategory) =>
    PDF_CATEGORY_INFO[subcategory].packageTypes.includes(packageType)
  );
};

/**
 * Kategori bilgilerini isimle getir
 */
export const getCategoryDisplayName = (subcategory: PDFSubcategory): string => {
  return PDF_CATEGORY_INFO[subcategory]?.name || subcategory;
};

/**
 * Firebase koleksiyon adlarını eski sisteme uygun oluştur
 */
export const getFirebaseCollectionName = (
  subcategory: PDFSubcategory
): string => {
  const mapping: Record<PDFSubcategory, string> = {
    [PDFSubcategory.AGS_EGITIM]: "AgsEgitimPdf",
    [PDFSubcategory.AGS_EGITIM_TEMKAV]: "AgsEgitimTemKavPdf",
    [PDFSubcategory.AGS_MEVZUAT]: "AgsMevzuatPdf",
    [PDFSubcategory.AGS_MEVZUAT_VATANDASLIK]: "AgsMevzuatVatandaslikPdf",
    // [PDFSubcategory.AGS_TURK_MILLI_EGITIM]: "AgsTurkMilliEgitimPdf",
    [PDFSubcategory.AGS_COGRAFYA]: "CografyaPdfFiles",
    [PDFSubcategory.AGS_GUNCEL_BILGILER]: "GuncelBilgilerPdf",

    // [PDFSubcategory.KPSS_TARIH]: "KpssTarihPdf",
    // [PDFSubcategory.KPSS_COGRAFYA]: "KpssCografyaPdf",
    // [PDFSubcategory.KPSS_VATANDASLIK]: "KpssVatandaslikPdf",
    // [PDFSubcategory.KPSS_GUNCEL]: "KpssGuncelPdf",
  };

  return mapping[subcategory] || `${subcategory}Pdf`;
};
