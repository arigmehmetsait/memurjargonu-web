import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFCMToken, onMessageListener } from "@/lib/fcm";

export function useFCM() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeFCM = async (user: User | null) => {
      if (!user) {
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const fcmToken = await getFCMToken();
        setToken(fcmToken);

        if (fcmToken) {
          // Token'ı backend'e kaydet
          try {
            const idToken = await user.getIdToken();
            const response = await fetch("/api/notifications/register-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                token: fcmToken,
                platform: "web",
              }),
            });

            if (!response.ok) {
              console.error("Failed to register FCM token");
            }
          } catch (err) {
            console.error("Error registering FCM token:", err);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to initialize FCM");
        console.error("FCM initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Auth state değişikliğini dinle
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      await initializeFCM(user);
    });

    // Foreground mesajları dinle
    onMessageListener()
      .then((payload) => {
        if (payload) {
          console.log("Message received in foreground:", payload);
          // Burada bildirimi gösterebilirsiniz (örn: toast notification)
          if (payload.notification) {
            // Tarayıcı bildirimi göster
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(payload.notification.title || "Yeni Bildirim", {
                body: payload.notification.body,
                icon: "/favicon.ico",
                data: payload.data,
              });
            }
          }
        }
      })
      .catch((err) => {
        console.error("Error in message listener:", err);
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { token, loading, error };
}

