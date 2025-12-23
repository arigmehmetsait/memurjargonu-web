import { apiClient } from "@/lib/apiClient";

export interface StudyProgram {
    id: string;
    title: string;
    startDate: {
        _seconds: number;
        _nanoseconds: number;
    } | string; // Handle both Firestore timestamp and string if needed
    dayCount: number;
    createdAt: any;
    // Summary fields
}

export interface StudyProgramDetail extends StudyProgram {
    days: Record<string, any[]>;
}

export interface CreateProgramParams {
    programId: string;
}

export const studyProgramsService = {
    // Fetch all programs (summary)
    async getAll(): Promise<{ data: StudyProgram[] }> {
        return apiClient.get<{ data: StudyProgram[] }>("/study-programs/list");
    },

    // Get single program detail
    async getById(id: string): Promise<{ success: boolean; data: StudyProgramDetail }> {
        return apiClient.get<{ success: boolean; data: StudyProgramDetail }>(`/study-programs/${id}`);
    },

    // Create new program
    async create(data: CreateProgramParams): Promise<{ success: boolean; message: string; id?: string }> {
        return apiClient.post<{ success: boolean; message: string; id?: string }>("/study-programs/create", data);
    },

    // Update program (save days etc.)
    async update(id: string, data: { days: any }): Promise<{ success: boolean; message: string }> {
        return apiClient.put<{ success: boolean; message: string }>(`/study-programs/${id}`, data);
    },

    // Delete program
    async delete(id: string): Promise<{ success: boolean; message: string }> {
        return apiClient.delete<{ success: boolean; message: string }>(`/study-programs/${id}`);
    }
};
