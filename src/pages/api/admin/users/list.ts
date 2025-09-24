import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldPath, Timestamp } from "firebase-admin/firestore";

type Query = {
  q?: string;
  premium?: "all" | "true" | "false";
  pageSize?: string;
  cursor?: string; // base64
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
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // auth
    const idToken = (req.headers.authorization || "").replace("Bearer ", "");
    if (!idToken) return res.status(401).json({ error: "No token" });
    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded?.admin) return res.status(403).json({ error: "not admin" });

    const {
      q = "",
      premium = "all",
      pageSize = "20",
      cursor,
    } = req.query as Query;
    const size = Math.min(
      Math.max(parseInt(pageSize || "20", 10) || 20, 1),
      100
    );
    const cur = dec<{ ts: number; id: string }>(cursor || null);

    // Arama terimi normalize et
    const qnorm = (q || "").trim().toLowerCase();

    // Arama varsa: daha geniş strategi kullan
    if (qnorm) {
      // Arama yaparken tüm veriyi çekmek için büyük limit kullan
      const searchFetchSize = 1000; // Arama için daha yüksek limit

      let qref = adminDb.collection("users") as any;

      // Premium filtresi ÖNCE uygulanır
      if (premium === "true") {
        qref = qref.where("isPremium", "==", true);
      } else if (premium === "false") {
        qref = qref.where("isPremium", "==", false);
      }

      // Arama için ordering
      qref = qref
        .orderBy("lastUpdated", "desc")
        .orderBy(FieldPath.documentId(), "desc");

      const snap = await qref.limit(searchFetchSize).get();

      // Kayıtları toparla ve geliştirilmiş email çekme
      const allItems = snap.docs.map((d: any) => {
        const data = d.data() as any;

        // Email'i daha kapsamlı şekilde çek
        let email = "";
        if (data.email) {
          email = data.email;
        } else if (data.devices?.[0]?.email) {
          email = data.devices[0].email;
        } else if (data.profile?.email) {
          email = data.profile.email;
        } else if (data.auth?.email) {
          email = data.auth.email;
        }

        return {
          id: d.id,
          email: email || "",
          forumNickname: data.forumNickname || "",
          isPremium: !!data.isPremium,
          premiumExpiry: data.packageExpiryDates?.premiumExpiryDate || null,
          isBlocked: !!data.isBlocked,
          lastUpdated: data.lastUpdated || null,
        };
      });

      // Geliştirilmiş arama filtresi - hem exact hem de partial match
      const filtered = allItems.filter((r: any) => {
        const searchText = qnorm;
        const id = r.id.toLowerCase();
        const email = r.email.toLowerCase();
        const nickname = r.forumNickname.toLowerCase();

        // Exact matches (öncelik)
        if (
          id === searchText ||
          email === searchText ||
          nickname === searchText
        ) {
          return true;
        }

        // Partial matches
        return (
          id.includes(searchText) ||
          email.includes(searchText) ||
          nickname.includes(searchText)
        );
      });

      // Sonuçları relevansta sırala (exact match'ler önce)
      filtered.sort((a: any, b: any) => {
        const aId = a.id.toLowerCase();
        const aEmail = a.email.toLowerCase();
        const aNick = a.forumNickname.toLowerCase();
        const bId = b.id.toLowerCase();
        const bEmail = b.email.toLowerCase();
        const bNick = b.forumNickname.toLowerCase();

        // Exact match kontrolü
        const aExact = aId === qnorm || aEmail === qnorm || aNick === qnorm;
        const bExact = bId === qnorm || bEmail === qnorm || bNick === qnorm;

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // İkisi de exact ya da ikisi de partial ise lastUpdated'e göre sırala
        const aTime = a.lastUpdated?.toMillis?.() || 0;
        const bTime = b.lastUpdated?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Sayfalama için sonuçları kes
      const items = filtered.slice(0, size);

      return res.status(200).json({
        rows: items,
        nextCursor: null, // Arama modunda pagination yok
        count: items.length,
        hasMore: false,
        searchTotal: filtered.length, // Toplam arama sonucu sayısı
      });
    }

    // Normal listeleme modu (arama yok)
    const fetchSize = size;
    let qref = adminDb.collection("users") as any;

    // Premium filtresi ÖNCE uygulanır (index efficiency için)
    if (premium === "true") {
      qref = qref.where("isPremium", "==", true);
    } else if (premium === "false") {
      qref = qref.where("isPremium", "==", false);
    }

    // Sonra ordering (filtered query üzerine)
    qref = qref
      .orderBy("lastUpdated", "desc")
      .orderBy(FieldPath.documentId(), "desc");

    // Cursor (pagination)
    if (cur && cur.ts && cur.id) {
      try {
        const timestamp = Timestamp.fromMillis(cur.ts);
        qref = qref.startAfter(timestamp, cur.id);
      } catch (error) {
        console.error("Cursor decode error:", error);
        // Invalid cursor - start from beginning
      }
    }

    const snap = await qref.limit(fetchSize).get();

    // kayıtları toparla
    const allItems = snap.docs.map((d: any) => {
      const data = d.data() as any;

      // Email'i daha kapsamlı şekilde çek
      let email = "";
      if (data.email) {
        email = data.email;
      } else if (data.devices?.[0]?.email) {
        email = data.devices[0].email;
      } else if (data.profile?.email) {
        email = data.profile.email;
      } else if (data.auth?.email) {
        email = data.auth.email;
      }

      return {
        id: d.id,
        email: email || "",
        forumNickname: data.forumNickname || "",
        isPremium: !!data.isPremium,
        premiumExpiry: data.packageExpiryDates?.premiumExpiryDate || null,
        isBlocked: !!data.isBlocked,
        lastUpdated: data.lastUpdated || null,
      };
    });

    const filtered = allItems;

    // Arama sonuçlarından sadece istenen sayıda kayıt al
    const items = filtered.slice(0, size);

    // next cursor - sadece arama yoksa ve tüm veri çekilmediyse cursor oluştur
    const hasMore =
      snap.docs.length === fetchSize && (!qnorm || filtered.length > size);
    const nextCursor =
      hasMore && snap.docs.length > 0
        ? (() => {
            const last = snap.docs[snap.docs.length - 1];
            const lastUpdatedValue = last?.get("lastUpdated");
            let lastTs: number;
            if (lastUpdatedValue?.toMillis) {
              // Firestore Timestamp
              lastTs = lastUpdatedValue.toMillis();
            } else if (lastUpdatedValue instanceof Date) {
              // JavaScript Date
              lastTs = lastUpdatedValue.getTime();
            } else if (typeof lastUpdatedValue === "string") {
              // String date
              lastTs = Date.parse(lastUpdatedValue);
            } else if (typeof lastUpdatedValue === "number") {
              // Unix timestamp
              lastTs = lastUpdatedValue;
            } else {
              // Fallback
              lastTs = Date.now();
            }
            return enc({ ts: lastTs, id: last.id });
          })()
        : null;

    res.status(200).json({
      rows: items,
      nextCursor,
      count: items.length,
      hasMore: !!nextCursor,
    });
  } catch (error: any) {
    console.error("Users list API error:", error);
    console.error("Error stack:", error.stack);
    console.error("Request query:", req.query);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
}
