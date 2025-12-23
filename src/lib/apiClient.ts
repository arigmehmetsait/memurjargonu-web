import { getValidToken } from "@/utils/tokenCache";

const BASE_URL = "/api/admin";

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiClient {
    private async getHeaders(): Promise<Record<string, string>> {
        try {
            const token = await getValidToken();
            return {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };
        } catch (error) {
            console.error("Token error:", error);
            throw new Error("Oturum açılamadı");
        }
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const headers = await this.getHeaders();

        const config: RequestInit = {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        };

        const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Bir hata oluştu");
        }


        return data;
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "GET" });
    }

    async post<T>(endpoint: string, body: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    async put<T>(endpoint: string, body: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }

    async patch<T>(endpoint: string, body: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    }
}

export const apiClient = new ApiClient();
