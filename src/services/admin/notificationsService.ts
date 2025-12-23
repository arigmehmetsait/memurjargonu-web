import { apiClient } from "@/lib/apiClient";

export interface NotificationHistory {
    id: string;
    title: string;
    message: string;
    redirectUrl: string;
    targetType: "all" | "specific";
    targetUserIds: string[];
    sentAt: number;
    sentBy: string;
    totalSent: number;
}

export interface SendNotificationParams {
    title: string;
    message: string;
    redirectUrl: string;
    targetType: "all" | "specific";
    targetUserIds?: string[];
}

export interface HistoryResponse {
    notifications: NotificationHistory[];
    nextCursor: string | null;
    hasMore: boolean;
}

export const notificationsService = {
    // Send notification
    async send(params: SendNotificationParams): Promise<{
        success: boolean;
        totalSent?: number;
        usersWithoutTokens?: string[];
        error?: string;
    }> {
        return apiClient.post("/admin/notifications/send", params);
    },

    // Get notification history
    async getHistory(pageSize = 20, cursor?: string): Promise<HistoryResponse & { success?: boolean; error?: string }> {
        const params = new URLSearchParams({ pageSize: String(pageSize) });
        if (cursor) params.append("cursor", cursor);

        return apiClient.get(`/admin/notifications/history?${params.toString()}`);
    },
};
