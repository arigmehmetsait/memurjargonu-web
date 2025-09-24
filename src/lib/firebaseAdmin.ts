import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Desteklediğimiz giriş yolları:
 * - FIREBASE_SERVICE_ACCOUNT_JSON  : Tek satır JSON (içinde \n kaçışlı)
 * - FIREBASE_SERVICE_ACCOUNT_BASE64: Tüm JSON'un Base64 hali
 */
function loadServiceAccount(): any {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  // Eğer environment değişkenleri yoksa, local service account dosyasını kullan
  if (!raw && !b64) {
    try {
      const fs = require("fs");
      const path = require("path");
      const serviceAccountPath = path.join(
        process.cwd(),
        "service-account..json"
      );

      if (fs.existsSync(serviceAccountPath)) {
        console.log(
          "Local service account dosyası kullanılıyor:",
          serviceAccountPath
        );
        raw = fs.readFileSync(serviceAccountPath, "utf8");
      } else {
        throw new Error(
          "Service account bulunamadı. .env.local içine " +
            "FIREBASE_SERVICE_ACCOUNT_JSON (tek satır JSON) veya " +
            "FIREBASE_SERVICE_ACCOUNT_BASE64 (Base64) ekleyin."
        );
      }
    } catch (fileError) {
      throw new Error(
        "Service account bulunamadı. .env.local içine " +
          "FIREBASE_SERVICE_ACCOUNT_JSON (tek satır JSON) veya " +
          "FIREBASE_SERVICE_ACCOUNT_BASE64 (Base64) ekleyin."
      );
    }
  }

  // Eğer Base64 verildiyse onu kullan
  if (b64) {
    try {
      const jsonText = Buffer.from(b64, "base64").toString("utf8");
      raw = jsonText;
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_BASE64 çözülemedi (geçersiz base64)."
      );
    }
  }

  // Bazı editörler env’yi yanlışlıkla çift tırnakla sarabiliyor: " {...} "
  if (raw && raw.startsWith('"') && raw.endsWith('"')) {
    raw = raw.slice(1, -1);
  }

  let sa: any;
  try {
    sa = JSON.parse(raw!);
  } catch (e) {
    throw new Error(
      "Service account JSON parse edilemedi. Env değeri bozuk görünüyor."
    );
  }

  // \n ve \r\n varyantlarını gerçek newline’a çevir
  if (typeof sa.private_key === "string") {
    sa.private_key = sa.private_key
      .replace(/\\r\\n/g, "\n") // \r\n kaçışlarını normalize et
      .replace(/\\n/g, "\n"); // \n kaçışlarını newline yap
  } else {
    throw new Error("private_key alanı string değil.");
  }

  // Hızlı doğrulama
  if (!sa.private_key.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "private_key PEM biçiminde görünmüyor (BEGIN PRIVATE KEY yok)."
    );
  }

  return sa;
}

const sa = loadServiceAccount();

export const adminApp = getApps().length
  ? getApp()
  : initializeApp({ credential: cert(sa) });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
