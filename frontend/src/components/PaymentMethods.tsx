"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";

// Brand accent colors (kept in sync with each provider's identity).
const BRAND_COLORS = [
  "text-[#60BB46] border-[#60BB46]/35 bg-[#60BB46]/[0.05]", // eSewa green
  "text-[#5C2D91] border-[#5C2D91]/35 bg-[#5C2D91]/[0.05]", // Khalti purple
  "text-[#E4174E] border-[#E4174E]/35 bg-[#E4174E]/[0.05]", // Fonepay pink
  "text-[#1F6FEB] border-[#1F6FEB]/35 bg-[#1F6FEB]/[0.05]", // Bank transfer blue
  "text-[#9b1b30] border-[#9b1b30]/35 bg-[#9b1b30]/[0.05]", // Cash maroon
];

/**
 * The payment methods Nepali customers actually use — eSewa, Khalti,
 * Fonepay, bank transfer and cash on delivery. Renders a compact strip of
 * brand-colored chips with a headline and note from i18n.
 */
export default function PaymentMethods() {
  const t = useTranslations("payment");
  const items = t.raw("items") as string[];

  return (
    <div className="relative p-6 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
      <span
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
        aria-hidden="true"
      />
      <div className="flex items-center gap-2 mb-3">
        <BadgeCheck size={15} className="text-gold-400" />
        <h3 className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/40">
          {t("title")}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((name, i) => (
          <span
            key={name}
            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border ${BRAND_COLORS[i % BRAND_COLORS.length]}`}
          >
            {name}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-charcoal-500 dark:text-white/35 leading-relaxed">
        {t("note")}
      </p>
    </div>
  );
}
