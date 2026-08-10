import { createHmac } from "node:crypto";
import { SQL } from "bun";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

type AppModule = typeof import("../src/app");

let app: AppModule["app"];
let sellerToken = "";

const DEFAULT_DATABASE_URL = "postgres://framecraft:framecraft@localhost:5432/framecraft";
const ADMIN_KEY = "dev-admin-key"; // matches config default when ADMIN_KEY is unset

/**
 * Create (once) a dedicated `<dbname>_test` database so the suite never touches
 * the configured development database. Returns the test connection string.
 */
async function ensureTestDatabase(url: string): Promise<string> {
  const [head, query] = url.split("?");
  const dbName = head.split("/").pop() ?? "";
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error(`Cannot derive a test database name from DATABASE_URL (db: "${dbName}")`);
  }
  const base = head.slice(0, head.lastIndexOf("/"));
  const testDb = `${dbName}_test`;

  const bootstrap = new SQL(`${base}/postgres`);
  try {
    const exists = (await bootstrap.unsafe("SELECT 1 FROM pg_database WHERE datname = $1", [testDb])) as unknown[];
    if (!exists[0]) {
      // testDb is validated as [a-zA-Z0-9_], so interpolation is safe.
      await bootstrap.unsafe(`CREATE DATABASE ${testDb}`);
    }
  } catch (err) {
    // Another concurrent run may have created it first.
    if (!/already exists/i.test(String((err as Error).message ?? err))) throw err;
  } finally {
    await bootstrap.close();
  }

  return query ? `${base}/${testDb}?${query}` : `${base}/${testDb}`;
}

beforeAll(async () => {
  // Isolate the suite in a dedicated test database before the app is imported
  // (config reads DATABASE_URL at import time).
  const configured = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  process.env.DATABASE_URL = await ensureTestDatabase(configured);

  const mod = await import("../src/app");
  app = mod.app;

  const { db, migrate } = await import("../src/db");
  // Clean slate: drop every table in the test DB, then recreate + reseed.
  await db.unsafe(`
    DROP TABLE IF EXISTS sessions, users, orders, products, custom_quotes,
      newsletter_subscribers, contacts, bookings, mat_options, glass_types, team_members,
      testimonials, services, gallery_items, frames, bids, posts, follows,
      product_likes, comments, product_reviews, order_events CASCADE;
  `);
  await migrate();

  const seedMod = await import("../src/db/seed");
  await seedMod.seed();
  await seedMod.seedShopSettings();
  await seedMod.seedMarketplace();

  // Bootstrap the studio seller with the legacy key, then sign in to get a
  // session cookie — the new way the admin UI authenticates.
  const bootRes = await app.handle(
    new Request("http://localhost/api/auth/bootstrap-seller", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
      body: JSON.stringify({ name: "Studio Test Seller", email: "seller@test.local", password: "seller-pass-123" }),
    })
  );
  expect(bootRes.status).toBe(201);

  const loginRes = await app.handle(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "seller@test.local", password: "seller-pass-123" }),
    })
  );
  expect(loginRes.status).toBe(200);
  sellerToken = (loginRes.headers.get("set-cookie") ?? "").split(";")[0].split("=")[1];
  expect(sellerToken).toBeTruthy();
});

afterAll(async () => {
  const { db } = await import("../src/db");
  await db.close();
});

const get = (path: string) => app.handle(new Request(`http://localhost${path}`));

const post = (path: string, body: unknown) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );

/** Request carrying the seller's session cookie. */
const sellerReq = (path: string, init?: RequestInit) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Cookie: `fc_session=${sellerToken}` },
    })
  );

const sellerGet = (path: string) => sellerReq(path);
const sellerPost = (path: string, body: unknown) =>
  sellerReq(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const sellerPatch = (path: string, body: unknown) =>
  sellerReq(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const sellerPut = (path: string, body: unknown) =>
  sellerReq(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const sellerDelete = (path: string) => sellerReq(path, { method: "DELETE" });

/** Register a fresh customer and return their session cookie. */
async function registerCustomer(name: string, email: string, password = "customer-pass-123"): Promise<string> {
  const res = await post("/api/auth/register", { name, email, password });
  expect(res.status).toBe(201);
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

const customerReq = (cookie: string, path: string, init?: RequestInit) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Cookie: cookie },
    })
  );

describe("GET catalog endpoints", () => {
  test("health returns ok", async () => {
    const res = await get("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok", service: "framecraft-api" });
  });

  test("GET /api/frames returns the full catalog", async () => {
    const res = await get("/api/frames");
    expect(res.status).toBe(200);
    const frames = (await res.json()) as Array<{ name: string; sizes: string[] }>;
    expect(frames).toHaveLength(9);
    expect(frames[0]).toMatchObject({ name: "Heritage Teak" });
    expect(Array.isArray(frames[0].sizes)).toBe(true);
  });

  test("GET /api/frames filters by category, popularity and search", async () => {
    const cat = await get("/api/frames?category=Luxury%20Gold%20Frames");
    expect((await cat.json())).toHaveLength(1);

    const popular = await get("/api/frames?popular=true");
    expect(await popular.json()).toHaveLength(4);

    const search = await get("/api/frames?search=teak");
    const hits = (await search.json()) as Array<{ name: string }>;
    expect(hits.map((f) => f.name)).toContain("Heritage Teak");
  });

  test("GET /api/frames/:id returns one frame and 404 for missing", async () => {
    const res = await get("/api/frames/1");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 1, name: "Heritage Teak" });

    const missing = await get("/api/frames/999");
    expect(missing.status).toBe(404);
  });

  test("GET /api/gallery returns 9 items", async () => {
    const res = await get("/api/gallery");
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveLength(9);
  });

  test("GET /api/services, /api/testimonials, /api/team return seeded rows", async () => {
    expect(await get("/api/services").then((r) => r.json())).toHaveLength(9);
    expect(await get("/api/testimonials").then((r) => r.json())).toHaveLength(5);
    expect(await get("/api/team").then((r) => r.json())).toHaveLength(4);
  });

  test("GET /api/options returns glass types and mat options", async () => {
    const glass = await get("/api/options/glass-types");
    expect(glass.status).toBe(200);
    expect(await glass.json()).toHaveLength(4);

    const mats = await get("/api/options/mat-options");
    expect(await mats.json()).toHaveLength(8);
  });
});

describe("POST /api/quote — custom frame pricing", () => {
  test("computes price from frame, mat, glass and size", async () => {
    const res = await post("/api/quote", {
      frameId: 1, // Heritage Teak, starts at NPR 6,500
      width: 16,
      height: 20, // 320 sq in → sizeFactor 1
      matId: "cream", // NPR 1,800
      glassId: "uv", // NPR 3,200
      quantity: 1,
    });
    expect(res.status).toBe(200);
    const quote = (await res.json()) as Record<string, unknown>;
    expect(quote).toMatchObject({
      frameName: "Heritage Teak",
      basePrice: 6500,
      matPrice: 1800,
      glassPrice: 3200,
      sizeFactor: 1,
      quantity: 1,
      total: 11500,
      currency: "NPR",
    });
  });

  test("scales price up for large dimensions (sizeFactor capped at 3)", async () => {
    const res = await post("/api/quote", {
      frameId: 1,
      width: 32,
      height: 40, // 1280 sq in → factor 4, capped to 3
      quantity: 2,
    });
    expect(res.status).toBe(200);
    const quote = (await res.json()) as { sizeFactor: number; total: number };
    expect(quote.sizeFactor).toBe(3);
    expect(quote.total).toBe(6500 * 3 * 2);
  });

  test("rejects invalid dimensions and unknown frames", async () => {
    const badSize = await post("/api/quote", { frameId: 1, width: 0, height: 20 });
    expect(badSize.status).toBe(400);

    const badMat = await post("/api/quote", { frameId: 1, width: 16, height: 20, matId: "nope" });
    expect(badMat.status).toBe(400);

    const badFrame = await post("/api/quote", { frameId: 999, width: 16, height: 20 });
    expect(badFrame.status).toBe(404);
  });

  test("persists a quote when contact details are provided and can be fetched", async () => {
    const res = await post("/api/quote", {
      frameId: 2,
      width: 11,
      height: 14,
      glassId: "museum",
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(res.status).toBe(201);
    const quote = (await res.json()) as { id: number; total: number };
    expect(quote.id).toBeDefined();

    const fetched = await get(`/api/quotes/${quote.id}`);
    expect(fetched.status).toBe(200);
    expect(await fetched.json()).toMatchObject({ id: quote.id, total: quote.total });
  });
});

describe("POST /api/bookings", () => {
  test("creates a booking with valid input", async () => {
    const res = await post("/api/bookings", {
      name: "Grace Hopper",
      email: "grace@example.com",
      phone: "555-0100",
      service: "Custom Picture Framing",
      date: "2026-09-01",
      time: "10:00",
      message: "Framing a vintage poster",
    });
    expect(res.status).toBe(201);
    const booking = (await res.json()) as { id: number } & Record<string, unknown>;
    expect(booking).toMatchObject({ name: "Grace Hopper", status: "pending" });
    expect(booking.id).toBeDefined();
  });

  test("rejects invalid email and missing name", async () => {
    const badEmail = await post("/api/bookings", {
      name: "X",
      email: "not-an-email",
      service: "Framing",
      date: "2026-09-01",
    });
    expect(badEmail.status).toBe(400);

    const noName = await post("/api/bookings", {
      email: "ok@example.com",
      service: "Framing",
      date: "2026-09-01",
    });
    expect(noName.status).toBe(400);
  });

  test("lists created bookings (seller only)", async () => {
    const res = await sellerGet("/api/bookings");
    expect(res.status).toBe(200);
    const bookings = (await res.json()) as Array<{ name: string }>;
    expect(bookings.map((b) => b.name)).toContain("Grace Hopper");
  });

  test("bookings list is hidden from anonymous visitors", async () => {
    const res = await get("/api/bookings");
    expect(res.status).toBe(401);
  });
});

describe("auth — customers & sellers", () => {
  test("register creates a customer session and rejects duplicate emails", async () => {
    const res = await post("/api/auth/register", {
      name: "Alan Turing",
      email: "alan@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.headers.get("set-cookie")).toContain("fc_session=");
    expect(await res.json()).toMatchObject({ user: { name: "Alan Turing", email: "alan@example.com", role: "customer" } });

    const dup = await post("/api/auth/register", {
      name: "Alan Turing",
      email: "alan@example.com",
      password: "password123",
    });
    expect(dup.status).toBe(409);
  });

  test("login validates credentials and logout clears the session", async () => {
    const bad = await post("/api/auth/login", { email: "alan@example.com", password: "wrong-password" });
    expect(bad.status).toBe(401);

    const ok = await post("/api/auth/login", { email: "alan@example.com", password: "password123" });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ user: { email: "alan@example.com", role: "customer" } });

    const cookie = (ok.headers.get("set-cookie") ?? "").split(";")[0];

    const me = await customerReq(cookie, "/api/auth/me");
    expect((await me.json()) as { user: { role: string } }).toMatchObject({ user: { role: "customer" } });

    const out = await customerReq(cookie, "/api/auth/logout", { method: "POST" });
    expect(out.status).toBe(200);

    const meAfter = await customerReq(cookie, "/api/auth/me");
    expect(await meAfter.json()).toMatchObject({ user: null });
  });

  test("bootstrap-seller requires the legacy admin key", async () => {
    const noKey = await post("/api/auth/bootstrap-seller", {
      name: "Nope",
      email: "nope@example.com",
      password: "password123",
    });
    expect(noKey.status).toBe(401);

    const badKey = await app.handle(
      new Request("http://localhost/api/auth/bootstrap-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": "wrong" },
        body: JSON.stringify({ name: "Nope", email: "nope@example.com", password: "password123" }),
      })
    );
    expect(badKey.status).toBe(401);
  });

  test("a customer cannot act as a seller", async () => {
    const cookie = await registerCustomer("Katherine Johnson", "katherine@example.com");

    const denied = await customerReq(cookie, "/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Sneaky",
        category: "Art",
        image: "https://example.com/a.jpg",
        description: "",
        client: "",
      }),
    });
    expect(denied.status).toBe(403);

    const bookings = await customerReq(cookie, "/api/bookings");
    expect(bookings.status).toBe(403);
  });
});

describe("customer requests — /my/bookings & /my/quotes", () => {
  test("a signed-in customer sees only their own bookings and quotes", async () => {
    const cookie = await registerCustomer("Edith Clarke", "edith@example.com");

    // A booking placed before signing in (same email, anonymous)…
    const anon = await post("/api/bookings", {
      name: "Edith Clarke",
      email: "edith@example.com",
      service: "Canvas Stretching",
      date: "2026-10-01",
    });
    expect(anon.status).toBe(201);
    const anonId = ((await anon.json()) as { id: number }).id;

    // …and one placed while signed in.
    const signed = await customerReq(cookie, "/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Edith Clarke",
        email: "edith@example.com",
        service: "Custom Picture Framing",
        date: "2026-10-02",
      }),
    });
    expect(signed.status).toBe(201);

    const list = await customerReq(cookie, "/api/my/bookings");
    expect(list.status).toBe(200);
    const mine = (await list.json()) as Array<{ id: number }>;
    expect(mine.map((b) => b.id)).toContain(anonId);

    // A quote persisted under her email shows up too.
    const quote = await customerReq(cookie, "/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frameId: 1,
        width: 16,
        height: 20,
        name: "Edith Clarke",
        email: "edith@example.com",
      }),
    });
    expect(quote.status).toBe(201);

    const quotes = await customerReq(cookie, "/api/my/quotes");
    expect(quotes.status).toBe(200);
    expect((await quotes.json()) as unknown[]).toHaveLength(1);

    // Another customer's requests stay invisible.
    const other = await registerCustomer("Mary Jackson", "mary@example.com");
    const otherList = await customerReq(other, "/api/my/bookings");
    expect((await otherList.json()) as unknown[]).toHaveLength(0);

    // Anonymous visitors get 401.
    const anonMe = await get("/api/my/bookings");
    expect(anonMe.status).toBe(401);
  });
});

describe("seller management — bookings, quotes, customers, settings", () => {
  test("seller can move a booking through statuses and add notes", async () => {
    const created = await sellerPost("/api/bookings", {
      name: "Radia Perlman",
      email: "radia@example.com",
      service: "Thangka & Paubha Framing",
      date: "2026-11-01",
    });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: number };

    const updated = await sellerPatch(`/api/bookings/${id}`, { status: "confirmed", notes: "Call to confirm brocade colour" });
    expect(updated.status).toBe(200);

    const list = await sellerGet("/api/bookings");
    const booking = ((await list.json()) as Array<Record<string, unknown>>).find((b) => b.id === id);
    expect(booking).toMatchObject({ status: "confirmed", notes: "Call to confirm brocade colour" });

    const bad = await sellerPatch(`/api/bookings/${id}`, { status: "not-a-status" });
    expect(bad.status).toBe(400);

    const missing = await sellerPatch("/api/bookings/99999", { status: "ready" });
    expect(missing.status).toBe(404);
  });

  test("seller can list and re-status custom quotes", async () => {
    await post("/api/quote", {
      frameId: 3,
      width: 20,
      height: 24,
      name: "Quote Client",
      email: "quote@example.com",
    });

    const list = await sellerGet("/api/quotes");
    expect(list.status).toBe(200);
    const quotes = (await list.json()) as Array<{ id: number; status: string; email: string | null }>;
    const quote = quotes.find((q) => q.email === "quote@example.com") ?? quotes[quotes.length - 1];
    expect(quote).toBeDefined();

    const updated = await sellerPatch(`/api/quotes/${quote.id}`, { status: "in_progress" });
    expect(updated.status).toBe(200);

    const again = await sellerGet("/api/quotes");
    const after = ((await again.json()) as Array<{ id: number; status: string }>).find((q) => q.id === quote.id);
    expect(after?.status).toBe("in_progress");
  });

  test("admin sees every account with role and counts", async () => {
    await registerCustomer("Customer One", "one@example.com");
    await registerCustomer("Customer Two", "two@example.com");

    const res = await sellerGet("/api/users");
    expect(res.status).toBe(200);
    const users = (await res.json()) as Array<{ email: string; role: string; bookings: number; quotes: number }>;
    expect(users.map((u) => u.email)).toContain("one@example.com");
    expect(users.map((u) => u.email)).toContain("two@example.com");
    // The admin account itself is listed too, with role "admin".
    expect(users.find((u) => u.email === "seller@test.local")?.role).toBe("admin");
    expect(Array.isArray(users[0].bookings)).toBe(false);
  });

  test("admin can promote a customer to seller and back", async () => {
    const cookie = await registerCustomer("Promotable", "promo@example.com");
    const me = (await customerReq(cookie, "/api/auth/me").then((r) => r.json())) as { user: { id: number } };

    const promoted = await sellerPatch(`/api/users/${me.user.id}`, { role: "seller" });
    expect(promoted.status).toBe(200);

    const list = await sellerGet("/api/users");
    const after = ((await list.json()) as Array<{ id: number; role: string }>).find((u) => u.id === me.user.id);
    expect(after?.role).toBe("seller");

    const demoted = await sellerPatch(`/api/users/${me.user.id}`, { role: "customer" });
    expect(demoted.status).toBe(200);
  });

  test("admin cannot change their own role or delete themselves", async () => {
    const me = (await sellerGet("/api/auth/me").then((r) => r.json())) as { user: { id: number } };

    const selfRole = await sellerPatch(`/api/users/${me.user.id}`, { role: "customer" });
    expect(selfRole.status).toBe(403);

    const selfDelete = await sellerDelete(`/api/users/${me.user.id}`);
    expect(selfDelete.status).toBe(403);
  });

  test("deleting a user detaches their requests instead of losing them", async () => {
    const cookie = await registerCustomer("Doomed User", "doomed@example.com");
    const me = (await customerReq(cookie, "/api/auth/me").then((r) => r.json())) as { user: { id: number } };

    const booking = await customerReq(cookie, "/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Doomed User",
        email: "doomed@example.com",
        service: "Custom Picture Framing",
        date: "2026-12-01",
      }),
    });
    expect(booking.status).toBe(201);
    const bookingId = ((await booking.json()) as { id: number }).id;

    const del = await sellerDelete(`/api/users/${me.user.id}`);
    expect(del.status).toBe(200);

    // User is gone from the list…
    const list = await sellerGet("/api/users");
    expect(((await list.json()) as Array<{ id: number }>).some((u) => u.id === me.user.id)).toBe(false);

    // …but their booking survives, now ownerless.
    const allBookings = await sellerGet("/api/bookings");
    const kept = ((await allBookings.json()) as Array<{ id: number; userId: number | null }>).find(
      (b) => b.id === bookingId
    );
    expect(kept?.userId).toBeNull();
  });

  test("customers cannot reach user management", async () => {
    const cookie = await registerCustomer("Peeking", "peek@example.com");
    const res = await customerReq(cookie, "/api/users");
    expect(res.status).toBe(403);
  });

  test("shop settings are readable publicly and writable by sellers only", async () => {
    const publicGet = await get("/api/settings");
    expect(publicGet.status).toBe(200);
    expect(await publicGet.json()).toMatchObject({ whatsapp: "9779843082974" });

    const updated = await sellerPut("/api/settings", {
      values: { instagram: "https://instagram.com/framecraft" },
    });
    expect(updated.status).toBe(200);

    const after = await get("/api/settings");
    expect(await after.json()).toMatchObject({ instagram: "https://instagram.com/framecraft" });

    const cookie = await registerCustomer("No Settings", "nosettings@example.com");
    const denied = await customerReq(cookie, "/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: { instagram: "https://evil.example.com" } }),
    });
    expect(denied.status).toBe(403);
  });
});

describe("shop — products & orders", () => {
  test("products are publicly listed, filterable and fetchable", async () => {
    const res = await get("/api/products");
    expect(res.status).toBe(200);
    const all = (await res.json()) as Array<{ id: number; name: string; price: number; stock: number }>;
    expect(all.length).toBeGreaterThanOrEqual(10);
    expect(all[0]).toMatchObject({ name: "Heritage Teak Frame — 16\"×20\"", price: 9800 });

    const frames = await get("/api/products?category=Frames");
    const frameList = (await frames.json()) as Array<{ category: string }>;
    expect(frameList.length).toBeGreaterThan(0);
    expect(frameList.every((p) => p.category === "Frames")).toBe(true);

    const detail = await get("/api/products/1");
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({ id: 1, stock: 6 });

    const missing = await get("/api/products/9999");
    expect(missing.status).toBe(404);
  });

  test("admin can create, update and delete products", async () => {
    const created = await sellerPost("/api/products", {
      name: "Test Product",
      category: "Art",
      price: 1234,
      image: "https://example.com/p.jpg",
      description: "A test product.",
      stock: 7,
      featured: true,
    });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: number };

    const fetched = await get(`/api/products/${id}`);
    expect(await fetched.json()).toMatchObject({ name: "Test Product", price: 1234, stock: 7, featured: true });

    await sellerDelete(`/api/products/${id}`);
    expect((await get(`/api/products/${id}`)).status).toBe(404);
  });

  test("checkout requires a signed-in customer", async () => {
    const res = await post("/api/orders", {
      items: [{ productId: 1, quantity: 1 }],
      address: "Jhamsikhel, Lalitpur",
      paymentMethod: "Cash on Delivery",
    });
    expect(res.status).toBe(401);
  });

  test("placing an order prices from the server and decrements stock", async () => {
    const cookie = await registerCustomer("Shopper One", "shopper1@example.com");

    const res = await customerReq(cookie, "/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: 1, quantity: 2 }, { productId: 4, quantity: 1 }],
        phone: "9843000000",
        address: "Jhamsikhel, Lalitpur 44700",
        paymentMethod: "eSewa",
        notes: "Ring the bell twice",
      }),
    });
    expect(res.status).toBe(201);
    const order = (await res.json()) as {
      id: number;
      total: number;
      items: Array<{ name: string; price: number; quantity: number }>;
      paymentMethod: string;
    };
    // 2 × Heritage Teak (9800) + 1 × Boudhanath print (4200)
    expect(order.total).toBe(9800 * 2 + 4200);
    expect(order.paymentMethod).toBe("eSewa");
    expect(order.items).toHaveLength(2);

    // Stock decremented: product 1 was 6 → 4.
    const p1 = await get("/api/products/1");
    expect((await p1.json()) as { stock: number }).toMatchObject({ stock: 4 });

    const mine = await customerReq(cookie, "/api/my/orders");
    expect(mine.status).toBe(200);
    expect((await mine.json()) as unknown[]).toHaveLength(1);
  });

  test("orders reject out-of-stock items and invalid payment methods", async () => {
    const cookie = await registerCustomer("Shopper Two", "shopper2@example.com");

    const noStock = await customerReq(cookie, "/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: 6, quantity: 1 }], // Dubo Mala — stock 0
        address: "Patan 44700",
        paymentMethod: "Cash on Delivery",
      }),
    });
    expect(noStock.status).toBe(400);

    const badPayment = await customerReq(cookie, "/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: 1, quantity: 1 }],
        address: "Patan 44700",
        paymentMethod: "Bitcoin",
      }),
    });
    expect(badPayment.status).toBe(400);

    const badProduct = await customerReq(cookie, "/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ productId: 9999, quantity: 1 }],
        address: "Patan 44700",
        paymentMethod: "Cash on Delivery",
      }),
    });
    expect(badProduct.status).toBe(400);
  });

  test("admin sees all orders and manages status + payment", async () => {
    const res = await sellerGet("/api/orders");
    expect(res.status).toBe(200);
    const orders = (await res.json()) as Array<{ id: number; customerName: string; status: string; paymentStatus: string }>;
    const order = orders.find((o) => o.customerName === "Shopper One") ?? orders[orders.length - 1];
    expect(order).toBeDefined();

    const updated = await sellerPatch(`/api/orders/${order.id}`, {
      status: "confirmed",
      paymentStatus: "paid",
      notes: "Paid via eSewa",
    });
    expect(updated.status).toBe(200);

    const again = await sellerGet("/api/orders");
    const after = ((await again.json()) as Array<Record<string, unknown>>).find((o) => o.id === order.id);
    expect(after).toMatchObject({ status: "confirmed", paymentStatus: "paid", notes: "Paid via eSewa" });

    expect((await get("/api/orders")).status).toBe(401);
    const cookie = await registerCustomer("Peeking Order", "peekorder@example.com");
    expect((await customerReq(cookie, "/api/orders")).status).toBe(403);
  });
});

describe("POST /api/contact", () => {
  test("stores a contact message", async () => {
    const res = await post("/api/contact", {
      name: "Katherine Johnson",
      email: "katherine@example.com",
      subject: "Corporate framing quote",
      message: "We need 12 frames for our new office.",
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ success: true });
  });

  test("rejects empty message", async () => {
    const res = await post("/api/contact", { name: "X", email: "x@example.com", message: "" });
    expect(res.status).toBe(400);
  });
});

describe("error handling & CORS", () => {
  test("malformed JSON body returns 400, not 500", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not valid json",
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid request" });
  });

  test("unknown route returns 404", async () => {
    const res = await get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });

  test("CORS preflight returns allowed origin for the frontend", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/frames", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      })
    );
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
  });

  test("quote rejects an invalid optional email", async () => {
    const res = await post("/api/quote", {
      frameId: 1,
      width: 16,
      height: 20,
      email: "not-an-email",
    });
    expect(res.status).toBe(400);
  });
});

describe("seller CRUD — catalog management", () => {
  test("write endpoints reject requests without a seller session", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "No Session",
          category: "Art",
          image: "https://example.com/a.jpg",
          description: "",
          client: "",
        }),
      })
    );
    expect(res.status).toBe(401);
  });

  test("creates, reads, updates and deletes a gallery item", async () => {
    const created = await sellerPost("/api/gallery", {
      title: "Midnight Orchard",
      category: "Artwork Framing",
      image: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=800&q=80",
      description: "Framed in a floating shadow box.",
      client: "Private Collector",
    });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: number };
    expect(id).toBeDefined();

    const list = await get("/api/gallery");
    const items = (await list.json()) as Array<{ id: number; title: string }>;
    expect(items.find((g) => g.id === id)).toMatchObject({ title: "Midnight Orchard" });

    const updated = await sellerPut(`/api/gallery/${id}`, {
      title: "Midnight Orchard II",
      category: "Artwork Framing",
      image: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=800&q=80",
      description: "Updated description.",
      client: "Private Collector",
    });
    expect(updated.status).toBe(200);

    const afterUpdate = await get(`/api/gallery/${id}`);
    expect(await afterUpdate.json()).toMatchObject({ title: "Midnight Orchard II" });

    const del = await sellerDelete(`/api/gallery/${id}`);
    expect(del.status).toBe(200);

    const afterDelete = await get(`/api/gallery/${id}`);
    expect(afterDelete.status).toBe(404);
  });

  test("rejects invalid gallery payloads and missing ids", async () => {
    const bad = await sellerPost("/api/gallery", {
      title: "",
      category: "Art",
      image: "https://example.com/a.jpg",
      description: "",
      client: "",
    });
    expect(bad.status).toBe(400);

    const missing = await sellerDelete("/api/gallery/99999");
    expect(missing.status).toBe(404);
  });

  test("frames CRUD stores sizes arrays and popular flags", async () => {
    const created = await sellerPost("/api/frames", {
      name: "Test Frame",
      category: "Minimalist Frames",
      material: "Bamboo",
      sizes: ['8"×10"', '16"×20"'],
      priceRange: "NPR 5,500 - 12,000",
      image: "https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?w=800&q=80",
      description: "A test frame.",
      popular: true,
    });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: number };

    const fetched = await get(`/api/frames/${id}`);
    expect(fetched.status).toBe(200);
    const frame = (await fetched.json()) as { sizes: string[]; popular: boolean };
    expect(frame.sizes).toEqual(['8"×10"', '16"×20"']);
    expect(frame.popular).toBe(true);

    await sellerDelete(`/api/frames/${id}`);
  });

  test("glass-types and mat-options use name-based ids and reject duplicates", async () => {
    const created = await sellerPost("/api/glass-types", {
      name: "Anti-Reflective Glass",
      description: "Reduces glare.",
      price: 60,
      features: ["Anti-reflective"],
    });
    expect(created.status).toBe(201);
    expect((await created.json()) as { id: string }).toMatchObject({ id: "anti-reflective-glass" });

    const dup = await sellerPost("/api/glass-types", {
      name: "Anti-Reflective Glass",
      description: "Reduces glare.",
      price: 60,
      features: ["Anti-reflective"],
    });
    expect(dup.status).toBe(409);

    await sellerDelete("/api/glass-types/anti-reflective-glass");
  });

  test("services, testimonials and team CRUD work with a seller session", async () => {
    const svc = await sellerPost("/api/services", {
      title: "Studio Visit",
      description: "A private tour of the workshop.",
      icon: "Home",
      features: ["Guided tour", "Moulding samples"],
    });
    expect(svc.status).toBe(201);
    const svcId = ((await svc.json()) as { id: number }).id;

    const tst = await sellerPost("/api/testimonials", {
      name: "Test Client",
      role: "Collector",
      content: "Beautiful work.",
      rating: 5,
      image: "https://example.com/t.jpg",
    });
    expect(tst.status).toBe(201);
    const tstId = ((await tst.json()) as { id: number }).id;

    const member = await sellerPost("/api/team", {
      name: "Test Framer",
      role: "Artisan",
      bio: "Crafts frames.",
      image: "https://example.com/m.jpg",
      experience: "10 Years",
    });
    expect(member.status).toBe(201);
    const memberId = ((await member.json()) as { id: number }).id;

    await sellerDelete(`/api/services/${svcId}`);
    await sellerDelete(`/api/testimonials/${tstId}`);
    await sellerDelete(`/api/team/${memberId}`);
  });
});

describe("POST /api/newsletter/subscribe", () => {
  test("subscribes an email once, then rejects duplicates", async () => {
    const first = await post("/api/newsletter/subscribe", { email: "fan@example.com" });
    expect(first.status).toBe(201);

    const dup = await post("/api/newsletter/subscribe", { email: "FAN@example.com" });
    expect(dup.status).toBe(409);
  });

  test("rejects invalid email", async () => {
    const res = await post("/api/newsletter/subscribe", { email: "nope" });
    expect(res.status).toBe(400);
  });
});

/* ── Marketplace: roles, auctions & bids, blogs, social, payments ────────── */

const jsonBody = (init?: RequestInit) => ({
  "Content-Type": "application/json",
  ...(init?.headers ?? {}),
});

const isoInHours = (hours: number) =>
  new Date(Date.now() + hours * 3_600_000).toISOString().slice(0, 19);

async function registerRole(
  name: string,
  email: string,
  role: "customer" | "seller",
  shopName?: string
): Promise<{ cookie: string; user: { id: number; role: string; shopName?: string | null } }> {
  const res = await post("/api/auth/register", {
    name,
    email,
    password: "pass-123456",
    role,
    shopName,
  });
  expect(res.status).toBe(201);
  const body = (await res.json()) as { user: { id: number; role: string; shopName?: string | null } };
  return { cookie: (res.headers.get("set-cookie") ?? "").split(";")[0], user: body.user };
}

async function createSellerAuction(
  cookie: string,
  overrides: Record<string, unknown> = {}
): Promise<number> {
  const res = await customerReq(cookie, "/api/seller/products", {
    method: "POST",
    headers: jsonBody(),
    body: JSON.stringify({
      name: "Test Auction Lot",
      category: "Art",
      price: 0,
      image: "https://example.com/lot.jpg",
      description: "An auction-only lot.",
      stock: 1,
      featured: false,
      auction: true,
      startingBid: 5000,
      minIncrement: 200,
      endsAt: isoInHours(48),
      ...overrides,
    }),
  });
  expect(res.status).toBe(201);
  return Number(((await res.json()) as { id: number }).id);
}

describe("marketplace — roles & gating", () => {
  test("open seller signup creates a vendor who cannot reach the admin console", async () => {
    const { cookie, user } = await registerRole("Vendor One", "vendor1@test.com", "seller", "Vendor One Arts");
    expect(user.role).toBe("seller");
    expect(user.shopName).toBe("Vendor One Arts");

    // The studio console is admin-only now.
    const denied = await customerReq(cookie, "/api/users");
    expect(denied.status).toBe(403);
    const deniedOrders = await customerReq(cookie, "/api/orders");
    expect(deniedOrders.status).toBe(403);

    // But their own vendor shop works.
    const shop = await customerReq(cookie, "/api/seller/products");
    expect(shop.status).toBe(200);
  });

  test("the studio admin still controls the console", async () => {
    const res = await sellerGet("/api/users");
    expect(res.status).toBe(200);
  });
});

describe("marketplace — seller shop", () => {
  test("sellers create their own fixed and auction products", async () => {
    const { cookie } = await registerRole("Vendor Two", "vendor2@test.com", "seller", "Two Studio");

    const auctionId = await createSellerAuction(cookie);
    const fixed = await customerReq(cookie, "/api/seller/products", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({
        name: "Fixed Print",
        category: "Art",
        price: 3000,
        image: "https://example.com/p.jpg",
        description: "A fixed-price print.",
        stock: 5,
        featured: false,
      }),
    });
    expect(fixed.status).toBe(201);

    const list = (await (await customerReq(cookie, "/api/seller/products")).json()) as Array<{
      id: number;
      auction: number;
    }>;
    expect(list).toHaveLength(2);
    expect(list.some((p) => p.id === auctionId && p.auction === 1)).toBe(true);

    // Cannot touch another vendor's (studio-owned) product.
    const other = await customerReq(cookie, "/api/seller/products/1", {
      method: "PUT",
      headers: jsonBody(),
      body: JSON.stringify({
        name: "Hijack",
        category: "Frames",
        price: 1,
        image: "https://example.com/x.jpg",
        description: "x",
        stock: 1,
        featured: false,
      }),
    });
    expect(other.status).toBe(403);
  });
});

describe("marketplace — auctions & bids", () => {
  test("bids enforce increments and anonymous bidding is blocked", async () => {
    const { cookie: sc } = await registerRole("Vendor Three", "vendor3@test.com", "seller", "Three Studio");
    const pid = await createSellerAuction(sc);

    const anon = await post(`/api/products/${pid}/bid`, { amount: 6000 });
    expect(anon.status).toBe(401);

    const { cookie: c1 } = await registerRole("Bidder One", "bidder1@test.com", "customer");
    const { cookie: c2 } = await registerRole("Bidder Two", "bidder2@test.com", "customer");

    // Below the increment (5000 + 200).
    const low = await customerReq(c1, `/api/products/${pid}/bid`, {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ amount: 5000 }),
    });
    expect(low.status).toBe(400);

    const first = await customerReq(c1, `/api/products/${pid}/bid`, {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ amount: 5200 }),
    });
    expect(first.status).toBe(201);

    // Below the floor (5200 + 200 = 5400) is rejected.
    const stale = await customerReq(c2, `/api/products/${pid}/bid`, {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ amount: 5300 }),
    });
    expect(stale.status).toBe(400);

    const winning = await customerReq(c2, `/api/products/${pid}/bid`, {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ amount: 5600 }),
    });
    expect(winning.status).toBe(201);

    const product = (await (await get(`/api/products/${pid}`)).json()) as {
      currentBid: number;
      bidCount: number;
    };
    expect(product.currentBid).toBe(5600);
    expect(product.bidCount).toBe(2);

    // Bid history is public.
    const history = (await (await get(`/api/products/${pid}/bids`)).json()) as Array<{ amount: number }>;
    expect(history).toHaveLength(2);
    expect(history[0].amount).toBe(5600);
  });

  test("expired auctions close automatically and reject new bids", async () => {
    const { cookie: sc } = await registerRole("Vendor Four", "vendor4@test.com", "seller", "Four Studio");
    const pid = await createSellerAuction(sc, { endsAt: isoInHours(-2) });

    // Reading the product lazily closes it.
    const product = (await (await get(`/api/products/${pid}`)).json()) as { status: string };
    expect(product.status).toBe("ended");

    const { cookie: c } = await registerRole("Late Bidder", "late@test.com", "customer");
    const bid = await customerReq(c, `/api/products/${pid}/bid`, {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ amount: 9000 }),
    });
    expect(bid.status).toBe(400);
  });

  test("sellers cannot bid on their own auctions", async () => {
    const { cookie: sc } = await registerRole("Vendor Five", "vendor5@test.com", "seller", "Five Studio");
    const pid = await createSellerAuction(sc);

    const selfBid = await customerReq(sc, `/api/products/${pid}/bid`, {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ amount: 6000 }),
    });
    expect(selfBid.status).toBe(400);

    // The bid never landed.
    const product = (await (await get(`/api/products/${pid}`)).json()) as {
      bidCount: number;
      currentBid: number | null;
    };
    expect(product.bidCount).toBe(0);
    expect(product.currentBid).toBeNull();
  });
});

describe("marketplace — blog posts", () => {
  test("sellers publish posts and the public feed shows them", async () => {
    const { cookie, user } = await registerRole("Blogger", "blogger@test.com", "seller", "Blog Studio");
    const created = await customerReq(cookie, "/api/posts", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({
        title: "My Art Story",
        excerpt: "How I started painting.",
        content: "It began in a Patan courtyard…",
        coverImage: "https://example.com/c.jpg",
        status: "published",
      }),
    });
    expect(created.status).toBe(201);
    const post = (await created.json()) as { id: number; slug: string; sellerId: number };
    expect(post.sellerId).toBe(user.id);

    const feed = (await (await get("/api/posts")).json()) as Array<{ slug: string }>;
    expect(feed.some((p) => p.slug === post.slug)).toBe(true);

    const single = await get(`/api/posts/${post.slug}`);
    expect(single.status).toBe(200);

    // Another seller cannot edit this post.
    const { cookie: other } = await registerRole("Other Blogger", "otherblog@test.com", "seller", "Other");
    const hijack = await customerReq(other, `/api/posts/${post.id}`, {
      method: "PUT",
      headers: jsonBody(),
      body: JSON.stringify({ title: "Hijacked", content: "x", status: "published" }),
    });
    expect(hijack.status).toBe(403);

    // Owner can delete.
    const del = await customerReq(cookie, `/api/posts/${post.id}`, { method: "DELETE" });
    expect(del.status).toBe(200);
  });
});

describe("marketplace — social", () => {
  test("customers follow sellers, like products and comment", async () => {
    const { cookie: sc } = await registerRole("Artist Five", "artist5@test.com", "seller", "Five Studio");
    const pid = await createSellerAuction(sc);
    const sellerId = (await (await get("/api/sellers")).json() as Array<{ id: number }>).find(
      (s) => s.id !== undefined
    )!.id;

    const { cookie: c, user } = await registerRole("Follower", "follower@test.com", "customer");

    const follow = await customerReq(c, `/api/sellers/${sellerId}/follow`, { method: "POST" });
    expect(follow.status).toBe(200);
    const selfFollow = await customerReq(c, `/api/sellers/${user.id}/follow`, { method: "POST" });
    expect(selfFollow.status).toBe(400);

    const like = await customerReq(c, `/api/products/${pid}/like`, { method: "POST" });
    expect(like.status).toBe(200);
    const engagement = (await (await get(`/api/products/${pid}/engagement`)).json()) as {
      likeCount: number;
      likedByMe: boolean;
    };
    expect(engagement.likeCount).toBe(1);

    const comment = await customerReq(c, "/api/comments", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ targetType: "product", targetId: pid, content: "Stunning work!" }),
    });
    expect(comment.status).toBe(201);
    const commentId = Number(((await comment.json()) as { id: number }).id);

    const comments = (await (await get(`/api/comments?targetType=product&targetId=${pid}`)).json()) as Array<{
      id: number;
      content: string;
    }>;
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("Stunning work!");

    // A different user cannot delete the comment.
    const { cookie: other } = await registerRole("Other User", "otheruser@test.com", "customer");
    const hijack = await customerReq(other, `/api/comments/${commentId}`, { method: "DELETE" });
    expect(hijack.status).toBe(403);
    const del = await customerReq(c, `/api/comments/${commentId}`, { method: "DELETE" });
    expect(del.status).toBe(200);
  });
});

describe("marketplace — payments", () => {
  test("checkout requires an owned pending order on an online gateway", async () => {
    const { cookie: c } = await registerRole("Payer", "payer@test.com", "customer");

    // COD order → not an online gateway.
    const codOrder = await customerReq(c, "/api/orders", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({
        items: [{ productId: 1, quantity: 1 }],
        address: "Patan, Lalitpur",
        paymentMethod: "Cash on Delivery",
      }),
    });
    expect(codOrder.status).toBe(201);
    const codId = Number(((await codOrder.json()) as { id: number }).id);
    const codCheckout = await customerReq(c, "/api/payments/checkout", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ orderId: codId }),
    });
    expect(codCheckout.status).toBe(400);

    // Someone else's order → 403.
    const { cookie: other } = await registerRole("Other Payer", "otherpayer@test.com", "customer");
    const stolen = await customerReq(other, "/api/payments/checkout", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ orderId: codId }),
    });
    expect(stolen.status).toBe(403);

    // No session → 401.
    const anon = await post("/api/payments/checkout", { orderId: codId });
    expect(anon.status).toBe(401);
  });

  test("eSewa callback verifies the HMAC signature and marks the order paid", async () => {
    const ESEWA_SECRET = "8gBm/:&EnhH.1/q"; // sandbox test secret (config default)
    const { cookie: c } = await registerRole("Esewa Payer", "esewa@test.com", "customer");

    const orderRes = await customerReq(c, "/api/orders", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({
        items: [{ productId: 1, quantity: 1 }],
        address: "Patan, Lalitpur",
        paymentMethod: "eSewa",
      }),
    });
    const order = (await orderRes.json()) as { id: number; total: number };
    const orderId = order.id;
    const total = order.total;

    const checkout = (await (
      await customerReq(c, "/api/payments/checkout", {
        method: "POST",
        headers: jsonBody(),
        body: JSON.stringify({ orderId }),
      })
    ).json()) as { gateway: string; fields: { transaction_uuid: string; product_code: string } };
    expect(checkout.gateway).toBe("esewa");
    const uuid = checkout.fields.transaction_uuid;

    // Build the signed callback the same way eSewa would.
    const sign = (names: string[], payload: Record<string, string>) => {
      const message = names.map((n) => `${n}=${payload[n]}`).join(",");
      return createHmac("sha256", ESEWA_SECRET).update(message).digest("base64");
    };
    const signed = ["total_amount", "transaction_uuid", "product_code"];
    const payload: Record<string, string> = {
      transaction_code: "000AA1",
      status: "COMPLETE",
      total_amount: String(total),
      transaction_uuid: uuid,
      product_code: checkout.fields.product_code,
      signed_field_names: signed.join(","),
    };
    payload.signature = sign(signed, payload);
    const data = Buffer.from(JSON.stringify(payload)).toString("base64");

    const verify = await get(`/api/payments/verify/esewa?data=${encodeURIComponent(data)}`);
    expect(verify.status).toBe(302);
    expect(verify.headers.get("location")).toContain("status=paid");

    const mine = (await (await customerReq(c, "/api/my/orders")).json()) as Array<{
      id: number;
      paymentStatus: string;
    }>;
    expect(mine.find((o) => o.id === orderId)?.paymentStatus).toBe("paid");
  });

  test("Khalti checkout fails cleanly when the secret is unconfigured", async () => {
    const { cookie: c } = await registerRole("Khalti Payer", "khalti@test.com", "customer");
    const order = await customerReq(c, "/api/orders", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({
        items: [{ productId: 1, quantity: 1 }],
        address: "Patan, Lalitpur",
        paymentMethod: "Khalti",
      }),
    });
    const orderId = Number(((await order.json()) as { id: number }).id);
    const res = await customerReq(c, "/api/payments/checkout", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ orderId }),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Khalti is not configured");
  });
});

describe("products search & filtering power-ups", () => {
  test("sort=price_asc orders by effective price ascending", async () => {
    const res = await get("/api/products?sort=price_asc");
    expect(res.status).toBe(200);
    const items = (await res.json()) as { price: number; currentBid: number | null }[];
    expect(items.length).toBeGreaterThan(0);
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1].currentBid ?? items[i - 1].price;
      const curr = items[i].currentBid ?? items[i].price;
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  test("minPrice/maxPrice filter by effective price", async () => {
    const res = await get("/api/products?minPrice=1000&maxPrice=20000");
    expect(res.status).toBe(200);
    const items = (await res.json()) as { price: number; currentBid: number | null }[];
    for (const p of items) {
      const eff = p.currentBid ?? p.price;
      expect(eff).toBeGreaterThanOrEqual(1000);
      expect(eff).toBeLessThanOrEqual(20000);
    }
  });

  test("inStock=true only returns items with stock or active auctions", async () => {
    const res = await get("/api/products?inStock=true");
    expect(res.status).toBe(200);
    const items = (await res.json()) as {
      stock: number;
      auction: boolean;
      status: string;
    }[];
    for (const p of items) {
      if (!p.auction) expect(p.stock).toBeGreaterThan(0);
    }
  });

  test("sort=ending_soon returns auctions ending first", async () => {
    const res = await get("/api/products?sort=ending_soon&auction=true");
    expect(res.status).toBe(200);
    const items = (await res.json()) as { endsAt: string | null }[];
    const dates = items.map((p) =>
      p.endsAt ? new Date(p.endsAt).getTime() : Number.MAX_SAFE_INTEGER
    );
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeLessThanOrEqual(dates[i]);
    }
  });

  test("frames support sort=name_asc", async () => {
    const res = await get("/api/frames?sort=name_asc");
    expect(res.status).toBe(200);
    const items = (await res.json()) as { name: string }[];
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].name.localeCompare(items[i].name)).toBeLessThanOrEqual(0);
    }
  });
});

describe("reviews & ratings", () => {
  test("a signed-in customer can review a product once", async () => {
    const cookie = await registerCustomer("Reviewer A", "reviewer-a@test.com");
    const res = await customerReq(cookie, "/api/products/1/reviews", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ rating: 5, title: "Beautiful", body: "Gorgeous work" }),
    });
    expect(res.status).toBe(201);

    // One review per user per product.
    const dup = await customerReq(cookie, "/api/products/1/reviews", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ rating: 3 }),
    });
    expect(dup.status).toBe(409);
  });

  test("reviews endpoint returns aggregate + review list", async () => {
    const cookie = await registerCustomer("Aggregate Tester", "agg-test@test.com");
    await customerReq(cookie, "/api/products/2/reviews", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ rating: 4 }),
    });
    const res = await get("/api/products/2/reviews");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { average: number; count: number; reviews: unknown[] };
    expect(body.count).toBeGreaterThan(0);
    expect(body.reviews.length).toBe(body.count);
    expect(body.average).toBe(4);
  });

  test("product detail includes avg rating + review count", async () => {
    const cookie = await registerCustomer("Detail Tester", "detail-test@test.com");
    await customerReq(cookie, "/api/products/3/reviews", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ rating: 5 }),
    });
    const res = await get("/api/products/3");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { avgRating: number | null; reviewCount: number };
    expect(body.reviewCount).toBeGreaterThan(0);
    expect(body.avgRating).toBe(5);
  });

  test("the product's seller can reply to a review (others cannot)", async () => {
    // A seller creates their own product and gets a review.
    const sellerA = await registerRole("Vendor A", "vendor-a@test.com", "seller", "Vendor A Arts");
    const created = await customerReq(sellerA.cookie, "/api/seller/products", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({
        name: "Reviewable Artwork",
        category: "Paintings",
        price: 5000,
        image: "https://images.unsplash.com/photo-1",
        description: "A test piece",
        stock: 3,
        featured: false,
      }),
    });
    expect(created.status).toBe(201);
    const pid = Number(((await created.json()) as { id: number }).id);

    const buyer = await registerCustomer("Reviewer C", "reviewer-c@test.com");
    const revRes = await customerReq(buyer, `/api/products/${pid}/reviews`, {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ rating: 4, body: "Lovely" }),
    });
    expect(revRes.status).toBe(201);
    const reviewId = Number(((await revRes.json()) as { id: number }).id);

    // A different seller (who does not own this product) is denied.
    const otherSeller = await registerRole("Vendor B", "vendor-b@test.com", "seller", "Vendor B Arts");
    const denied = await customerReq(otherSeller.cookie, `/api/reviews/${reviewId}/reply`, {
      method: "PUT",
      headers: jsonBody(),
      body: JSON.stringify({ reply: "Hi" }),
    });
    expect(denied.status).toBe(403);

    // The product's own seller can reply.
    const ok = await customerReq(sellerA.cookie, `/api/reviews/${reviewId}/reply`, {
      method: "PUT",
      headers: jsonBody(),
      body: JSON.stringify({ reply: "Thank you for your kind words!" }),
    });
    expect(ok.status).toBe(200);

    const list = await get(`/api/products/${pid}/reviews`);
    const body = (await list.json()) as { reviews: { reply: string | null }[] };
    expect(body.reviews[0].reply).toContain("Thank you");
  });

  test("seller directory includes aggregate rating", async () => {
    const res = await get("/api/sellers");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rating: number | null; reviewCount: number }[];
    expect(body.some((s) => s.rating != null && s.reviewCount > 0)).toBe(true);
  });

  test("author can delete their review", async () => {
    const cookie = await registerCustomer("Reviewer D", "reviewer-d@test.com");
    const rev = await customerReq(cookie, "/api/products/2/reviews", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({ rating: 5 }),
    });
    const reviewId = Number(((await rev.json()) as { id: number }).id);
    const del = await customerReq(cookie, `/api/reviews/${reviewId}`, { method: "DELETE" });
    expect(del.status).toBe(200);
    const after = await get("/api/products/2/reviews");
    const body = (await after.json()) as { reviews: { id: number }[] };
    expect(body.reviews.some((r) => r.id === reviewId)).toBe(false);
  });
});

describe("order tracking timeline", () => {
  test("orders start with a pending event and grow on status changes", async () => {
    const { cookie: c } = await registerRole("Timeline Buyer", "timeline-buyer@test.com", "customer");
    const order = await customerReq(c, "/api/orders", {
      method: "POST",
      headers: jsonBody(),
      body: JSON.stringify({
        items: [{ productId: 1, quantity: 1 }],
        address: "Patan, Lalitpur",
        paymentMethod: "Cash on Delivery",
      }),
    });
    expect(order.status).toBe(201);
    const orderId = Number(((await order.json()) as { id: number }).id);

    // The customer's order list carries the timeline.
    const mine = (await (await customerReq(c, "/api/my/orders")).json()) as {
      id: number;
      events: { status: string }[];
    }[];
    const mineOrder = mine.find((o) => o.id === orderId);
    expect(mineOrder?.events.map((e) => e.status)).toEqual(["pending"]);

    // Admin moves it to confirmed → a second event is recorded.
    const upd = await sellerPatch(`/api/orders/${orderId}`, { status: "confirmed" });
    expect(upd.status).toBe(200);

    // Public events endpoint shows the full timeline, oldest first.
    const ev = await get(`/api/orders/${orderId}/events`);
    expect(ev.status).toBe(200);
    const body = (await ev.json()) as { events: { status: string }[] };
    expect(body.events.map((e) => e.status)).toEqual(["pending", "confirmed"]);
  });

  test("tracking an unknown order returns 404", async () => {
    const res = await get("/api/orders/999999/events");
    expect(res.status).toBe(404);
  });
});
