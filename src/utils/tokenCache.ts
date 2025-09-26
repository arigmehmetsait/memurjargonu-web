import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Global token cache
let tokenCache: {
  token: string | null;
  expiryTime: number;
} = { token: null, expiryTime: 0 };

/**
 * Cache'li token alma fonksiyonu
 * API çağrıları için optimize edilmiş token yönetimi
 */
export async function getValidToken(): Promise<string> {
  const now = Date.now();

  // Cache'de geçerli token varsa kullan (60 saniye güvenlik payı)
  if (tokenCache.token && tokenCache.expiryTime > now + 60000) {
    return tokenCache.token;
  }

  // auth.currentUser hazır olmayabilir; hazır olana kadar bekle
  if (!auth.currentUser) {
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
      });
    });
  }

  try {
    // Önce cached token dene (false = cached)
    const token = await auth.currentUser!.getIdToken(false);

    // Cache'e kaydet (45 dakika geçerli)
    tokenCache = {
      token,
      expiryTime: now + 45 * 60 * 1000,
    };

    return token;
  } catch (error) {
    // Cached token başarısızsa fresh token al
    const freshToken = await auth.currentUser!.getIdToken(true);
    tokenCache = {
      token: freshToken,
      expiryTime: now + 45 * 60 * 1000,
    };
    return freshToken;
  }
}

/**
 * Token cache'i temizle
 * Logout durumunda kullanılabilir
 */
export function clearTokenCache(): void {
  tokenCache = { token: null, expiryTime: 0 };
}
