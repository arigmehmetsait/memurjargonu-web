import { apiClient } from "@/lib/apiClient";

export interface ProblemReport {
    id: string;
    description: string;
    problemType: string;
    status: "new" | "in_review" | "resolved";
    timestamp: any;
    userEmail: string;
    userId: string;
}

export const problemReportsService = {
    // List all problem reports
    async list(): Promise<{ success: boolean; data: ProblemReport[]; error?: string }> {
        return apiClient.get<{ success: boolean; data: ProblemReport[]; error?: string }>(
            "/problem-reports"
        );
    },

    // Update problem report status
    async updateStatus(
        reportId: string,
        status: "new" | "in_review" | "resolved"
    ): Promise<{ success: boolean; error?: string }> {
        return apiClient.patch<{ success: boolean; error?: string }>(
            "/problem-reports/status",
            { reportId, status }
        );
    },
};
