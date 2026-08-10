"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";

type LocaleCode = "en" | "ne";

const OPTIONS: Array<{ code: LocaleCode; label: string }> = [
  { code: "en", label: "EN" },
  { code: "ne", label: "नेपाली" },
];

/**
 * Segmented EN | नेपाली toggle. The active language is highlighted by a
 * sliding gold pill; clicking the other segment swaps locale while staying on
 * the current route (locale-aware `usePathname`/`useRouter`).
 */
export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();

  const activeIndex = locale === "ne" ? 1 : 0;

  const switchTo = (code: LocaleCode) => {
    if (code === locale) return;
    router.replace(pathname, { locale: code });
  };

  return (
    <div
      role="group"
      aria-label={t("switchLanguage")}
      className="relative grid grid-cols-2 w-[136px] h-9 shrink-0 rounded-full border border-charcoal-200/80 dark:border-white/15 bg-white/40 dark:bg-white/[0.04] p-1"
    >
      {/* Sliding active highlight */}        <motion.span
          aria-hidden="true"
          initial={false}
          className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gold-600 dark:bg-gold-500 shadow-sm shadow-gold-600/30"
          animate={{ x: activeIndex === 0 ? "0%" : "100%" }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />

      {OPTIONS.map((opt, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => switchTo(opt.code)}
            aria-pressed={isActive}
            aria-label={opt.code === "en" ? t("english") : t("nepali")}
            title={opt.code === "en" ? t("english") : t("nepali")}
            className={`relative z-10 flex items-center justify-center h-7 rounded-full text-[0.7rem] font-semibold tracking-wide whitespace-nowrap select-none transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
              isActive
                ? "text-white"
                : "text-charcoal-600/70 dark:text-white/60 hover:text-gold-600 dark:hover:text-gold-400"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
