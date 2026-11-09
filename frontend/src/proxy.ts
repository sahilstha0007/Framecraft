import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed the middleware convention to `proxy` (proxy.ts).
// next-intl's middleware runs unchanged — the file just has to be called
// proxy.ts and expose a handler named `proxy` (default or named).
export default function proxy(request: NextRequest) {
  return createMiddleware(routing)(request);
}

export { proxy };

export const config = {
  // Match all paths except static assets, API routes and the admin backend.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
