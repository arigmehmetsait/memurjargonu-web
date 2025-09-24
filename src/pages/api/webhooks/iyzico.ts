import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { iyzicoClient, iyzicoCall } from "@/lib/iyzico";
import { packageService } from "@/services/packageService";
import { PackageType } from "@/types/package";
import { Timestamp } from "firebase-admin/firestore";
import type {
  CheckoutFormRetrieveRequest,
  CheckoutFormRetrieveResponse,
} from "iyzipay";

/**
 * Iyzi, callbackUrl'e POST yapar ve body'de "token" verir.
 * Biz de token ile server-to-server "retrieve" çağrısı yapıp sonucu doğrularız.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const orderId = req.query.orderId as string | undefined;
    if (!orderId) return res.status(400).json({ error: "orderId missing" });

    const token = (req.body?.token as string) || (req.body as any)?.token;
    if (!token) return res.status(400).json({ error: "token missing" });

    const iyzico = iyzicoClient();
    const retrievePayload: CheckoutFormRetrieveRequest = { token };
    const result = await iyzicoCall<CheckoutFormRetrieveResponse>((cb) =>
      iyzico.checkoutForm.retrieve(retrievePayload, cb)
    );

    const paymentStatusOk =
      result?.paymentStatus === "SUCCESS" ||
      (Array.isArray(result?.paymentItems) &&
        result.paymentItems.every((i: any) => i.paymentTransactionId));

    const orderRef = adminDb.collection("orders").doc(orderId);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) throw new Error("order not found");
      const order = snap.data() as any;
      if (order.status === "paid") return; // idempotent

      if (!paymentStatusOk) {
        tx.update(orderRef, {
          status: "failed",
          providerRef: result?.token || null,
        });
        return;
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + (order.periodMonths || 1));

      tx.update(orderRef, {
        status: "paid",
        paidAt: now,
        providerRef: result?.token || null,
        raw: {
          status: result?.paymentStatus,
          iyziId: result?.paymentId || null,
        },
      });

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

    // claims + revoke
    const order = (await orderRef.get()).data() as any;
    if (order?.userId) {
      const user = (
        await adminDb.collection("users").doc(order.userId).get()
      ).data() as any;
      const expIso = user?.packageExpiryDates?.premiumExpiryDate;
      const expMs = expIso ? Date.parse(expIso) : Date.now();
      await adminAuth.setCustomUserClaims(order.userId, {
        premium: true,
        premiumExp: expMs,
      });
      await adminAuth.revokeRefreshTokens(order.userId);
    }

    // Iyzi genelde kullanıcıyı callback dönüşünde "success page"e yönlendirmeni bekler.
    // JSON döndürmek yerine bir teşekkür sayfasına 302 de atabilirsin:
    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("iyzico webhook error", e);
    return res.status(500).json({ error: e?.message ?? "internal" });
  }
}
