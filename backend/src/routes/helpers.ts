/** Shared helpers used across API route modules. */

export const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

/** Statuses a seller can move a booking or quote through. */
export const REQUEST_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
] as const;

export const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Extract the starting amount from a display range like "NPR 6,500 - 18,500"
 * (or the legacy "$89 - $249"). Commas are stripped so 6,500 → 6500.
 */
export function parseBasePrice(priceRange: string): number {
  const match = priceRange.match(/([\d,]+(?:\.\d+)?)/);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}
