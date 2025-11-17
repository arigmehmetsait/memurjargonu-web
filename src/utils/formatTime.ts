// src/utils/formatTime.ts

import { Timestamp } from "firebase/firestore";

export function formatTime(
  date: Date | Timestamp | null | undefined | any
): string {
  if (!date) return "-";

  let actualDate: Date;

  // Date objesi kontrolü
  if (date instanceof Date) {
    actualDate = date;
  }
  // Firebase Timestamp kontrolü (toDate metodu varsa)
  else if (date && typeof date.toDate === "function") {
    actualDate = date.toDate();
  }
  // Timestamp objesi kontrolü (_seconds property'si varsa)
  else if (date && typeof date._seconds === "number") {
    actualDate = new Date(date._seconds * 1000);
  }
  // String veya number ise Date'e çevir
  else {
    actualDate = new Date(date);
  }

  // Geçersiz tarih kontrolü
  if (isNaN(actualDate.getTime())) {
    return "-";
  }

  const hours = actualDate.getHours().toString().padStart(2, "0");
  const minutes = actualDate.getMinutes().toString().padStart(2, "0");
  const seconds = actualDate.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

