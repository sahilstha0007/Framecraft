import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { config } from "./config";
import { healthRoutes } from "./routes/health";
import { adminRoutes, adminAnalyticsRoutes } from "./routes/admin";
import { activityRoutes } from "./routes/activity";
import { authRoutes, bootstrapSellerRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { productsRoutes } from "./routes/products";
import { ordersRoutes } from "./routes/orders";
import { bidsRoutes } from "./routes/bids";
import { postsRoutes } from "./routes/posts";
import { socialRoutes } from "./routes/social";
import { reviewsRoutes } from "./routes/reviews";
import { notificationsRoutes } from "./routes/notifications";
import { sellersRoutes } from "./routes/sellers";
import { sellerRoutes } from "./routes/seller";
import { paymentsRoutes } from "./routes/payments";
import { settingsRoutes, settingsWriteRoutes } from "./routes/settings";

/* ── Rate limiting (fixed-window, in-memory) ─────────────────────────────
   Protects the expensive/abusable surfaces: credential guessing on /api/auth,
   gateway calls + order placement on /api/payments and POST /api/orders.
   Single-node only — swap for Redis when this scales past one instance. */
const windows = new Map<string, { count: number; resetAt: number }>();

function hitLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = windows.get(key);
  if (!bucket || bucket.resetAt <= now) {
    // Opportunistic cleanup so the map can't grow without bound.
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

const LIMITS: { test: RegExp; max: number; windowMs: number }[] = [
  { test: /^\/api\/auth\/login$/, max: 10, windowMs: 60_000 },
  { test: /^\/api\/auth\/register$/, max: 20, windowMs: 60_000 },
  { test: /^\/api\/payments/, max: 20, windowMs: 60_000 },
  { test: /^\/api\/orders$/, max: 20, windowMs: 60_000 },
];

export const app = new Elysia()
  .use(cors({ origin: config.frontendOrigins, credentials: true }))
  // onRequest runs before routing for EVERY request — including routes
  // registered through .use() plugins (onBeforeHandle does not).
  .onRequest(({ request }) => {
    const path = new URL(request.url).pathname;
    for (const rule of LIMITS) {
      if (!rule.test.test(path)) continue;
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      if (hitLimit(`${ip}:${rule.test.source}`, rule.max, rule.windowMs)) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please slow down." }),
          { status: 429, headers: { "content-type": "application/json" } }
        );
      }
    }
  })
  // Never let the browser cache account-scoped responses (shared machines).
  .onAfterHandle(({ set, path }) => {
    if (/^\/api\/(auth|my|seller|me|customers|settings|payments)/.test(path)) {
      set.headers["Cache-Control"] = "private, no-store";
    }
  })
  .onError(({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not Found" };
    }
    if (code === "VALIDATION" || code === "PARSE") {
      set.status = 400;
      const details =
        code === "PARSE"
          ? error.message
          : ((error as { all?: unknown }).all ?? error.message);
      return { error: "Invalid request", details };
    }
    console.error(`[api] unhandled ${code}:`, error);
    set.status = 500;
    return { error: "Internal Server Error" };
  })
  .get("/api", () => ({
    name: "Kala Bazaar API",
    version: "2.0.0",
    endpoints: [
      "GET /api/health",
      "GET /api/auth/me",
      "POST /api/auth/register | login | logout",
      "POST /api/auth/bootstrap-seller (x-admin-key)",
      "GET /api/users · PATCH/DELETE /api/users/:id (admin)",
      "GET /api/products?category=&search=&featured=&auction=&status=",
      "GET /api/products/:id · GET /api/products/:id/bids",
      "POST /api/products/:id/bid (customer) · GET /api/me/bids (customer)",
      "POST /api/orders (customer) · GET /api/my/orders (customer)",
      "GET /api/orders · PATCH /api/orders/:id (admin)",
      "GET /api/posts · GET /api/posts/:slug · POST/PUT/DELETE /api/posts (seller)",
      "GET /api/sellers · GET /api/sellers/:id · POST/DELETE /api/sellers/:id/follow",
      "POST/DELETE /api/products/:id/like · GET /api/me/likes",
      "GET/POST /api/comments · DELETE /api/comments/:id",
      "GET/POST /api/products/:id/reviews · PUT /api/reviews/:id/reply",
      "GET /api/seller/products|posts|orders|analytics (vendor shop)",
      "POST /api/payments/checkout · GET /api/payments/verify/khalti|esewa",
      "PUT /api/me/profile · PUT /api/me/password",
      "GET /api/settings · PUT /api/settings (admin)",
      "GET /api/admin/analytics (admin)",
      "POST/PUT/DELETE /api/products (admin session required)",
    ],
  }))
  .use(healthRoutes)
  .use(activityRoutes)
  .use(authRoutes)
  .use(bootstrapSellerRoutes)
  .use(usersRoutes)
  .use(productsRoutes)
  .use(ordersRoutes)
  .use(bidsRoutes)
  .use(postsRoutes)
  .use(socialRoutes)
  .use(reviewsRoutes)
  .use(notificationsRoutes)
  .use(sellersRoutes)
  .use(sellerRoutes)
  .use(paymentsRoutes)
  .use(settingsRoutes)
  .use(settingsWriteRoutes)
  .use([...adminRoutes, adminAnalyticsRoutes]);

export type App = typeof app;
