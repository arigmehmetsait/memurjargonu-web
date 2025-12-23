import { apiClient } from "@/lib/apiClient";

export interface PDFFile {
    id: string;
    title: string;
    pdfUrl: string;
    video?: string;
    questions?: Record<string, any>;
    createdAt?: any;
    updatedAt?: any;
}

export const pdfFilesService = {
    // List all PDF files
    async list(): Promise<{ success: boolean; data?: PDFFile[]; error?: string }> {
        return apiClient.get<{ success: boolean; data?: PDFFile[]; error?: string }>(
            "/pdf-files/list"
        );
    },

    // Get a specific PDF file
    async get(id: string): Promise<{ success: boolean; data?: PDFFile; error?: string }> {
        return apiClient.get<{ success: boolean; data?: PDFFile; error?: string }>(
            `/pdf-files/${encodeURIComponent(id)}`
        );
    },

    // Create a new PDF file
    async create(data: Partial<PDFFile>): Promise<{ success: boolean; id?: string; error?: string }> {
        return apiClient.post<{ success: boolean; id?: string; error?: string }>(
            "/pdf-files/create",
            data
        );
    },

    // Update a PDF file
    async update(id: string, updates: Partial<PDFFile>): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>(
            `/pdf-files/${encodeURIComponent(id)}`,
            updates
        );
    },

    // Delete a PDF file
    async delete(id: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.delete<{ success: boolean; error?: string }>(
            `/pdf-files/${encodeURIComponent(id)}`
        );
    },
};
