import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

type Query = {
  pageSize?: string;
  cursor?: string;
};

function enc(v: any) {
  return Buffer.from(JSON.stringify(v)).toString("base64url");
}

function dec<T = any>(v?: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(Buffer.from(v, "base64url").toString());
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Admin yetkisi kontrolü
    const idToken = (req.headers.authorization || "").replace("Bearer ", "");
    if (!idToken) {
      return res.status(401).json({ error: "No token" });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { pageSize = "20", cursor } = req.query as Query;
    const size = Math.min(Math.max(parseInt(pageSize || "20", 10) || 20, 1), 100);
    const cur = dec<{ sentAt: number; id: string }>(cursor || null);

    let query = adminDb
      .collection("notifications")
      .orderBy("sentAt", "desc")
      .limit(size + 1);

    if (cur) {
      const cursorDoc = await adminDb.collection("notifications").doc(cur.id).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > size;
    const notifications = (hasMore ? docs.slice(0, size) : docs).map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        message: data.message,
        redirectUrl: data.redirectUrl,
        targetType: data.targetType,
        targetUserIds: data.targetUserIds || [],
        sentAt: data.sentAt?.toMillis() || Date.now(),
        sentBy: data.sentBy,
        totalSent: data.totalSent || 0,
      };
    });

    const nextCursor = hasMore && notifications.length > 0
      ? enc({
          sentAt: notifications[notifications.length - 1].sentAt,
          id: notifications[notifications.length - 1].id,
        })
      : null;

    res.status(200).json({
      notifications,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    console.error("Error fetching notification history:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch notification history",
    });
  }
}


