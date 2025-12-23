import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { planId } = req.query;

    if (!planId || typeof planId !== "string") {
        return res.status(400).json({ error: "Invalid plan ID" });
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

        const docRef = adminDb.collection("plans").doc(planId);

        if (req.method === "PUT") {
            const updates = req.body;

            // Basic validation if needed
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: "Güncellenecek veri yok" });
            }

            // Add updatedAt timestamp
            const updateData = {
                ...updates,
                updatedAt: new Date(),
            };

            await docRef.update(updateData);

            return res.status(200).json({
                success: true,
                message: "Plan güncellendi",
            });
        }
        else if (req.method === "DELETE") {
            await docRef.delete();

            return res.status(200).json({
                success: true,
                message: "Plan silindi",
            });
        }
        else {
            return res.status(405).json({ error: "Method not allowed" });
        }
    } catch (error) {
        console.error(`Plan operation error (${req.method}):`, error);
        return res.status(500).json({
            success: false,
            error: "İşlem sırasında hata oluştu",
            details: error instanceof Error ? error.message : "Bilinmeyen hata",
        });
    }
}
