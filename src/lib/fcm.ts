import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { app } from "./firebase";

let messagingInstance: Messaging | null = null;

export function getMessagingInstance(): Messaging {
  if (!messagingInstance) {
    if (typeof window !== "undefined") {
      messagingInstance = getMessaging(app);
    }
  }
  return messagingInstance!;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    const messaging = getMessagingInstance();
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error("VAPID key is not set. Please add NEXT_PUBLIC_FIREBASE_VAPID_KEY to your .env.local");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
    });

    if (token) {
      return token;
    } else {
      console.warn("No registration token available.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
}

export function onMessageListener(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const messaging = getMessagingInstance();
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}

