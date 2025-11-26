import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

const COLLECTION = "duelloquestions";
const DOC_ID = "questions";

function ensureAdmin(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("AUTH_REQUIRED");
  }
  return authHeader.split("Bearer ")[1];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const token = ensureAdmin(req);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({ success: false, error: "Admin gerekli" });
    }

    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);

    if (req.method === "GET") {
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(200).json({
          success: true,
          data: {},
        });
      }
      return res.status(200).json({ success: true, data: doc.data() });
    }

    if (req.method === "PUT") {
      const { questions } = req.body;
      if (!questions || typeof questions !== "object") {
        return res.status(400).json({
          success: false,
          error: "Geçerli soru datası gerekli",
        });
      }

      await docRef.set(questions);

      return res.status(200).json({
        success: true,
        message: "Düello soruları güncellendi",
      });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    if ((error as Error).message === "AUTH_REQUIRED") {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    console.error("Duello questions API error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem sırasında hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

