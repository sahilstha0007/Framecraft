import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // English + Nepali for the FrameCraft audience.
  locales: ["en", "ne"],
  defaultLocale: "en",
  // Every route is prefixed (/en/…, /ne/…) so links are explicit and
  // shareable; the middleware auto-redirects the bare root to a locale.
  localePrefix: "always",
});
