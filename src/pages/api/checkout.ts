import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  try {
    // 1) Auth
    const authz = req.headers.authorization || "";
    const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "No token" });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // 2) Input
    const { planId } = req.body as { planId?: string };
    if (!planId) return res.status(400).json({ error: "planId required" });

    // 3) Plan doğrula
    const planSnap = await adminDb.collection("plans").doc(planId).get();
    if (!planSnap.exists)
      return res.status(404).json({ error: "Plan not found" });
    const plan = planSnap.data() as any;
    if (!plan.isActive) return res.status(400).json({ error: "Plan inactive" });

    // 4) Pending order
    const orderRef = adminDb.collection("orders").doc(); // autoId
    await orderRef.set({
      userId: uid,
      planId,
      planKey: plan.key,
      amount: plan.price,
      currency: plan.currency || "TRY",
      periodMonths: plan.periodMonths,
      provider: "paytr", // PayTR entegrasyonu için hazır
      status: "pending",
      createdAt: new Date(),
    });

    // PayTR entegrasyonu yarın eklenecek
    return res.status(200).json({
      orderId: orderRef.id,
      message: "Sipariş oluşturuldu. Ödeme entegrasyonu yakında eklenecek.",
    });
  } catch (e: any) {
    console.error("checkout error", e);
    return res.status(500).json({ error: e?.message ?? "internal" });
  }
}
