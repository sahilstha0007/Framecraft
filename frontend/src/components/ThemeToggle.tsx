"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Theme toggle — a 3-state cycle: System → Light → Dark.
 *
 * Uses next-themes' `useTheme` (see ThemeProvider) instead of manually poking
 * `document.documentElement.classList` + localStorage. next-themes:
 *   - applies the class BEFORE first paint (no flash of the wrong theme),
 *   - live-tracks the OS preference in "system" mode,
 *   - persists the explicit choice to localStorage,
 *   - resolves `theme` vs `resolvedTheme` correctly across SSR.
 */
export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("nav");
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: the icon depends on the resolved theme which is
  // only known on the client. Render a neutral placeholder until mounted.
  useEffect(() => setMounted(true), []);

  // Cycle: system → light → dark → system.
  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  // The label reflects what the toggle DOES next. It is only computed once
  // mounted — on the server (and during hydration) `theme` is the default
  // "system", but on the client it resolves to a stored light/dark choice,
  // so deriving the aria-label early would cause an attribute hydration
  // mismatch. The pre-mount value matches what the server rendered.
  const label = mounted
    ? theme === "system"
      ? t("switchToLight")
      : theme === "light"
        ? t("switchToDark")
        : t("switchToSystem")
    : t("switchToLight");

  // Icon reflects the CURRENT resolved state. Same mounted guard so the
  // server and client agree on first paint (invisible Sun reserves the slot).
  const Icon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <button
      onClick={cycle}
      className="relative p-2 rounded-full text-charcoal-600 dark:text-cream-300 hover:text-gold-600 dark:hover:text-gold-400 transition-colors cursor-pointer
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
      aria-label={label}
      title={label}
    >
      {/* The keyed span remounts on theme change, which drives the icon swap
          animation (initial → animate) — no AnimatePresence needed. */}
      <motion.span
        key={mounted ? theme : "placeholder"}
        initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="block"
      >
        {mounted ? <Icon size={18} /> : <Sun size={18} className="opacity-0" />}
      </motion.span>
    </button>
  );
}
