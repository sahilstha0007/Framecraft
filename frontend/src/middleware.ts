import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Detects the visitor's preferred language from Accept-Language (and the
// NEXT_LOCALE cookie if set), then rewrites /en/… and /ne/… routes and
// redirects the bare root to the matched locale.
export default createMiddleware(routing);

export const config = {
  // Match all paths except static assets, API routes and the admin backend.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
