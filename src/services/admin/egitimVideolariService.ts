import { apiClient } from "@/lib/apiClient";

export interface EgitimVideoDocument {
    id: string;
    name: string;
    videoCount: number;
    videos: string[];
    [key: string]: any;
}

export interface EgitimVideoListResponse {
    success: boolean;
    data: EgitimVideoDocument[];
    error?: string;
}

export const egitimVideolariService = {
    // List all egitim video documents
    async list(): Promise<EgitimVideoListResponse> {
        return apiClient.get<EgitimVideoListResponse>("/egitim-videolari/list");
    },

    // Create new egitim video document
    async create(docId: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.post<{ success: boolean; error?: string }>(
            "/egitim-videolari/create",
            { docId }
        );
    },

    // Delete an egitim video document
    async delete(docId: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.delete<{ success: boolean; error?: string }>(
            `/egitim-videolari/${encodeURIComponent(docId)}`
        );
    },

    // Get details of a specific egitim video document
    async get(docId: string): Promise<{ success: boolean; data?: any; error?: string }> {
        return apiClient.get<{ success: boolean; data?: any; error?: string }>(
            `/egitim-videolari/${encodeURIComponent(docId)}`
        );
    },

    // Update an egitim video document
    async update(docId: string, updates: Record<string, any>): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>(
            `/egitim-videolari/${encodeURIComponent(docId)}`,
            updates
        );
    },

    // Get videos for a specific document
    async getVideos(docId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
        return apiClient.get<{ success: boolean; data?: any[]; error?: string }>(
            `/egitim-videolari/${encodeURIComponent(docId)}/videos`
        );
    },

    // Add a new video to a document
    async addVideo(docId: string, videoData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
        return apiClient.post<{ success: boolean; error?: string }>(
            `/egitim-videolari/${encodeURIComponent(docId)}/videos`,
            videoData
        );
    },

    // Update an existing video
    async updateVideo(docId: string, videoId: string, videoData: Record<string, any>): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>(
            `/egitim-videolari/${encodeURIComponent(docId)}/videos`,
            { videoId, ...videoData }
        );
    },

    // Delete a video
    async deleteVideo(docId: string, videoId: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.delete<{ success: boolean; error?: string }>(
            `/egitim-videolari/${encodeURIComponent(docId)}/videos?videoId=${encodeURIComponent(videoId)}`
        );
    },
};
