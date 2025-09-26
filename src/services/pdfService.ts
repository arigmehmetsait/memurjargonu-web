import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import {
  PDFDocument,
  PDFDocumentRequest,
  PDFSearchParams,
  PDFListResponse,
  PDFUploadResponse,
  PDFStats,
  PDFStatus,
  PDFSubcategory,
  PDFCategory,
} from "@/types/pdf";
import { getFirebaseCollectionName } from "@/constants/pdfCategories";

/**
 * PDF yönetim servisi - Firestore işlemleri
 */
export class PDFService {
  /**
   * PDF istatistiklerini getirir
   */
  async getStats(): Promise<PDFStats> {
    try {
      const stats: PDFStats = {
        totalCount: 0,
        countByCategory: {
          AGS: 0,
          KPSS: 0,
        },
        countBySubcategory: {} as Record<PDFSubcategory, number>,
        countByStatus: {
          active: 0,
          inactive: 0,
          draft: 0,
        },
        totalFileSize: 0,
      };

      // Her alt kategori için koleksiyonları kontrol et
      const subcategories = Object.values(PDFSubcategory);

      for (const subcategory of subcategories) {
        const collectionName = getFirebaseCollectionName(subcategory);
        const snapshot = await adminDb.collection(collectionName).get();

        const count = snapshot.size;
        stats.countBySubcategory[subcategory] = count;
        stats.totalCount += count;

        // Kategori sayısını güncelle
        if (subcategory.startsWith("ags_")) {
          stats.countByCategory.AGS += count;
        } else if (subcategory.startsWith("kpss_")) {
          stats.countByCategory.KPSS += count;
        }

        // Durum ve dosya boyutlarını hesapla
        snapshot.docs.forEach((doc) => {
          const normalizedPdf = this.normalizeFirebaseData(doc, subcategory);

          // Durum sayısı
          const status = normalizedPdf.status;
          stats.countByStatus[status] = (stats.countByStatus[status] || 0) + 1;

          // Dosya boyutu
          stats.totalFileSize += normalizedPdf.fileSize;
        });
      }

      return stats;
    } catch (error) {
      console.error("PDF istatistikleri alınamadı:", error);
      throw new Error("İstatistik verisi alınamadı");
    }
  }

  /**
   * Mevcut Firebase verilerini normalize eder
   */
  private normalizeFirebaseData(
    doc: any,
    subcategory: PDFSubcategory
  ): PDFDocument {
    const data = doc.data();

    // Mevcut Firebase veri yapısını yeni interface'e uyarla
    return {
      id: doc.id,
      title:
        data.title || this.extractTitleFromUrl(data.pdfUrl1) || "Başlıksız PDF",
      description: data.description || "",
      category: subcategory.startsWith("ags_")
        ? PDFCategory.AGS
        : PDFCategory.KPSS,
      subcategory,
      pdfUrl: data.pdfUrl1 || data.pdfUrl || "",
      fileName: data.fileName || data.title || "unknown.pdf",
      fileSize: data.fileSize || 0,
      visibleInPackages: data.visibleInPackages || [],
      isPremiumOnly: data.isPremiumOnly || false,
      status: data.status || PDFStatus.ACTIVE,
      sortOrder: data.sortOrder || 1,
      tags: data.tags || [],
      createdAt: data.createdAt
        ? data.createdAt.toDate
          ? data.createdAt.toDate()
          : data.createdAt
        : new Date(),
      updatedAt: data.updatedAt
        ? data.updatedAt.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt
        : new Date(),
      createdBy: data.createdBy || "system",
      updatedBy: data.updatedBy || "system",
    } as PDFDocument;
  }

  /**
   * URL'den başlık çıkarır
   */
  private extractTitleFromUrl(url: string): string {
    if (!url) return "";

    try {
      const fileName = url.split("/").pop() || "";
      return decodeURIComponent(fileName)
        .replace(/\.(pdf|PDF)$/, "")
        .replace(/[_-]/g, " ")
        .trim();
    } catch {
      return "PDF Dosyası";
    }
  }

  /**
   * PDF listesini getirir (arama ve filtreleme ile)
   */
  async searchPDFs(params: PDFSearchParams): Promise<PDFListResponse> {
    try {
      const {
        query,
        subcategory,
        status,
        isPremiumOnly,
        packageFilter,
        sortBy = "createdAt",
        sortOrder = "desc",
        limit = 20,
        offset = 0,
      } = params;

      let pdfs: PDFDocument[] = [];

      if (subcategory) {
        pdfs = await this.getPDFsFromSubcategory(subcategory);
      } else {
        pdfs = await this.getAllPDFs();
      }

      // Filtreleri uygula
      pdfs = this.applyFilters(pdfs, {
        query,
        status,
        isPremiumOnly,
        packageFilter,
      });

      // Sıralama
      pdfs = this.sortPDFs(pdfs, sortBy, sortOrder);

      // Sayfalama
      const total = pdfs.length;
      const paginatedPDFs = pdfs.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      return {
        success: true,
        data: {
          pdfs: paginatedPDFs,
          total,
          hasMore,
        },
      };
    } catch (error) {
      console.error("PDF arama hatası:", error);
      return {
        success: false,
        data: { pdfs: [], total: 0, hasMore: false },
        error: `PDF'ler aranırken hata oluştu: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`,
      };
    }
  }

  /**
   * Belirli bir alt kategoriden PDF'leri getirir
   */
  private async getPDFsFromSubcategory(
    subcategory: PDFSubcategory
  ): Promise<PDFDocument[]> {
    const collectionName = getFirebaseCollectionName(subcategory);
    const snapshot = await adminDb.collection(collectionName).get();

    return snapshot.docs.map((doc) =>
      this.normalizeFirebaseData(doc, subcategory)
    );
  }

  /**
   * Tüm kategorilerden PDF'leri getirir
   */
  private async getAllPDFs(): Promise<PDFDocument[]> {
    const subcategories = Object.values(PDFSubcategory);
    const promises = subcategories.map((subcategory) =>
      this.getPDFsFromSubcategory(subcategory).catch((error) => {
        console.warn(`Kategori ${subcategory} için PDF'ler alınamadı:`, error);
        return [];
      })
    );

    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * PDF listesine filtreleri uygular
   */
  private applyFilters(
    pdfs: PDFDocument[],
    filters: {
      query?: string;
      status?: PDFStatus;
      isPremiumOnly?: boolean;
      packageFilter?: string;
    }
  ): PDFDocument[] {
    let filteredPDFs = [...pdfs];

    // Metin araması
    if (filters.query) {
      const searchTerm = filters.query.toLowerCase();
      filteredPDFs = filteredPDFs.filter(
        (pdf) =>
          pdf.title.toLowerCase().includes(searchTerm) ||
          (pdf.description &&
            pdf.description.toLowerCase().includes(searchTerm))
      );
    }

    // Durum filtresi
    if (filters.status) {
      filteredPDFs = filteredPDFs.filter(
        (pdf) => pdf.status === filters.status
      );
    }

    // Premium filtresi
    if (filters.isPremiumOnly !== undefined) {
      filteredPDFs = filteredPDFs.filter(
        (pdf) => pdf.isPremiumOnly === filters.isPremiumOnly
      );
    }

    // Paket filtresi
    if (filters.packageFilter) {
      filteredPDFs = filteredPDFs.filter((pdf) =>
        pdf.visibleInPackages.includes(filters.packageFilter!)
      );
    }

    return filteredPDFs;
  }

  /**
   * PDF listesini sıralar
   */
  private sortPDFs(
    pdfs: PDFDocument[],
    sortBy: string,
    sortOrder: string
  ): PDFDocument[] {
    return pdfs.sort((a, b) => {
      const aValue = a[sortBy as keyof PDFDocument] as any;
      const bValue = b[sortBy as keyof PDFDocument] as any;

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }

  /**
   * Tek bir PDF'i getirir
   */
  async getPDFById(
    subcategory: PDFSubcategory,
    pdfId: string
  ): Promise<PDFDocument | null> {
    try {
      const collectionName = getFirebaseCollectionName(subcategory);
      const doc = await adminDb.collection(collectionName).doc(pdfId).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        subcategory,
        ...doc.data(),
      } as PDFDocument;
    } catch (error) {
      console.error("PDF getirilemedi:", error);
      return null;
    }
  }

  /**
   * Yeni PDF ekler
   */
  async addPDF(
    request: PDFDocumentRequest,
    pdfUrl: string,
    fileName: string,
    fileSize: number,
    adminUserId: string
  ): Promise<PDFUploadResponse> {
    try {
      const collectionName = getFirebaseCollectionName(request.subcategory);
      const now = Timestamp.now();

      const pdfData: Omit<PDFDocument, "id"> = {
        ...request,
        pdfUrl,
        fileName,
        fileSize,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        createdBy: adminUserId,
        updatedBy: adminUserId,
      };

      const docRef = await adminDb.collection(collectionName).add(pdfData);

      return {
        success: true,
        message: "PDF başarıyla eklendi",
        data: {
          pdfId: docRef.id,
          downloadUrl: pdfUrl,
          fileName,
          fileSize,
        },
      };
    } catch (error) {
      console.error("PDF eklenemedi:", error);
      return {
        success: false,
        message: "PDF eklenirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      };
    }
  }

  /**
   * PDF'i günceller
   */
  async updatePDF(
    subcategory: PDFSubcategory,
    pdfId: string,
    updates: Partial<PDFDocumentRequest>,
    adminUserId: string
  ): Promise<PDFUploadResponse> {
    try {
      const collectionName = getFirebaseCollectionName(subcategory);
      const now = Timestamp.now();

      const updateData = {
        ...updates,
        updatedAt: now,
        updatedBy: adminUserId,
      };

      await adminDb.collection(collectionName).doc(pdfId).update(updateData);

      return {
        success: true,
        message: "PDF başarıyla güncellendi",
      };
    } catch (error) {
      console.error("PDF güncellenemedi:", error);
      return {
        success: false,
        message: "PDF güncellenirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      };
    }
  }

  /**
   * PDF'i siler
   */
  async deletePDF(
    subcategory: PDFSubcategory,
    pdfId: string
  ): Promise<PDFUploadResponse> {
    try {
      const collectionName = getFirebaseCollectionName(subcategory);

      // Önce PDF'in var olduğunu kontrol et
      const doc = await adminDb.collection(collectionName).doc(pdfId).get();
      if (!doc.exists) {
        return {
          success: false,
          message: "PDF bulunamadı",
        };
      }

      // PDF'i sil
      await adminDb.collection(collectionName).doc(pdfId).delete();

      // TODO: Firebase Storage'dan dosyayı da sil
      // const pdfData = doc.data() as PDFDocument;
      // await admin.storage().bucket().file(pdfData.fileName).delete();

      return {
        success: true,
        message: "PDF başarıyla silindi",
      };
    } catch (error) {
      console.error("PDF silinemedi:", error);
      return {
        success: false,
        message: "PDF silinirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      };
    }
  }

  /**
   * PDF durumunu değiştirir
   */
  async updatePDFStatus(
    subcategory: PDFSubcategory,
    pdfId: string,
    status: PDFStatus,
    adminUserId: string
  ): Promise<PDFUploadResponse> {
    try {
      const collectionName = getFirebaseCollectionName(subcategory);
      const now = Timestamp.now();

      await adminDb.collection(collectionName).doc(pdfId).update({
        status,
        updatedAt: now,
        updatedBy: adminUserId,
      });

      return {
        success: true,
        message: `PDF durumu ${status} olarak güncellendi`,
      };
    } catch (error) {
      console.error("PDF durumu güncellenemedi:", error);
      return {
        success: false,
        message: "PDF durumu güncellenirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      };
    }
  }
}
