/**
 * Small helpers for the Nepali-market presentation: Devanagari numerals,
 * the Bikram Sambat year, and locale-aware NPR price strings.
 */

const DEVANAGARI_DIGITS: Record<string, string> = {
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

/** Convert every ASCII digit in a string to its Devanagari equivalent. */
export function toDevanagariDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[d]);
}

/**
 * Bikram Sambat year for a Gregorian date. Nepal now uses the Gregorian
 * calendar administratively, but the Nepali year is still the culturally
 * familiar reference (e.g. २०८३ for 2026). Approximation: BS ≈ AD + 57
 * (valid for dates after mid-April, which is when the BS year turns).
 */
export function bsYear(date: Date = new Date()): number {
  return date.getFullYear() + 57;
}

/** The current Bikram Sambat year as Devanagari digits (e.g. "२०८३"). */
export function formatBsYear(date: Date = new Date()): string {
  return toDevanagariDigits(bsYear(date));
}

/**
 * Locale-aware NPR amount: "रु २,५००" in the Nepali locale (Devanagari
 * digits), "NPR 2,500" elsewhere. Grouping is deterministic (en-US) so the
 * number never depends on the visitor's browser locale.
 */
export function formatNPR(amount: number, locale: string): string {
  const digits = amount.toLocaleString("en-US");
  return locale === "ne" ? `रु ${toDevanagariDigits(digits)}` : `NPR ${digits}`;
}

/**
 * Localize a full price string — ranges like "NPR 6,500 - 18,500" or single
 * amounts — for the Nepali locale (Devanagari numerals + "रु"). Other
 * locales pass through unchanged.
 */
export function localizePrice(price: string, locale: string): string {
  if (locale !== "ne") return price;
  return price
    .replace(/NPR/gi, "रु")
    .replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[d]);
}
