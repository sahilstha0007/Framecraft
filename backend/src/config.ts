export const config = {
  port: Number(process.env.PORT ?? 3001),
  /** Allowed CORS origins — comma-separated list, e.g.
   *  FRONTEND_ORIGIN="http://localhost:3000,http://localhost:3100" */
  frontendOrigins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /**
   * PostgreSQL connection string.
   * Defaults to the local podman dev instance:
   *   podman run -d --name framecraft-postgres -e POSTGRES_USER=framecraft \
   *     -e POSTGRES_PASSWORD=framecraft -e POSTGRES_DB=framecraft -p 5432:5432 \
   *     docker.io/library/postgres:16-alpine
   */
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://framecraft:framecraft@localhost:5432/framecraft",
  /**
   * Legacy shared secret, now only used to bootstrap the first seller account
   * (`POST /api/auth/bootstrap-seller`). Catalog writes are session-guarded.
   */
  adminKey: process.env.ADMIN_KEY ?? "dev-admin-key",
  /** Session cookie lifetime in days. */
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 30),
  /** Mark the session cookie Secure — on automatically for production. */
  secureCookies: process.env.NODE_ENV === "production",
  /**
   * SameSite for the session cookie. Use "None" when the frontend and API are
   * on different sites (e.g. vercel.app + onrender.com) — "Lax" cookies are not
   * sent on cross-site fetch, which silently breaks login. Browsers require
   * Secure alongside None (handled in auth.ts).
   */
  sessionSameSite: ["Lax", "None", "Strict"].includes(
    (process.env.SESSION_SAMESITE ?? "Lax").trim()
  )
    ? (process.env.SESSION_SAMESITE ?? "Lax").trim()
    : "Lax",

  /* ── Nepali payment gateways (sandbox-first) ──────────────────────────────
   * Khalti:   live secret from dev.khalti.com merchant panel (sandbox).
   * eSewa:    public test merchant EPAYTEST + test secret works in sandbox.
   * Set the live keys in the environment to go production — the code paths
   * switch automatically via the *_API variables below.
   */
  // Render injects RENDER_EXTERNAL_HOSTNAME — derive the callback base from it
  // so payment return URLs work without a manual env var.
  publicBaseUrl:
    process.env.PUBLIC_BASE_URL ??
    (process.env.RENDER_EXTERNAL_HOSTNAME
      ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
      : "http://localhost:3001"),
  khaltiSecret: process.env.KHALTI_SECRET_KEY ?? "",
  khaltiApi: process.env.KHALTI_API ?? "https://dev.khalti.com/api/v2",
  esewaSecret: process.env.ESEWA_SECRET_KEY ?? "8gBm/:&EnhH.1/q",
  esewaProductCode: process.env.ESEWA_PRODUCT_CODE ?? "EPAYTEST",
  esewaApi: process.env.ESEWA_API ?? "https://rc-epay.esewa.com.np",
};

/* ── Production guards ─────────────────────────────────────────────────────
   Refuse to boot half-configured in production; stay frictionless in dev. */
const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  if (!process.env.ADMIN_KEY) {
    throw new Error("[config] ADMIN_KEY must be set in production.");
  }
  if (!process.env.KHALTI_SECRET_KEY) {
    console.warn("[config] KHALTI_SECRET_KEY not set — Khalti checkout will fail verification.");
  }
  if (!process.env.FRONTEND_ORIGIN) {
    throw new Error(
      "[config] FRONTEND_ORIGIN must be set in production (the frontend URL allowed by CORS, e.g. https://kalabazaar.com.np)."
    );
  }
}

if (!process.env.ADMIN_KEY && process.env.NODE_ENV !== "test") {
  console.warn(
    "[config] ADMIN_KEY not set — write endpoints accept the default 'dev-admin-key'. Set ADMIN_KEY in .env for anything public."
  );
}
