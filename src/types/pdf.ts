/**
 * PDF Kategorileri - Ana kategoriler
 */
export enum PDFCategory {
  AGS = "AGS",
  KPSS = "KPSS",
}

/**
 * PDF Alt Kategorileri
 */
export enum PDFSubcategory {
  // AGS Alt Kategorileri
  AGS_EGITIM = "ags_egitim",
  AGS_EGITIM_TEMKAV = "ags_egitim_temkav",
  AGS_MEVZUAT = "ags_mevzuat",
  AGS_MEVZUAT_VATANDASLIK = "ags_mevzuat_vatandaslik",
  AGS_COGRAFYA = "ags_cografya",
  AGS_GUNCEL_BILGILER = "ags_guncel_bilgiler",
  TARIH = "tarih",

  // KPSS Alt Kategorileri
  // KPSS_TARIH = "kpss_tarih",
  // KPSS_COGRAFYA = "kpss_cografya",
  // KPSS_VATANDASLIK = "kpss_vatandaslik",
  // KPSS_GUNCEL = "kpss_guncel",
}

/**
 * PDF Dosya Durumları
 */
export enum PDFStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DRAFT = "draft",
}

/**
 * PDF Dosya Bilgileri - Firestore'da saklanan format
 */
export interface PDFDocument {
  id?: string; // Firestore document ID
  title: string;
  description?: string;
  category: PDFCategory;
  subcategory: PDFSubcategory;

  // Dosya bilgileri
  pdfUrl: string; // Firebase Storage URL
  fileName: string; // Orijinal dosya adı
  fileSize: number; // Bytes cinsinden

  // Paket ilişkileri - hangi paketlerde görünür
  visibleInPackages: string[]; // PackageType enum değerleri
  isPremiumOnly: boolean; // Sadece premium kullanıcılar görebilir mi

  // Meta bilgiler
  status: PDFStatus;
  sortOrder: number; // Sıralama için
  tags?: string[]; // Arama ve filtreleme için

  // Timestamp'lar
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin user ID
  updatedBy: string; // Son güncelleyen admin user ID
}

/**
 * PDF İstatistikleri
 */
export interface PDFStats {
  totalCount: number;
  countByCategory: Record<PDFCategory, number>;
  countBySubcategory: Record<PDFSubcategory, number>;
  countByStatus: Record<PDFStatus, number>;
  totalFileSize: number; // Bytes
}

/**
 * PDF Ekleme/Güncelleme İsteği
 */
export interface PDFDocumentRequest {
  title: string;
  description?: string;
  category: PDFCategory;
  subcategory: PDFSubcategory;
  visibleInPackages: string[];
  isPremiumOnly: boolean;
  sortOrder: number;
  tags?: string[];
  status: PDFStatus;
}

/**
 * PDF Upload Response
 */
export interface PDFUploadResponse {
  success: boolean;
  message: string;
  data?: {
    pdfId: string;
    downloadUrl: string;
    fileName: string;
    fileSize: number;
  };
  error?: string;
}

/**
 * PDF Arama/Filtreleme Parametreleri
 */
export interface PDFSearchParams {
  query?: string; // Başlık ve açıklamada arama
  category?: PDFCategory;
  subcategory?: PDFSubcategory;
  status?: PDFStatus;
  isPremiumOnly?: boolean;
  packageFilter?: string; // Belirli pakette görünürler
  tags?: string[];
  sortBy?: "title" | "createdAt" | "updatedAt" | "sortOrder";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

/**
 * PDF Liste Response
 */
export interface PDFListResponse {
  success: boolean;
  data: {
    pdfs: PDFDocument[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Kategori bilgileri - UI'da göstermek için
 */
export interface CategoryInfo {
  category: PDFCategory;
  subcategory: PDFSubcategory;
  name: string;
  description: string;
  icon: string; // Bootstrap icon class
  packageTypes: string[]; // İlişkili paket türleri
}
