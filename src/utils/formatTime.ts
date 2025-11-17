// src/utils/formatTime.ts

import { Timestamp } from "firebase/firestore";

export function formatTime(date: Date | Timestamp | null | undefined) {
  if (!date) return "-";

  const actualDate = date instanceof Date ? date : date.toDate();

  const hours = actualDate.getHours().toString().padStart(2, "0");
  const minutes = actualDate.getMinutes().toString().padStart(2, "0");
  const seconds = actualDate.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

