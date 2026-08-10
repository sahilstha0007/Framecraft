import { Elysia, t } from "elysia";
import { all } from "../db";
import { config } from "../config";
import { EMAIL_PATTERN } from "./helpers";

/**
 * Three-role auth (customer | seller | admin) with httpOnly cookie sessions.
 * - customer: buyers — browse, bid, like, follow, order.
 * - seller:   marketplace vendors — their own shop, products, blog, orders.
 * - admin:    the studio owner — the full console (all users, orders, catalog).
 * Passwords are hashed with Bun's built-in argon2id (no external services).
 */

export const SESSION_COOKIE = "fc_session";
const KEY_HEADER = "x-admin-key";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  bio: string | null;
  avatar: string | null;
  shop_name: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
}

/* ── cookie helpers (version-proof, set via the Set-Cookie header) ──────── */

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

function sessionCookie(token: string): string {
  const maxAge = config.sessionTtlDays * 86400;
  const secure = config.secureCookies ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie(): string {
  const secure = config.secureCookies ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/* ── session helpers ────────────────────────────────────────────────────── */

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + config.sessionTtlDays * 86400_000).toISOString();
  await all("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [
    token,
    userId,
    expires,
  ]);
  // Opportunistic cleanup of expired sessions (ISO strings compare in order).
  await all("DELETE FROM sessions WHERE expires_at < $1", [new Date().toISOString()]);
  return token;
}

/** Resolve the signed-in user (if any) from the request's session cookie. */
export async function getUserBySession(req: Request): Promise<UserRow | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const rows = await all<{ user_id: number; expires_at: string }>(
    "SELECT user_id, expires_at FROM sessions WHERE token = $1",
    [token]
  );
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await all("DELETE FROM sessions WHERE token = $1", [token]);
    return null;
  }
  const users = await all<UserRow>("SELECT * FROM users WHERE id = $1", [row.user_id]);
  return users[0] ?? null;
}

/** Guard: any signed-in user (customer or seller). Attaches `context.user`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireAuth(context: any) {
  const user = await getUserBySession(context.request);
  if (!user) {
    context.set.status = 401;
    return { error: "Unauthorized", hint: "Sign in to continue" };
  }
  context.user = user;
}

/** Guard: marketplace vendor (seller or admin). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireSeller(context: any) {
  const user = await getUserBySession(context.request);
  if (!user) {
    context.set.status = 401;
    return { error: "Unauthorized", hint: "Sign in as a seller" };
  }
  if (user.role !== "seller" && user.role !== "admin") {
    context.set.status = 403;
    return { error: "Forbidden", hint: "Seller account required" };
  }
  context.user = user;
}

/** Guard: studio admin only (the owner's console). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireAdmin(context: any) {
  const user = await getUserBySession(context.request);
  if (!user) {
    context.set.status = 401;
    return { error: "Unauthorized", hint: "Sign in as an admin" };
  }
  if (user.role !== "admin") {
    context.set.status = 403;
    return { error: "Forbidden", hint: "Admin account required" };
  }
  context.user = user;
}

/** Guard for the bootstrap endpoint — the one place the legacy key still works. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireBootstrapKey(context: any) {
  if (context.request.headers.get(KEY_HEADER) !== config.adminKey) {
    context.set.status = 401;
    return { error: "Unauthorized", hint: "Provide a valid x-admin-key header" };
  }
}

function toPublicUser(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    bio: u.bio,
    avatar: u.avatar,
    shopName: u.shop_name,
    location: u.location,
    website: u.website,
    createdAt: u.created_at,
  };
}

/** Profile column update helper for /me/profile. */
export function profileFields(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    bio: u.bio,
    avatar: u.avatar,
    shopName: u.shop_name,
    location: u.location,
    website: u.website,
    createdAt: u.created_at,
  };
}

/* ── routes ─────────────────────────────────────────────────────────────── */

const credentialsBody = t.Object({
  email: t.String({ pattern: EMAIL_PATTERN }),
  password: t.String({ minLength: 6, maxLength: 128 }),
});

export const authRoutes = new Elysia()
  .post(
    "/api/auth/register",
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const role = body.role ?? "customer";
      const existing = await all("SELECT id FROM users WHERE email = $1", [email]);
      if (existing[0]) {
        set.status = 409;
        return { error: "An account with this email already exists" };
      }
      const hash = await Bun.password.hash(body.password);
      let inserted: { id: number }[];
      try {
        if (role === "seller") {
          inserted = await all<{ id: number }>(
            `INSERT INTO users (name, email, password_hash, role, shop_name, bio)
             VALUES ($1, $2, $3, 'seller', $4, $5) RETURNING id`,
            [body.name.trim(), email, hash, (body.shopName ?? "").trim(), (body.bio ?? "").trim()]
          );
        } else {
          inserted = await all<{ id: number }>(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'customer') RETURNING id`,
            [body.name.trim(), email, hash]
          );
        }
      } catch (err) {
        // Concurrent registration for the same email → unique violation.
        if ((err as { code?: string }).code === "23505") {
          set.status = 409;
          return { error: "An account with this email already exists" };
        }
        throw err;
      }
      const token = await createSession(Number(inserted[0].id));
      set.headers["Set-Cookie"] = sessionCookie(token);
      set.status = 201;
      const users = await all<UserRow>("SELECT * FROM users WHERE id = $1", [inserted[0].id]);
      return { user: toPublicUser(users[0]) };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 80 }),
        email: t.String({ pattern: EMAIL_PATTERN }),
        password: t.String({ minLength: 6, maxLength: 128 }),
        role: t.Optional(t.Union([t.Literal("customer"), t.Literal("seller")])),
        shopName: t.Optional(t.String({ maxLength: 80 })),
        bio: t.Optional(t.String({ maxLength: 500 })),
      }),
    }
  )
  .post(
    "/api/auth/login",
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const users = await all<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
      const user = users[0];
      if (!user || !(await Bun.password.verify(body.password, user.password_hash))) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }
      const token = await createSession(user.id);
      set.headers["Set-Cookie"] = sessionCookie(token);
      return { user: toPublicUser(user) };
    },
    { body: credentialsBody }
  )
  .post("/api/auth/logout", async ({ request, set }) => {
    const token = readCookie(request, SESSION_COOKIE);
    if (token) await all("DELETE FROM sessions WHERE token = $1", [token]);
    set.headers["Set-Cookie"] = clearSessionCookie();
    return { ok: true };
  })
  .get("/api/auth/me", async ({ request }) => {
    const user = await getUserBySession(request);
    return { user: user ? toPublicUser(user) : null };
  });

/** Create/rotate the studio's admin account — requires the legacy admin key. */
export const bootstrapSellerRoutes = new Elysia()
  .onBeforeHandle(requireBootstrapKey)
  .post(
    "/api/auth/bootstrap-seller",
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const hash = await Bun.password.hash(body.password);
      await all<{ id: number }>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [body.name.trim(), email, hash]
      );
      set.status = 201;
      return { success: true, email };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 80 }),
        email: t.String({ pattern: EMAIL_PATTERN }),
        password: t.String({ minLength: 6, maxLength: 128 }),
      }),
    }
  );
