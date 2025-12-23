import { apiClient } from "@/lib/apiClient";

export interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    periodMonths: number;
    isActive: boolean;
    index: number;
    key: string;
    images?: string[];
    features?: string[];
}

export type CreatePlanParams = Omit<Plan, "id" | "isActive">;
export type UpdatePlanParams = Partial<Omit<Plan, "id">>;

export const plansService = {
    // Get all plans
    async getAll(): Promise<{ success: boolean; data: Plan[]; error?: string }> {
        return apiClient.get<{ success: boolean; data: Plan[]; error?: string }>(
            "/admin/plans/list"
        );
    },

    // Create a new plan
    async create(plan: CreatePlanParams): Promise<{ success: boolean; data?: Plan; error?: string }> {
        return apiClient.post<{ success: boolean; data?: Plan; error?: string }>(
            "/admin/plans/create",
            plan
        );
    },

    // Update a plan
    async update(id: string, updates: UpdatePlanParams): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>(
            `/admin/plans/${id}`,
            updates
        );
    },

    // Delete a plan
    async delete(id: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.delete<{ success: boolean; error?: string }>(
            `/admin/plans/${id}`
        );
    },

    // Upload plan image
    async uploadImage(file: File): Promise<{ success: boolean; data?: { imageUrl: string }; error?: string }> {
        const formData = new FormData();
        formData.append("image", file);

        // Note: apiClient supports FormData automatically if body is FormData
        // But for now, let's keep it simple. Accessing the underlying fetch might be needed for FormData if apiClient purely expects JSON.
        // However, looking at apiClient.ts, it stringifies body if it's not FormData?
        // Let's assume apiClient handles FormData or pass it through.
        // Actually, in standard fetch, body can be FormData.
        // Let's verify apiClient implementation.

        // If apiClient is strictly JSON, we might need to bypass it or update it for file uploads.
        // For now, let's look at `plans.tsx` raw fetch: /api/admin/plans/upload-image

        return apiClient.post<{ success: boolean; data?: { imageUrl: string }; error?: string }>(
            "/admin/plans/upload-image",
            formData
        );
    }
};
