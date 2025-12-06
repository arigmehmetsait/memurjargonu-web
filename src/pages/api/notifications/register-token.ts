import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Auth kontrolü
    const idToken = (req.headers.authorization || "").replace("Bearer ", "");
    if (!idToken) {
      return res.status(401).json({ error: "No token" });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const { token, platform = "web" } = req.body as {
      token?: string;
      platform?: string;
    };

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // userTokens collection'ında token'ı kaydet/güncelle
    const userTokenRef = adminDb.collection("userTokens").doc(userId);

    const userTokenDoc = await userTokenRef.get();

    if (userTokenDoc.exists) {
      // Mevcut token'ları al
      const existingData = userTokenDoc.data();
      const existingTokens = existingData?.tokens || [];
      
      // Token zaten varsa güncelle, yoksa ekle
      if (!existingTokens.includes(token)) {
        await userTokenRef.update({
          tokens: FieldValue.arrayUnion(token),
          updatedAt: Timestamp.now(),
          platform: platform, // web veya mobile
        });
      } else {
        // Token zaten var, sadece updatedAt'i güncelle
        await userTokenRef.update({
          updatedAt: Timestamp.now(),
          platform: platform,
        });
      }
    } else {
      // Yeni kayıt oluştur
      await userTokenRef.set({
        userId: userId,
        tokens: [token],
        updatedAt: Timestamp.now(),
        platform: platform,
      });
    }

    res.status(200).json({ success: true, message: "Token registered successfully" });
  } catch (error: any) {
    console.error("Error registering token:", error);
    res.status(500).json({
      error: error.message || "Failed to register token",
    });
  }
}

