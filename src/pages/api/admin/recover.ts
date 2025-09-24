import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { targetUid, adminUid, secretKey } = req.body;

    // Güvenlik kontrolü - sadece belirli secret key ile çalışsın
    if (secretKey !== process.env.ADMIN_RECOVERY_SECRET) {
      return res.status(403).json({ error: "Invalid secret key" });
    }

    if (!targetUid || !adminUid) {
      return res.status(400).json({ error: "targetUid and adminUid required" });
    }

    // Admin UID'yi seed listesinden kontrol et
    const seedUids = (process.env.ADMIN_SEED_UIDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!seedUids.includes(adminUid)) {
      return res.status(403).json({ error: "Admin UID not in seed list" });
    }

    // Hedef kullanıcının mevcut claims'lerini al
    const currentUser = await adminAuth.getUser(targetUid);
    const currentClaims = currentUser.customClaims || {};

    // Admin yetkisini ekle (mevcut claims'leri koruyarak)
    const newClaims = { ...currentClaims, admin: true };

    // Custom claims'i güncelle
    await adminAuth.setCustomUserClaims(targetUid, newClaims);

    // Refresh token'ları iptal et (kullanıcının yeniden giriş yapması için)
    await adminAuth.revokeRefreshTokens(targetUid);

    console.log(
      `Admin yetkisi kurtarıldı: ${targetUid} - ${currentUser.email}`
    );

    res.status(200).json({
      success: true,
      message: "Admin yetkisi başarıyla kurtarıldı",
      userEmail: currentUser.email,
    });
  } catch (error: any) {
    console.error("Admin kurtarma hatası:", error);
    res.status(500).json({
      error: "Admin kurtarma işlemi başarısız",
      details: error.message,
    });
  }
}
