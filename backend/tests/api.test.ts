import { describe, test, expect, beforeAll, afterAll } from "bun:test";

/**
 * ── API integration tests ───────────────────────────────────────────────────
 * Boots the real server (src/index.ts) as a subprocess against a scratch
 * PostgreSQL database, then exercises the marketplace's critical flows over
 * plain HTTP — exactly what a browser does.
 *
 * Run:  bun run test        (see package.json — provisions kalabazaar_test)
 *
 * The suite is self-contained: every user is registered through the API and
 * every fixture product is inserted directly with high ids (9xxx) so seed
 * rows are never touched.
 */

const BASE = process.env.TEST_API_URL ?? "http://localhost:3105";

let server: Bun.Subprocess;

let clientCounter = 0;

async function api(
  method: string,
  path: string,
  opts: { body?: unknown; cookie?: string; ip?: string } = {}
) {
  const headers: Record<string, string> = {
    // Each logical client gets its own source IP so per-IP rate buckets don't
    // bleed across tests. Pass opts.ip to pin one (rate-limit probes).
    "x-forwarded-for": opts.ip ?? `10.1.${(clientCounter += 1) % 254}.1`,
  };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.cookie) headers["cookie"] = opts.cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, body: await res.json().catch(() => ({})), setCookie };
}

function sessionFrom(setCookie: string[]): string {
  const cookie = setCookie.find((c) => c.startsWith("fc_session="));
  if (!cookie) throw new Error("no fc_session cookie in response");
  return cookie.split(";")[0];
}

beforeAll(async () => {
  server = Bun.spawn(["bun", "run", "dev"], {
    cwd: new URL("../", import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: "3105",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgres://framecraft:framecraft@localhost:5432/kalabazaar_test",
      FRONTEND_ORIGIN: "http://localhost:3100",
    },
    stdout: "ignore",
    stderr: "inherit",
  });
  // Wait for boot (migrations + seed run on start).
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE + "/api/health");
      if (r.ok) return;
    } catch {}
    await Bun.sleep(500);
  }
  throw new Error("test server did not become healthy");
});

afterAll(() => {
  server?.kill();
});

/* ── Fixtures ────────────────────────────────────────────────────────────── */

async function sql(query: string, params?: unknown[]) {
  // Direct DB access for fixtures/assertions via a tiny one-shot script call.
  const proc = Bun.spawnSync(
    ["psql", "-h", "localhost", "-U", "framecraft", "-d", "kalabazaar_test", "-tAc", query],
    { env: { ...process.env, PGPASSWORD: "framecraft" }, input: params?.join("|") }
  );
  return proc.stdout.toString().trim();
}

const FUTURE = () => new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 19);

const RUN = Date.now();

async function makeUser(name: string) {
  const email = `${name}.${RUN}@test.kalabazaar`;
  const r = await api("POST", "/api/auth/register", {
    body: { name, email, password: "s3cretPass!", role: "customer" },
  });
  expect(r.status).toBeLessThan(500);
  return { email, cookie: sessionFrom(r.setCookie) };
}

/** Fixed-price fixture: NPR 1,000 ×5 stock. */
async function makeProduct(id: number, overrides: Record<string, unknown> = {}) {
  await sql(
    `INSERT INTO products (id, name, category, price, image, description, stock,
                           auction, starting_bid, min_increment, ends_at, status)
     VALUES (${id}, 'Test Piece ${id}', 'Art', ${overrides.price ?? 1000},
             '/art/thangka.jpg', 'Test fixture', ${overrides.stock ?? 5},
             ${overrides.auction ?? 0}, ${overrides.startingBid ?? "NULL"},
             ${overrides.minIncrement ?? 100},
             ${overrides.endsAt ? `'${overrides.endsAt}'` : "NULL"}, 'active')
     ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, price = EXCLUDED.price,
       auction = EXCLUDED.auction, starting_bid = EXCLUDED.starting_bid,
       min_increment = EXCLUDED.min_increment, ends_at = EXCLUDED.ends_at,
       status = 'active', current_bid = NULL, bid_count = 0, winner_id = NULL`
  );
  await sql(`DELETE FROM bids WHERE product_id = ${id}`);
  await sql(`DELETE FROM product_reviews WHERE product_id = ${id}`);
}

/* ── Auth ────────────────────────────────────────────────────────────────── */

describe("auth", () => {
  test("register → me → logout round-trip", async () => {
    const { email, cookie } = await makeUser("auth.round");

    const me = await api("GET", "/api/auth/me", { cookie });
    expect(me.status).toBe(200);
    expect((me.body as any).user.email).toBe(email);

    const out = await api("POST", "/api/auth/logout", { cookie });
    expect(out.status).toBeLessThan(500);

    const after = await api("GET", "/api/auth/me", { cookie });
    // Contract: /me is always 200 with a nullable user — the session itself
    // must be dead server-side after logout.
    expect(after.status).toBe(200);
    expect((after.body as any).user).toBeNull();
  });

  test("login rejects wrong password", async () => {
    await makeUser("auth.login");
    const r = await api("POST", "/api/auth/login", {
      body: { email: "auth.login@test.kalabazaar", password: "totally-wrong" },
    });
    expect([400, 401]).toContain(r.status);
  });

  test("duplicate registration fails", async () => {
    const first = await makeUser("auth.dup");
    expect(first.cookie).toBeTruthy();
    const dup = await api("POST", "/api/auth/register", {
      body: { name: "Dup", email: `auth.dup.${RUN}@test.kalabazaar`, password: "s3cretPass!" },
    });
    expect(dup.status).toBeGreaterThanOrEqual(400);
  });
});

/* ── Orders ──────────────────────────────────────────────────────────────── */

describe("orders", () => {
  test("placing an order decrements stock atomically and writes a timeline", async () => {
    const { cookie } = await makeUser("order.buyer");
    await makeProduct(9101, { price: 1000, stock: 5 });

    const r = await api("POST", "/api/orders", {
      cookie,
      body: {
        items: [{ productId: 9101, quantity: 2 }],
        address: "Test Marg, Kathmandu",
        paymentMethod: "Cash on Delivery",
      },
    });
    expect(r.status).toBeLessThan(500);
    const order = r.body as any;
    expect(order.id).toBeGreaterThan(0);
    expect(order.total).toBe(2000);

    const stock = Number(await sql("SELECT stock FROM products WHERE id = 9101"));
    expect(stock).toBe(3);

    const events = await sql(
      "SELECT count(*) FROM order_events WHERE order_id = " + order.id
    );
    expect(Number(events)).toBeGreaterThanOrEqual(1);
  });

  test("rejects orders larger than stock", async () => {
    const { cookie } = await makeUser("order.toomuch");
    const r = await api("POST", "/api/orders", {
      cookie,
      body: {
        items: [{ productId: 9101, quantity: 99 }],
        address: "Test Marg, Kathmandu",
        paymentMethod: "Cash on Delivery",
      },
    });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  test("rejects unknown payment methods", async () => {
    const { cookie } = await makeUser("order.badpay");
    const r = await api("POST", "/api/orders", {
      cookie,
      body: {
        items: [{ productId: 9101, quantity: 1 }],
        address: "Test Marg, Kathmandu",
        paymentMethod: "Bitcoin",
      },
    });
    expect(r.status).toBe(400);
  });

  test("guest can track an order by id via /api/orders/:id/events", async () => {
    const { cookie } = await makeUser("order.track");
    const placed = await api("POST", "/api/orders", {
      cookie,
      body: {
        items: [{ productId: 9101, quantity: 1 }],
        address: "Test Marg, Kathmandu",
        paymentMethod: "Khalti",
      },
    });
    const id = (placed.body as any).id;
    const events = await api("GET", `/api/orders/${id}/events`);
    expect(events.status).toBe(200);
    expect(Array.isArray((events.body as any).events)).toBe(true);
  });
});

/* ── Bids ────────────────────────────────────────────────────────────────── */

describe("bids", () => {
  beforeAll(async () => {
    await makeProduct(9102, {
      auction: 1,
      startingBid: 1000,
      minIncrement: 100,
      endsAt: FUTURE(),
      stock: 1,
    });
  });

  test("rejects bids below floor + increment on a live auction", async () => {
    const { cookie } = await makeUser("bid.low");
    const r = await api("POST", "/api/products/9102/bid", {
      cookie,
      body: { amount: 1050 },
    });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  test("accepts a valid bid and caches it on the product", async () => {
    const { cookie } = await makeUser("bid.ok");
    const r = await api("POST", "/api/products/9102/bid", {
      cookie,
      body: { amount: 1100 },
    });
    expect(r.status).toBeLessThan(500);
    expect((r.body as any).current_bid).toBe(1100);

    const mine = await api("GET", "/api/me/bids", { cookie });
    const list = mine.body as any[];
    expect(list.some((b) => b.productId === 9102)).toBe(true);
  });

  test("rejects bids on fixed-price products", async () => {
    const { cookie } = await makeUser("bid.fixed");
    const r = await api("POST", "/api/products/9101/bid", {
      cookie,
      body: { amount: 5000 },
    });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});

/* ── Payments ────────────────────────────────────────────────────────────── */

describe("payments", () => {
  test("checkout validates gateway + order ownership", async () => {
    const { cookie } = await makeUser("pay.checkout");
    const bad = await api("POST", "/api/payments/checkout", {
      cookie,
      body: { orderId: 999999, gateway: "khalti" },
    });
    expect(bad.status).toBeGreaterThanOrEqual(400);
  });

  test("khalti verify without pidx redirects to failed", async () => {
    const r = await fetch(BASE + "/api/payments/verify/khalti", { redirect: "manual" });
    expect([302, 303, 400]).toContain(r.status);
    if (r.status >= 300 && r.status < 400) {
      expect(r.headers.get("location")).toContain("status=failed");
    }
  });

  test("esewa verify with garbage payload redirects to failed", async () => {
    const r = await fetch(BASE + "/api/payments/verify/esewa?data=not-base64", { redirect: "manual" });
    expect([302, 303, 400]).toContain(r.status);
    if (r.status >= 300 && r.status < 400) {
      expect(r.headers.get("location")).toContain("status=failed");
    }
  });
});

/* ── Rate limiting ───────────────────────────────────────────────────────── */

describe("rate limiting", () => {
  test("hammering login eventually returns 429", async () => {
    let saw429 = false;
    for (let i = 0; i < 15; i++) {
      const r = await api("POST", "/api/auth/login", {
        ip: "10.7.7.7",
        body: { email: `rl.${RUN}@test.kalabazaar`, password: "wrong" },
      });
      if (r.status === 429) {
        saw429 = true;
        break;
      }
    }
    expect(saw429).toBe(true);
  });
});
