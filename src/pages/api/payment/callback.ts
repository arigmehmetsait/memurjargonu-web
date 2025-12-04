import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { PackageType } from "@/types/package";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // PayTR sends data as x-www-form-urlencoded
    const {
      merchant_oid,
      status,
      total_amount,
      hash,
      failed_reason_code,
      failed_reason_msg,
    } = req.body;

    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_key || !merchant_salt) {
      console.error("PayTR credentials missing");
      return res.status(500).send("Internal Server Error");
    }

    // 1) Hash Verification
    const hash_str = merchant_oid + merchant_salt + status + total_amount;
    const calculated_hash = crypto
      .createHmac("sha256", merchant_key)
      .update(hash_str)
      .digest("base64");

    if (calculated_hash !== hash) {
      console.error("PayTR hash mismatch", { incoming: hash, calculated: calculated_hash });
      return res.status(400).send("PAYTR notification failed: bad hash");
    }

    // 2) Process Order
    const orderRef = adminDb.collection("orders").doc(merchant_oid);

    if (status === "success") {
      await adminDb.runTransaction(async (tx) => {
        // FIRST: All reads must happen before any writes
        const snap = await tx.get(orderRef);
        if (!snap.exists) throw new Error("Order not found: " + merchant_oid);
        
        const order = snap.data() as any;
        if (order.status === "paid") return; // Already processed

        // Read user data
        const userRef = adminDb.collection("users").doc(order.userId);
        const userDoc = await tx.get(userRef);
        const userData = userDoc.exists ? userDoc.data() : {};

        // SECOND: Now perform all writes
        // Update Order Status
        tx.update(orderRef, {
          status: "paid",
          paidAt: new Date(),
          providerRef: "PAYTR",
          paymentAmount: total_amount
        });

        // Update User Packages
        const ownedPackages = userData?.ownedPackages || {};
        const packageExpiryDates = userData?.packageExpiryDates || {};
        let isPremium = userData?.isPremium || false;
        let premiumExpiryDate = userData?.premiumExpiryDate || null;

        // Iterate over items in the order
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + (item.periodMonths || 1));

            ownedPackages[item.key] = true;
            packageExpiryDates[item.key] = Timestamp.fromDate(expiresAt);

            // Check for KPSS_FULL compatibility
            if (item.key === PackageType.KPSS_FULL) {
              isPremium = true;
              premiumExpiryDate = Timestamp.fromDate(expiresAt);
            }
          }
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

      // Refresh User Claims
      const orderSnap = await orderRef.get();
      const orderData = orderSnap.data() as any;
      if (orderData?.userId) {
        // We set a generic premium claim if they bought any package, 
        // or we could be more specific. For now, let's stick to existing logic 
        // which seems to rely on 'premium' claim for general access or specific checks.
        // The mock.ts set 'premium: true' based on premiumExpiryDate.
        
        // Let's re-read the user to get the latest expiry
        const userSnap = await adminDb.collection("users").doc(orderData.userId).get();
        const uData = userSnap.data();
        
        if (uData?.isPremium) {
           const expDate = uData.premiumExpiryDate?.toDate();
           const expMs = expDate ? expDate.getTime() : Date.now() + 30*24*60*60*1000;
           
           // Get existing custom claims to preserve them (especially admin claim)
           const userRecord = await adminAuth.getUser(orderData.userId);
           const existingClaims = userRecord.customClaims || {};
           
           // Merge new premium claims with existing claims
           await adminAuth.setCustomUserClaims(orderData.userId, {
             ...existingClaims,
             premium: true,
             premiumExp: expMs,
           });
           // Note: Not revoking refresh tokens to avoid logging user out
           // Claims will be updated on next natural token refresh
        }
      }

    } else {
      // Payment Failed
      await orderRef.update({
        status: "failed",
        failedReason: failed_reason_msg || failed_reason_code,
        failedAt: new Date()
      });
    }

    // 3) Return OK
    return res.status(200).send("OK");

  } catch (e: any) {
    console.error("PayTR callback error", e);
    return res.status(500).send("Internal Server Error");
  }
}
