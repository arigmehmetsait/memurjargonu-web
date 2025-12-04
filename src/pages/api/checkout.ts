import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1) Auth Check
    const authz = req.headers.authorization || "";
    const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: "No token" });
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || "test@example.com";

    // 2) Input Validation
    const { cart } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 3) Calculate Total & Prepare Basket
    let totalAmount = 0;
    const userBasket = [];
    const orderItems = [];

    // Get user's owned packages to prevent duplicate purchases
    const userDocSnap = await adminDb.collection("users").doc(uid).get();
    const userData = userDocSnap.exists ? userDocSnap.data() : {};
    const ownedPackages = userData?.ownedPackages || {};

    for (const item of cart) {
      // Verify price from DB to prevent tampering
      const planSnap = await adminDb.collection("plans").doc(item.id).get();
      if (!planSnap.exists) continue;
      
      const planData = planSnap.data();
      if (!planData?.isActive) continue;

      // Check if user already owns this package
      if (ownedPackages[planData.key] === true) {
        console.log(`User already owns package: ${planData.key}`);
        continue; // Skip this package
      }

      const price = parseFloat(planData.price);
      totalAmount += price;

      userBasket.push([planData.name, price.toString(), 1]); // Name, Price, Quantity
      orderItems.push({
        planId: item.id,
        name: planData.name,
        price: price,
        periodMonths: planData.periodMonths,
        key: planData.key
      });
    }

    if (totalAmount === 0) {
      return res.status(400).json({ 
        error: orderItems.length === 0 
          ? "Sepetinizdeki tüm paketlere zaten sahipsiniz" 
          : "Invalid cart total" 
      });
    }

    // 4) PayTR Configuration
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;
    
    if (!merchant_id || !merchant_key || !merchant_salt) {
      console.error("PayTR credentials missing");
      return res.status(500).json({ error: "Payment provider configuration error" });
    }

    const merchant_oid = "ORD" + crypto.randomBytes(4).toString("hex") + Date.now();
    const payment_amount = totalAmount * 100; // Kuruş cinsinden
    const currency = "TL";
    const user_ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const merchant_ok_url = process.env.NEXT_PUBLIC_SITE_URL + "/payment/success";
    const merchant_fail_url = process.env.NEXT_PUBLIC_SITE_URL + "/payment/fail";
    
    // Base64 encode basket
    const user_basket = Buffer.from(JSON.stringify(userBasket)).toString("base64");

    // Generate Token
    const no_installment = 1; // Taksit yok
    const max_installment = 0;
    const test_mode = 1; // 1 for test, 0 for production
    const user_name = "Test User"; // Gerçek uygulamada kullanıcı adını almalısınız
    const user_address = "Test Adres";
    const user_phone = "05555555555";
    const debug_on = 1;
    const timeout_limit = 30;

    const hash_str = 
      merchant_id + 
      user_ip + 
      merchant_oid + 
      email + 
      payment_amount + 
      user_basket + 
      no_installment + 
      max_installment + 
      currency + 
      test_mode;

    const paytr_token = crypto
      .createHmac("sha256", merchant_key)
      .update(hash_str + merchant_salt)
      .digest("base64");

    // 5) Call PayTR API
    const params = new URLSearchParams();
    params.append("merchant_id", merchant_id);
    params.append("user_ip", user_ip as string);
    params.append("merchant_oid", merchant_oid);
    params.append("email", email);
    params.append("payment_amount", payment_amount.toString());
    params.append("paytr_token", paytr_token);
    params.append("user_basket", user_basket);
    params.append("debug_on", debug_on.toString());
    params.append("no_installment", no_installment.toString());
    params.append("max_installment", max_installment.toString());
    params.append("user_name", user_name);
    params.append("user_address", user_address);
    params.append("user_phone", user_phone);
    params.append("merchant_ok_url", merchant_ok_url);
    params.append("merchant_fail_url", merchant_fail_url);
    params.append("timeout_limit", timeout_limit.toString());
    params.append("currency", currency);
    params.append("test_mode", test_mode.toString());

    const paytrRes = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const paytrData = await paytrRes.json();

    if (paytrData.status !== "success") {
      console.error("PayTR Error:", paytrData);
      return res.status(400).json({ error: paytrData.reason || "PayTR token error" });
    }

    // 6) Save Pending Order
    await adminDb.collection("orders").doc(merchant_oid).set({
      userId: uid,
      items: orderItems,
      totalAmount,
      currency: "TRY",
      provider: "paytr",
      status: "pending",
      createdAt: new Date(),
      merchant_oid
    });

    // 7) Return Token
    return res.status(200).json({
      token: paytrData.token,
      merchant_oid
    });

  } catch (e: any) {
    console.error("checkout error", e);
    return res.status(500).json({ error: e?.message ?? "internal" });
  }
}
