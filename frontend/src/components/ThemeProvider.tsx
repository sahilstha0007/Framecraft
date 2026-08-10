"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * Theme provider — the SSR-safe, flash-free way to do dark/light mode in the
 * Next.js App Router.
 *
 * - `attribute="class"`      → toggles the `dark` class on <html>, matching
 *                             the Tailwind v4 dark variant in globals.css.
 * - `defaultTheme="system"`  → first-time visitors follow their OS setting.
 * - `enableSystem`           → live-tracks `prefers-color-scheme` changes.
 * - `disableTransitionOnChange` → no ugly global color-transition flash while
 *                             every element re-skins.
 *
 * next-themes injects a tiny inline script in <head> that reads the stored
 * theme (or the OS preference) BEFORE first paint, so there is never a flash
 * of the wrong theme — the exact problem the old ThemeToggle had.
 */
export default function ThemeProvider(props: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    />
  );
}
