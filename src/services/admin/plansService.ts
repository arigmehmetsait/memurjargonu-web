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
            "/plans/list"
        );
    },

    // Create a new plan
    async create(plan: CreatePlanParams): Promise<{ success: boolean; data?: Plan; error?: string }> {
        return apiClient.post<{ success: boolean; data?: Plan; error?: string }>(
            "/plans/create",
            plan
        );
    },

    // Update a plan
    async update(id: string, updates: UpdatePlanParams): Promise<{ success: boolean; error?: string }> {
        return apiClient.put<{ success: boolean; error?: string }>(
            `/plans/${id}`,
            updates
        );
    },

    // Delete a plan
    async delete(id: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.delete<{ success: boolean; error?: string }>(
            `/plans/${id}`
        );
    },

    // Upload plan image
    async uploadImage(file: File): Promise<{ success: boolean; data?: { imageUrl: string }; error?: string }> {
        const formData = new FormData();
        formData.append("image", file);

        return apiClient.post<{ success: boolean; data?: { imageUrl: string }; error?: string }>(
            "/plans/upload-image",
            formData
        );
    }
};
