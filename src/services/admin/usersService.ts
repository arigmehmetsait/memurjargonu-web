import { apiClient } from "@/lib/apiClient";

export interface UserRow {
    id: string;
    email: string;
    forumNickname: string;
    isPremium: boolean;
    premiumExpiry: string | null;
    isBlocked: boolean;
    lastUpdated: any;
    ownedPackages?: Record<string, boolean>;
    packageExpiryDates?: Record<string, any>;
    activePackages?: string[];
    totalActivePackages?: number;
}

export interface ListUsersParams {
    q?: string;
    premium?: "all" | "true" | "false";
    pageSize?: number;
    cursor?: string | null;
}

export interface ListUsersResponse {
    success: boolean;
    rows: UserRow[];
    nextCursor?: string;
}

export interface EditUserParams {
    uid: string;
    email: string;
    forumNickname: string;
    isPremium: boolean;
    isBlocked: boolean;
}

export interface PremiumActionParams {
    email: string;
    months: number;
    action: "grant" | "revoke";
}

export const usersService = {
    // List users with pagination and filtering
    async list(params: ListUsersParams): Promise<ListUsersResponse> {
        const searchParams = new URLSearchParams();
        if (params.q) searchParams.append("q", params.q);
        if (params.premium) searchParams.append("premium", params.premium);
        if (params.pageSize) searchParams.append("pageSize", String(params.pageSize));
        if (params.cursor) searchParams.append("cursor", params.cursor);

        return apiClient.get<ListUsersResponse>(`/users/list?${searchParams.toString()}`);
    },

    // Edit user details
    async edit(data: EditUserParams): Promise<{ success: boolean; message?: string }> {
        return apiClient.post<{ success: boolean; message?: string }>("/users/edit", data);
    },

    // Block/Unblock user
    async toggleBlock(uid: string, isBlocked: boolean): Promise<{ success: boolean; message?: string }> {
        return apiClient.post<{ success: boolean; message?: string }>("/users/block", { uid, isBlocked });
    },

    // Grant/Revoke Premium
    async managePremium(data: PremiumActionParams): Promise<{ success: boolean; message?: string }> {
        return apiClient.post<{ success: boolean; message?: string }>("/users/premium", data);
    }
};
