import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
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

        const snapshot = await adminDb.collection("plans").orderBy("index", "asc").get();

        const plans = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.status(200).json({
            success: true,
            data: plans,
        });
    } catch (error) {
        console.error("Plans list error:", error);
        return res.status(500).json({
            success: false,
            error: "Planlar yüklenirken hata oluştu",
            details: error instanceof Error ? error.message : "Bilinmeyen hata",
        });
    }
}
