import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
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

    const { reportId, status } = req.body;

    if (!reportId || !status) {
      return res.status(400).json({
        success: false,
        error: "reportId ve status gerekli",
      });
    }

    // Geçerli status kontrolü
    const validStatuses = ["new", "in_review", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz status değeri",
      });
    }

    // Status güncelle
    await adminDb.collection("problem_reports").doc(reportId).update({
      status: status,
      updatedAt: new Date(),
      updatedBy: decodedToken.uid,
    });

    return res.status(200).json({
      success: true,
      message: "Status başarıyla güncellendi",
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({
      success: false,
      error: "Status güncellenirken hata oluştu",
    });
  }
}
