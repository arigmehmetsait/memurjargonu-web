import { getValidToken } from "@/utils/tokenCache";

export interface DuelloQuestion {
    id: string;
    question: string;
    options: string[];
    answer: string;
    index: number;
}

const API_URL = "/api/admin/duello-questions";

export const duelloQuestionsService = {
    async fetchQuestions(): Promise<Record<string, any>> {
        const token = await getValidToken();
        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Sorular yüklenemedi");
        }

        return data.data || {};
    },

    async saveQuestions(questions: DuelloQuestion[]): Promise<void> {
        const token = await getValidToken();

        // Clean and sort data before saving
        // Structure: { general: [ ...questions ] }
        const cleanedQuestions = questions
            .sort((a, b) => a.index - b.index)
            .map((q, i) => ({
                question: q.question,
                answer: q.answer,
                index: i, // Re-index strictly 0, 1, 2...
                options: q.options
            }));

        const payload = {
            general: cleanedQuestions
        };

        const response = await fetch(API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ questions: payload }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Kaydedilemedi");
        }
    },
};
