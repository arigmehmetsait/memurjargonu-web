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
    // Token doğrulama
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Admin yetkisi kontrolü (Custom Claims ile)
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({ error: "Admin yetkisi gerekli" });
    }

    // Problem reports'ları getir
    const reportsRef = adminDb.collection("problem_reports");
    const snapshot = await reportsRef
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Problem reports fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Problem reports yüklenirken hata oluştu",
    });
  }
}
