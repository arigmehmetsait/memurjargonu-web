import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";
import { Timestamp } from "firebase-admin/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
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

    const { title, message, redirectUrl, targetType, targetUserIds } =
      req.body as {
        title?: string;
        message?: string;
        redirectUrl?: string;
        targetType?: "all" | "specific";
        targetUserIds?: string[];
      };

    // Validasyon
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    if (
      targetType === "specific" &&
      (!targetUserIds || targetUserIds.length === 0)
    ) {
      return res
        .status(400)
        .json({ error: "targetUserIds required for specific target type" });
    }

    const messaging = getMessaging();
    let tokensToSend: string[] = [];
    let totalSent = 0;

    if (targetType === "all") {
      // Tüm kullanıcıların token'larını al
      const userTokensSnapshot = await adminDb.collection("userTokens").get();
      const allTokens: string[] = [];

      userTokensSnapshot.forEach((doc) => {
        const data = doc.data();
        const tokens = data.tokens || [];
        allTokens.push(...tokens);
      });

      tokensToSend = allTokens;
    } else if (targetType === "specific" && targetUserIds) {
      // Seçili kullanıcıların token'larını al
      const userTokenDocs = await Promise.all(
        targetUserIds.map((userId) =>
          adminDb.collection("userTokens").doc(userId).get()
        )
      );

      const specificTokens: string[] = [];
      const usersWithoutTokens: string[] = [];

      userTokenDocs.forEach((doc, index) => {
        if (doc.exists) {
          const data = doc.data();
          const tokens = data?.tokens || [];
          if (tokens.length > 0) {
            specificTokens.push(...tokens);
          } else {
            usersWithoutTokens.push(targetUserIds[index]);
          }
        } else {
          usersWithoutTokens.push(targetUserIds[index]);
        }
      });

      tokensToSend = specificTokens;

      // Eğer hiç token yoksa, hangi kullanıcıların token'ı olmadığını bildir
      if (tokensToSend.length === 0) {
        return res.status(400).json({
          error:
            "Seçili kullanıcıların hiçbirinde FCM token kayıtlı değil. Kullanıcıların giriş yapıp bildirim izni vermesi gerekiyor.",
          usersWithoutTokens: usersWithoutTokens,
          totalUsers: targetUserIds.length,
        });
      }

      // Bazı kullanıcıların token'ı yoksa uyarı ver ama gönder
      if (usersWithoutTokens.length > 0) {
        console.warn(
          `Some users don't have tokens: ${usersWithoutTokens.join(", ")}`
        );
      }
    }

    if (tokensToSend.length === 0) {
      if (targetType === "all") {
        return res.status(400).json({
          error:
            "Hiçbir kullanıcıda FCM token kayıtlı değil. Kullanıcıların giriş yapıp bildirim izni vermesi gerekiyor.",
        });
      }
      return res
        .status(400)
        .json({ error: "No tokens found to send notifications" });
    }

    // FCM mesaj yapısı
    const notificationPayload = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        redirectUrl: redirectUrl || "/",
        click_action: redirectUrl || "/",
      },
      webpush: {
        fcmOptions: {
          link: redirectUrl || "/",
        },
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          clickAction: redirectUrl || "/",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    // Bildirimleri gönder (batch olarak - FCM maksimum 500 token destekler)
    const batchSize = 500;
    const batches: string[][] = [];

    for (let i = 0; i < tokensToSend.length; i += batchSize) {
      batches.push(tokensToSend.slice(i, i + batchSize));
    }

    const sendPromises = batches.map(async (batch) => {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          ...notificationPayload,
        });

        return {
          success: response.successCount,
          failure: response.failureCount,
        };
      } catch (error) {
        console.error("Error sending batch:", error);
        return {
          success: 0,
          failure: batch.length,
        };
      }
    });

    const results = await Promise.all(sendPromises);
    totalSent = results.reduce((sum, result) => sum + result.success, 0);

    // Bildirim geçmişini Firestore'a kaydet
    const notificationData = {
      title,
      message,
      redirectUrl: redirectUrl || "/",
      targetType: targetType || "all",
      targetUserIds: targetType === "specific" ? targetUserIds : [],
      sentAt: Timestamp.now(),
      sentBy: decoded.uid,
      totalSent,
    };

    await adminDb.collection("notifications").add(notificationData);

    res.status(200).json({
      success: true,
      message: `Bildirim başarıyla gönderildi`,
      totalSent,
      totalTokens: tokensToSend.length,
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      error: error.message || "Failed to send notification",
    });
  }
}
