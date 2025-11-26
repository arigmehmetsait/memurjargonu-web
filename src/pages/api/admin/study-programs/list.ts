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

    const snapshot = await adminDb.collection("studyPrograms").get();

    const programs = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const days = data.days || {};
      const dayKeys = Object.keys(days);
      const totalActivities = dayKeys.reduce((sum, key) => {
        const activities = Array.isArray(days[key]) ? days[key] : [];
        return sum + activities.length;
      }, 0);

      return {
        id: doc.id,
        name: doc.id,
        dayCount: dayKeys.length,
        activityCount: totalActivities,
        updatedAt: data.updatedAt || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error("Study programs list error:", error);
    return res.status(500).json({
      success: false,
      error: "Ders programları yüklenirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

