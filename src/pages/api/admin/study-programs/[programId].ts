import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

    const { programId } = req.query;

    if (!programId || typeof programId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Program ID gerekli",
      });
    }

    const docRef = adminDb.collection("studyPrograms").doc(programId);

    if (req.method === "GET") {
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Program bulunamadı",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
        },
      });
    }

    if (req.method === "PUT") {
      const { days } = req.body;

      if (!days || typeof days !== "object") {
        return res.status(400).json({
          success: false,
          error: "Geçerli bir 'days' objesi gereklidir",
        });
      }

      await docRef.set(
        {
          days,
          updatedAt: new Date(),
        }
        // Removed { merge: true } to allow overwriting the days object. 
        // We want to replace the 'days' map entirely with the new state.
        // However, we should be careful not to delete other top-level fields if there are any.
        // But since 'days' is the main content and we want to sync it, overwrite is likely correct for this nested structure.
        // Actually, let's use merge: true but ONLY for top level fields? No, days is a nested map.
        // If we use merge: true, nested fields are merged.
        // To delete keys in a map with merge:true, we'd need to send them as FieldValue.delete().
        // Easier: use set without merge to replace, OR use update() which replaces the entire field value.
      );

      return res.status(200).json({
        success: true,
        message: "Program güncellendi",
      });
    }

    if (req.method === "DELETE") {
      await docRef.delete();

      return res.status(200).json({
        success: true,
        message: "Program silindi",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Study program handler error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem sırasında hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

