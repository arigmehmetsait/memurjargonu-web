// Firebase Cloud Messaging Service Worker
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

let messaging = null;

// Listen for Firebase config from main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    const firebaseConfig = event.data.config;
    if (firebaseConfig && !messaging) {
      firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      setupMessaging();
    }
  }
});

function setupMessaging() {
  if (!messaging) return;

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log(
      "[firebase-messaging-sw.js] Received background message ",
      payload
    );

    const notificationTitle =
      payload.notification?.title || payload.data?.title || "Yeni Bildirim";
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.message || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: payload.data || {},
    };

    return self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  });
}

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  const redirectUrl =
    event.notification.data?.redirectUrl ||
    event.notification.data?.click_action ||
    "/";

  // Open the app/page
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and send navigation message
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus().then(() => {
              // Send message to client to navigate
              client.postMessage({ type: "NOTIFICATION_CLICK", redirectUrl });
            });
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(redirectUrl);
        }
      })
  );
});
