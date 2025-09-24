import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Admin yetkisi kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!decodedToken.admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { uid, isBlocked } = req.body;

    if (!uid || isBlocked === undefined) {
      return res.status(400).json({ error: "UID and isBlocked are required" });
    }

    const auth = getAuth();
    const db = getFirestore();

    // Kullanıcıyı Firebase Auth'da engelle/engeli kaldır
    await auth.updateUser(uid, {
      disabled: isBlocked,
    });

    // Firestore'da kullanıcı durumunu güncelle
    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        isBlocked: isBlocked,
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    res.status(200).json({
      success: true,
      message: `Kullanıcı ${isBlocked ? "engellendi" : "engeli kaldırıldı"}`,
    });
  } catch (error: any) {
    console.error("Block user error:", error);
    res.status(500).json({
      error: error.message || "Kullanıcı engellenirken hata oluştu",
    });
  }
}
