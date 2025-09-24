import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { iyzicoClient, iyzicoCall } from "@/lib/iyzico";
import Iyzipay from "iyzipay";
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
      provider: "iyzico",
      status: "pending",
      createdAt: new Date(),
    });

    // 5) Iyzico checkout form initialize
    const iyzico = iyzicoClient();
    const conversationId = orderRef.id;
    const paidPrice = String(
      plan.price.toFixed ? plan.price.toFixed(2) : plan.price
    );
    const callbackUrl = `${process.env.PUBLIC_URL}/api/webhooks/iyzico?orderId=${conversationId}`;

    const initPayload: Iyzipay.CheckoutFormInitializeRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: paidPrice,
      paidPrice,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: conversationId,
      callbackUrl,
      paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION, // veya PRODUCT
      buyer: {
        id: uid,
        name: "Uye",
        surname: "Uye",
        gsmNumber: "+905555555555",
        email: decoded.email || "user@example.com",
        identityNumber: "11111111111",
        registrationAddress: "Istanbul",
        ip:
          req.headers["x-forwarded-for"]?.toString() ||
          req.socket.remoteAddress ||
          "127.0.0.1",
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: "Uye",
        city: "Istanbul",
        country: "Turkey",
        address: "Istanbul",
      },
      billingAddress: {
        contactName: "Uye",
        city: "Istanbul",
        country: "Turkey",
        address: "Istanbul",
      },
      basketItems: [
        {
          id: planId,
          name: plan.name,
          category1: "Membership",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: paidPrice,
        },
      ],
    };

    const result = await iyzicoCall<Iyzipay.CheckoutFormInitializeResponse>(
      (cb) => iyzico.checkoutFormInitialize.create(initPayload, cb)
    );

    // 6) Frontend’de iframe/form olarak basılacak HTML
    return res.status(200).json({
      orderId: orderRef.id,
      checkoutFormContent: result.checkoutFormContent, // iyzico'nun dön­düğü HTML
    });
  } catch (e: any) {
    console.error("checkout error", e);
    return res.status(500).json({ error: e?.message ?? "internal" });
  }
}
