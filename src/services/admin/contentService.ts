import { apiClient } from "@/lib/apiClient";
import { PDFDocument, PDFListResponse, PDFDocumentRequest, PDFStatus, PDFSubcategory } from "@/types/pdf";

export interface ContentListParams {
    query?: string;
    subcategory?: PDFSubcategory;
    status?: PDFStatus | "all";
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export const contentService = {
    // List PDFs with filtering
    async list(params: ContentListParams = {}): Promise<PDFListResponse> {
        const searchParams = new URLSearchParams();
        if (params.query?.trim()) searchParams.append("query", params.query.trim());
        if (params.subcategory) searchParams.append("subcategory", params.subcategory);
        if (params.status && params.status !== "all") searchParams.append("status", params.status);
        if (params.limit) searchParams.append("limit", String(params.limit));
        if (params.sortBy) searchParams.append("sortBy", params.sortBy);
        if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

        return apiClient.get<PDFListResponse>(`/content/list?${searchParams}`);
    },

    // Toggle PDF status
    async updateStatus(
        subcategory: PDFSubcategory,
        pdfId: string,
        status: PDFStatus
    ): Promise<{ success: boolean; error?: string }> {
        return apiClient.patch<{ success: boolean; error?: string }>("/content/status", {
            subcategory,
            pdfId,
            status,
        });
    },

    // Update PDF
    async update(data: {
        subcategory: PDFSubcategory;
        pdfId: string;
        title: string;
        description?: string;
        visibleInPackages?: string[];
        isPremiumOnly?: boolean;
        sortOrder?: number;
        tags?: string[];
        status?: PDFStatus;
        pdfUrl?: string;
        fileName?: string;
        fileSize?: number;
    }): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>("/content/update", data);
    },

    // Create PDF from URL/metadata only
    async createPdf(data: PDFDocumentRequest & {
        pdfUrl: string;
        fileName: string;
        fileSize: number;
    }): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
        return apiClient.post<{ success: boolean; data?: { id: string }; error?: string }>(
            "/content/create-pdf",
            data
        );
    },

    // Delete PDF
    async delete(
        subcategory: PDFSubcategory,
        pdfId: string
    ): Promise<{ success: boolean; error?: string }> {
        return apiClient.request<{ success: boolean; error?: string }>(
            "/content/delete",
            {
                method: "DELETE",
                body: JSON.stringify({ subcategory, pdfId }),
            }
        );
    },
};
