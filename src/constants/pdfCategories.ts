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

  [PDFSubcategory.AGS_TURK_MILLI_EGITIM]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.AGS_TURK_MILLI_EGITIM,
    name: "Türk Milli Eğitim Sisteminin Genel Yapısı",
    description: "Türk milli eğitim sisteminin genel yapısı ve temel kavramları",
    icon: "bi-mortarboard",
    packageTypes: [PackageType.AGS_FULL],
  },

  [PDFSubcategory.TARIH]: {
    category: PDFCategory.AGS,
    subcategory: PDFSubcategory.TARIH,
    name: "Tarih",
    description: "Tarih PDF dosyalarını ve sorularını yönetin",
    icon: "bi-clock-history",
    packageTypes: [],
  },

  // KPSS Kategorileri
  [PDFSubcategory.KPSS_TARIH]: {
    category: PDFCategory.KPSS,
    subcategory: PDFSubcategory.KPSS_TARIH,
    name: "Tarih",
    description: "Türk tarihi ve genel tarih konuları",
    icon: "bi-clock-history",
    packageTypes: [],
  },

  [PDFSubcategory.KPSS_COGRAFYA]: {
    category: PDFCategory.KPSS,
    subcategory: PDFSubcategory.KPSS_COGRAFYA,
    name: "Coğrafya",
    description: "Türkiye ve dünya coğrafyası",
    icon: "bi-geo-alt",
    packageTypes: [],
  },

  [PDFSubcategory.KPSS_VATANDASLIK]: {
    category: PDFCategory.KPSS,
    subcategory: PDFSubcategory.KPSS_VATANDASLIK,
    name: "Vatandaşlık",
    description: "Vatandaşlık bilgisi ve anayasa",
    icon: "bi-person-badge",
    packageTypes: [],
  },

  [PDFSubcategory.KPSS_GUNCEL]: {
    category: PDFCategory.KPSS,
    subcategory: PDFSubcategory.KPSS_GUNCEL,
    name: "Güncel Bilgiler",
    description: "Güncel olaylar ve genel kültür",
    icon: "bi-calendar-event",
    packageTypes: [],
  },
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
    [PDFSubcategory.AGS_TURK_MILLI_EGITIM]: "AgsTurkMilliESGYPdf",
    [PDFSubcategory.TARIH]: "pdfFiles",

    [PDFSubcategory.KPSS_TARIH]: "pdfFiles",
    [PDFSubcategory.KPSS_COGRAFYA]: "RealCografyaPdfFiles",
    [PDFSubcategory.KPSS_VATANDASLIK]: "CografyaPdfFiles",
    [PDFSubcategory.KPSS_GUNCEL]: "GuncelBilgilerPdf",
  };

  return mapping[subcategory] || `${subcategory}Pdf`;
};
