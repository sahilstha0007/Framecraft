import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { config } from "./config";
import { healthRoutes } from "./routes/health";
import { framesRoutes } from "./routes/frames";
import { galleryRoutes } from "./routes/gallery";
import { servicesRoutes } from "./routes/services";
import { testimonialsRoutes } from "./routes/testimonials";
import { teamRoutes } from "./routes/team";
import { optionsRoutes } from "./routes/options";
import { quoteRoutes } from "./routes/quote";
import { bookingsRoutes, myRequestsRoutes } from "./routes/bookings";
import { contactRoutes } from "./routes/contact";
import { newsletterRoutes } from "./routes/newsletter";
import { adminRoutes } from "./routes/admin";
import { authRoutes, bootstrapSellerRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { productsRoutes } from "./routes/products";
import { ordersRoutes } from "./routes/orders";
import { bidsRoutes } from "./routes/bids";
import { postsRoutes } from "./routes/posts";
import { socialRoutes } from "./routes/social";
import { sellersRoutes } from "./routes/sellers";
import { sellerRoutes } from "./routes/seller";
import { paymentsRoutes } from "./routes/payments";
import { settingsRoutes, settingsWriteRoutes } from "./routes/settings";

export const app = new Elysia()
  .use(cors({ origin: config.frontendOrigin, credentials: true }))
  // Never let the browser cache account-scoped responses (shared machines).
  .onAfterHandle(({ set, path }) => {
    if (/^\/api\/(auth|my|seller|me|bookings|quotes|customers|settings|payments)/.test(path)) {
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
    name: "FrameCraft API",
    version: "1.0.0",
    endpoints: [
      "GET /api/health",
      "GET /api/frames?category=&popular=&search=",
      "GET /api/frames/:id",
      "GET /api/gallery?category=",
      "GET /api/gallery/:id",
      "GET /api/services",
      "GET /api/services/:id",
      "GET /api/testimonials",
      "GET /api/team",
      "GET /api/options/glass-types",
      "GET /api/options/mat-options",
      "POST /api/quote",
      "GET /api/quotes/:id",
      "GET /api/bookings",
      "POST /api/bookings",
      "GET /api/contacts",
      "POST /api/contact",
      "POST /api/newsletter/subscribe",
      "GET /api/auth/me",
      "POST /api/auth/register | login | logout",
      "POST /api/auth/bootstrap-seller (x-admin-key)",
      "GET /api/bookings (seller) · PATCH /api/bookings/:id (seller)",
      "GET /api/bookings/my (customer)",
      "GET /api/quotes (seller) · GET /api/quotes/:id",
      "GET /api/my/quotes (customer) · PATCH /api/quotes/:id (seller)",
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
      "GET /api/seller/products|posts|orders (vendor shop)",
      "POST /api/payments/checkout · GET /api/payments/verify/khalti|esewa",
      "PUT /api/me/profile · PUT /api/me/password",
      "GET /api/settings · PUT /api/settings (admin)",
      "POST/PUT/DELETE /api/:resource (admin session required)",
    ],
  }))
  .use(healthRoutes)
  .use(framesRoutes)
  .use(galleryRoutes)
  .use(servicesRoutes)
  .use(testimonialsRoutes)
  .use(teamRoutes)
  .use(optionsRoutes)
  .use(quoteRoutes)
  .use(bookingsRoutes)
  .use(myRequestsRoutes)
  .use(contactRoutes)
  .use(newsletterRoutes)
  .use(authRoutes)
  .use(bootstrapSellerRoutes)
  .use(usersRoutes)
  .use(productsRoutes)
  .use(ordersRoutes)
  .use(bidsRoutes)
  .use(postsRoutes)
  .use(socialRoutes)
  .use(sellersRoutes)
  .use(sellerRoutes)
  .use(paymentsRoutes)
  .use(settingsRoutes)
  .use(settingsWriteRoutes)
  .use([...adminRoutes]);

export type App = typeof app;
