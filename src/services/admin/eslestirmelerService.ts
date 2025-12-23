import { apiClient } from "@/lib/apiClient";

export interface EslestirmeDocument {
    id: string;
    name: string;
    levelCount: number;
    levels: string[];
    [key: string]: any;
}

export interface EslestirmeListResponse {
    success: boolean;
    data: EslestirmeDocument[];
    error?: string;
}

export const eslestirmelerService = {
    // List all eslestirme documents
    async list(): Promise<EslestirmeListResponse> {
        return apiClient.get<EslestirmeListResponse>("/eslestirmeler/list");
    },

    // Create new eslestirme document
    async create(docId: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.post<{ success: boolean; error?: string }>(
            "/eslestirmeler/create",
            { docId }
        );
    },

    // Delete an eslestirme document
    async delete(docId: string): Promise<{ success: boolean; data?: { name: string }; error?: string }> {
        return apiClient.delete<{ success: boolean; data?: { name: string }; error?: string }>(
            `/eslestirmeler/${encodeURIComponent(docId)}`
        );
    },

    // Get details of a specific eslestirme document
    async get(docId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return apiClient.get<{ success: boolean; data?: any; error?: string }>(
            `/eslestirmeler/${encodeURIComponent(docId)}`
        );
    },

    // Update an eslestirme document
    async update(docId: string, updates: Record<string, any>): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>(
            `/eslestirmeler/${encodeURIComponent(docId)}`,
            updates
        );
    },

    // Update a specific field in eslestirme document
    async updateField(docId: string, fieldPath: string, value: any): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>(
            `/eslestirmeler/${encodeURIComponent(docId)}`,
            { fieldPath, value }
        );
    },

    // Delete a specific field in eslestirme document
    async deleteField(docId: string, fieldPath: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.request<{ success: boolean; error?: string }>(
            `/eslestirmeler/${encodeURIComponent(docId)}`,
            {
                method: "DELETE",
                body: JSON.stringify({ fieldPath }),
            }
        );
    },
};
