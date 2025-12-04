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

    const { uid, email, forumNickname, isPremium, isBlocked } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    const auth = getAuth();
    const db = getFirestore();

    // Kullanıcıyı Firebase Auth'da güncelle
    if (isBlocked !== undefined) {
      await auth.updateUser(uid, {
        disabled: isBlocked,
      });
    }

    // Firestore'da kullanıcı bilgilerini güncelle
    const userRef = db.collection("users").doc(uid);
    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (forumNickname !== undefined) {
      updateData.forumNickname = forumNickname;
    }

    if (isPremium !== undefined) {
      updateData.isPremium = isPremium;
      if (isPremium) {
        // Premium veriliyorsa, 1 yıl sonra bitiş tarihi ekle
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        updateData.premiumExpiry = expiryDate;
      } else {
        // Premium kaldırılıyorsa, bitiş tarihini kaldır
        updateData.premiumExpiry = null;
      }

      // Custom claims'i güncelle (admin claim'ini koru)
      const userRecord = await adminAuth.getUser(uid);
      const existingClaims = userRecord.customClaims || {};
      
      const expiryDate = isPremium 
        ? (() => {
            const exp = new Date();
            exp.setFullYear(exp.getFullYear() + 1);
            return exp.getTime();
          })()
        : null;

      await adminAuth.setCustomUserClaims(uid, {
        ...existingClaims, // Admin claim'ini koru
        premium: isPremium,
        premiumExp: expiryDate || Date.now(),
      });
      
      // Not: revokeRefreshTokens çağrılmıyor çünkü kullanıcıyı otomatik çıkış yaptırır
      // Custom claims değişiklikleri bir sonraki token yenilemede otomatik yansıyacak
    }

    if (isBlocked !== undefined) {
      updateData.isBlocked = isBlocked;
    }

    await userRef.set(updateData, { merge: true });

    res.status(200).json({
      success: true,
      message: "Kullanıcı bilgileri başarıyla güncellendi",
    });
  } catch (error: any) {
    console.error("Edit user error:", error);
    res.status(500).json({
      error: error.message || "Kullanıcı güncellenirken hata oluştu",
    });
  }
}
