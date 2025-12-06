"use client";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CartProvider } from "@/context/CartContext";
import { useFCM } from "@/hooks/useFCM";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { token, loading: fcmLoading } = useFCM();

  useEffect(() => {
    // Service worker'ı kaydet ve Firebase config'i gönder
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // Firebase config'i service worker'a gönder
          if (registration.active) {
            const firebaseConfig = {
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
              authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
              messagingSenderId:
                process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
              appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            };
            registration.active.postMessage({
              type: "FIREBASE_CONFIG",
              config: firebaseConfig,
            });
          } else if (registration.installing) {
            registration.installing.addEventListener("statechange", () => {
              if (registration.installing?.state === "activated") {
                const firebaseConfig = {
                  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                  storageBucket:
                    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                  messagingSenderId:
                    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                };
                registration.active?.postMessage({
                  type: "FIREBASE_CONFIG",
                  config: firebaseConfig,
                });
              }
            });
          }
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    // Service worker message handler - notification click
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICK") {
        const redirectUrl = event.data.redirectUrl || "/";
        router.push(redirectUrl);
      }
    };

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }

    return () => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, [router]);

  return (
    <CartProvider>
      <Component {...pageProps} />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
        theme="colored"
      />
    </CartProvider>
  );
}
