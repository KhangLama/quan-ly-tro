import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

/**
 * Sort room codes naturally (e.g. P1, P2, P3, ..., P9, P10 instead of P1, P10, P2)
 */
export function compareRoomCodes(
  a: { code?: string } | string,
  b: { code?: string } | string
): number {
  const codeA = typeof a === "string" ? a : a?.code || "";
  const codeB = typeof b === "string" ? b : b?.code || "";
  return codeA.localeCompare(codeB, "vi", { numeric: true, sensitivity: "base" });
}

