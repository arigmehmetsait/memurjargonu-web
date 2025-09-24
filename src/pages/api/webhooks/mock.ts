// pages/api/webhooks/mock.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { PackageType } from "@/types/package";
import { Timestamp } from "firebase-admin/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) return res.status(400).json({ error: "orderId required" });

    const orderRef = adminDb.collection("orders").doc(orderId);

    // Idempotent işlem
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) throw new Error("order not found");
      const order = snap.data() as any;
      if (order.status === "paid") return;

      // expiry = şimdi + periodMonths
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + (order.periodMonths || 1));

      // order -> paid
      tx.update(orderRef, { status: "paid", paidAt: now, providerRef: "TEST" });

      // Yeni paket sistemi ile kullanıcı paketini güncelle
      const userRef = adminDb.collection("users").doc(order.userId);
      const userDoc = await tx.get(userRef);
      const userData = userDoc.exists ? userDoc.data() : {};

      // Paket bilgilerini güncelle
      const ownedPackages = userData?.ownedPackages || {};
      const packageExpiryDates = userData?.packageExpiryDates || {};

      ownedPackages[order.planKey] = true;
      packageExpiryDates[order.planKey] = Timestamp.fromDate(expiresAt);

      // KPSS Full paket için eski uyumluluk alanlarını güncelle
      let isPremium = userData?.isPremium || false;
      let premiumExpiryDate = userData?.premiumExpiryDate || null;

      if (order.planKey === PackageType.KPSS_FULL) {
        isPremium = true;
        premiumExpiryDate = Timestamp.fromDate(expiresAt);
      }

      tx.set(
        userRef,
        {
          ownedPackages,
          packageExpiryDates,
          isPremium,
          premiumExpiryDate,
          lastUpdated: Timestamp.now(),
        },
        { merge: true }
      );
    });

    // Custom claims (premium) + tokenları revoke
    const order = (await orderRef.get()).data() as any;
    if (order?.userId) {
      const expiresAt = (
        await adminDb.collection("users").doc(order.userId).get()
      ).data()?.packageExpiryDates?.premiumExpiryDate;
      const expMs = expiresAt ? Date.parse(expiresAt) : Date.now();
      await adminAuth.setCustomUserClaims(order.userId, {
        premium: true,
        premiumExp: expMs,
      });
      await adminAuth.revokeRefreshTokens(order.userId);
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("mock webhook error", e);
    return res.status(500).json({ error: e?.message ?? "internal" });
  }
}
