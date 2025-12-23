import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userRecord = await adminAuth.getUser(decodedToken.uid);
        const customClaims = userRecord.customClaims || {};

        if (!customClaims.admin) {
            return res.status(403).json({ error: "Admin yetkisi gerekli" });
        }

        const { name, price, currency, periodMonths, key, features, images, index } = req.body;

        if (!name || !key || price === undefined) {
            return res.status(400).json({ error: "Eksik bilgi: isim, key ve fiyat zorunludur" });
        }

        const newPlan = {
            name,
            price: Number(price),
            currency: currency || "TRY",
            periodMonths: Number(periodMonths) || 1,
            key,
            features: features || [],
            images: images || [],
            index: Number(index) || 0,
            isActive: false, // Default to inactive
            createdAt: new Date(),
        };

        const docRef = await adminDb.collection("plans").add(newPlan);

        return res.status(200).json({
            success: true,
            data: {
                id: docRef.id,
                ...newPlan,
            },
        });
    } catch (error) {
        console.error("Plan creation error:", error);
        return res.status(500).json({
            success: false,
            error: "Plan oluşturulurken hata oluştu",
            details: error instanceof Error ? error.message : "Bilinmeyen hata",
        });
    }
}
