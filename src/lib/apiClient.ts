import { getValidToken } from "@/utils/tokenCache";

const BASE_URL = "/api/admin";

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiClient {
    private async getHeaders(body?: any): Promise<Record<string, string>> {
        try {
            const token = await getValidToken();
            const headers: Record<string, string> = {
                Authorization: `Bearer ${token}`,
            };

            // FormData gönderilirken Content-Type header'ını ekleme
            // Browser otomatik olarak multipart/form-data ekler
            if (!(body instanceof FormData)) {
                headers["Content-Type"] = "application/json";
            }

            return headers;
        } catch (error) {
            console.error("Token error:", error);
            throw new Error("Oturum açılamadı");
        }
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const body = options.body;
        const headers = await this.getHeaders(body);

        const config: RequestInit = {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        };

        const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

        const response = await fetch(url, config);

        // Response'un JSON olup olmadığını kontrol et
        const contentType = response.headers.get("content-type");
        const isJson = contentType?.includes("application/json");

        if (!isJson) {
            // JSON değilse (örneğin HTML 404 sayfası), hata fırlat
            const text = await response.text();
            console.error("Non-JSON response:", text.substring(0, 200));
            throw new Error(
                response.status === 404
                    ? "Endpoint bulunamadı (404)"
                    : `Beklenmeyen yanıt formatı (${response.status})`
            );
        }

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
        // FormData ise stringify etme, aksi halde JSON.stringify yap
        const requestBody = body instanceof FormData ? body : JSON.stringify(body);
        return this.request<T>(endpoint, {
            method: "POST",
            body: requestBody,
        });
    }

    async put<T>(endpoint: string, body: any): Promise<T> {
        // FormData ise stringify etme, aksi halde JSON.stringify yap
        const requestBody = body instanceof FormData ? body : JSON.stringify(body);
        return this.request<T>(endpoint, {
            method: "PUT",
            body: requestBody,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }

    async patch<T>(endpoint: string, body: any): Promise<T> {
        // FormData ise stringify etme, aksi halde JSON.stringify yap
        const requestBody = body instanceof FormData ? body : JSON.stringify(body);
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: requestBody,
        });
    }
}

export const apiClient = new ApiClient();
