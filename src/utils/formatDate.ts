// src/utils/formatDate.ts

import { Timestamp } from "firebase/firestore";

/**
 * Tarih formatlar (Türkçe)
 * Farklı timestamp formatlarını handle eder:
 * - Firebase Timestamp
 * - Date objesi
 * - Unix timestamp (number)
 * - String tarih
 * - Null/undefined
 */
export function formatDate(
  timestamp: Date | Timestamp | string | number | null | undefined | any
): string {
  if (!timestamp) return "-";

  try {
    let date: Date;

    // Firebase Timestamp objesi
    if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
      date = timestamp.toDate();
    }
    // Firebase Firestore timestamp formatı (_seconds, _nanoseconds)
    else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    }
    // Alternatif format (seconds)
    else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    // Unix timestamp (number)
    else if (typeof timestamp === "number") {
      // Eğer 10 haneli ise saniye cinsinden, değilse milisaniye
      date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
    }
    // Date objesi
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // String veya diğer
    else {
      date = new Date(timestamp);
    }

    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return "Geçersiz tarih";
    }

    return date.toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Date parsing error:", error, timestamp);
    return "Geçersiz tarih";
  }
}

