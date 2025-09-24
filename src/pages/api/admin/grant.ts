import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const idToken = (req.headers.authorization || "").replace("Bearer ", "");
  if (!idToken) return res.status(401).json({ error: "No token" });

  const decoded = await adminAuth.verifyIdToken(idToken);
  const requesterUid = decoded.uid;

  const seed = (process.env.ADMIN_SEED_UIDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!seed.includes(requesterUid)) {
    return res.status(403).json({ error: "not allowed" });
  }

  const { targetUid } = req.body as { targetUid?: string };
  if (!targetUid) return res.status(400).json({ error: "targetUid required" });

  // mevcut claimleri koruyarak admin:true ekleyelim
  const current = (await adminAuth.getUser(targetUid)).customClaims || {};
  await adminAuth.setCustomUserClaims(targetUid, { ...current, admin: true });
  await adminAuth.revokeRefreshTokens(targetUid);

  res.status(200).json({ ok: true });
}
