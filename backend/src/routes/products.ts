import { Elysia, t } from "elysia";
import { all } from "../db";
import { notify } from "./notifications";
import { getUserBySession } from "./auth";

function toProduct(row: unknown, extra?: Record<string, unknown>) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: Number(r.price),
    image: r.image,
    description: r.description,
    stock: Number(r.stock),
    featured: Boolean(r.featured),
    auction: Boolean(r.auction),
    startingBid: r.starting_bid == null ? null : Number(r.starting_bid),
    minIncrement: Number(r.min_increment),
    endsAt: r.ends_at ?? null,
    currentBid: r.current_bid == null ? null : Number(r.current_bid),
    bidCount: Number(r.bid_count),
    status: r.status,
    sellerId: r.seller_id ?? null,
    createdAt: r.created_at,
    ...extra,
  };
}

/**
 * Notify everyone who bid on an auction that it's ending within the next two
 * hours — once per user+auction (the NOT EXISTS guard makes it idempotent, so
 * repeated lazy sweeps can never spam).
 */
async function notifyEndingSoonAuctions(): Promise<void> {
  // ends_at is stored as UTC (seeds/tests write toISOString), so the window is
  // computed in UTC too — independent of the DB session timezone.
  const ending = await all<{ id: number; name: string }>(
    `SELECT id, name FROM products
     WHERE auction = 1 AND status = 'active'
       AND ends_at IS NOT NULL
       AND ends_at > to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS')
       AND ends_at <= to_char(now() AT TIME ZONE 'UTC' + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS')`
  );
  for (const auction of ending) {
    const bidders = await all<{ user_id: number }>(
      "SELECT DISTINCT user_id FROM bids WHERE product_id = $1",
      [auction.id]
    );
    for (const b of bidders) {
      const link = `/products/${auction.id}`;
      // Idempotent even under concurrent sweeps: the partial unique index is
      // the real guard, ON CONFLICT DO NOTHING absorbs the loser of a race.
      await all(
        `INSERT INTO notifications (user_id, type, title, body, link)
         SELECT $1, 'ending_soon', $2, $3, $4
         WHERE NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.user_id = $1 AND n.type = 'ending_soon' AND n.link = $4
         )
         ON CONFLICT DO NOTHING`,
        [
          b.user_id,
          `“${auction.name}” ends in under 2 hours`,
          "Your bid is still on top? Bid now or risk losing it.",
          link,
        ]
      );
    }
  }
}

/**
 * Close any auction whose deadline has passed: mark it ended and lock in the
 * current highest bidder as the winner. Run lazily on every auction read so a
 * dead auction resolves itself without needing a cron job.
 */
export async function closeExpiredAuctions(): Promise<void> {
  await notifyEndingSoonAuctions();
  // Atomically close the auctions that just crossed their deadline: the
  // conditional UPDATE only matches `status = 'active'`, so a concurrent call
  // can never double-close or double-notify.
  const closed = await all<{ id: number; name: string; winner_id: number | null }>(
    `UPDATE products SET status = 'ended'
     WHERE id IN (
       SELECT id FROM products
       WHERE auction = 1 AND status = 'active'
         AND ends_at IS NOT NULL
         AND ends_at < to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS')
     )
     RETURNING id, name, winner_id`
  );
  for (const e of closed) {
    if (e.winner_id) {
      await notify(
        e.winner_id,
        "auction_won",
        `You won “${e.name}”`,
        "Congratulations! The seller will contact you to arrange delivery.",
        `/products/${e.id}`
      );
    }
  }
}

const PRODUCT_SELECT = `
  SELECT p.*,
         u.name AS seller_name, u.avatar AS seller_avatar, u.shop_name AS seller_shop_name,
         rv.avg_rating, rv.review_count
  FROM products p
  LEFT JOIN users u ON u.id = p.seller_id
  LEFT JOIN (
    SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating,
           COUNT(*)::int AS review_count
    FROM product_reviews GROUP BY product_id
  ) rv ON rv.product_id = p.id`;

/** PRODUCT_SELECT + the 14-day view counts and the weighted trending score. */
const TRENDING_SELECT = `
  SELECT p.*,
         u.name AS seller_name, u.avatar AS seller_avatar, u.shop_name AS seller_shop_name,
         rv.avg_rating, rv.review_count,
         COALESCE(v.views_14d, 0)::int AS views,
         (COALESCE(v.views_14d, 0) * 2 + p.bid_count * 4 + COALESCE(rv.review_count, 0) * 3)::int AS score
  FROM products p
  LEFT JOIN users u ON u.id = p.seller_id
  LEFT JOIN (
    SELECT product_id, COUNT(*)::int AS views_14d
    FROM product_views
    WHERE viewed_at >= to_char(now() - interval '14 days', 'YYYY-MM-DD HH24:MI:SS')
    GROUP BY product_id
  ) v ON v.product_id = p.id
  LEFT JOIN (
    SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating,
           COUNT(*)::int AS review_count
    FROM product_reviews GROUP BY product_id
  ) rv ON rv.product_id = p.id`;

/** Public shop reads. Writes go through the seller-scoped or admin CRUD. */
export const productsRoutes = new Elysia({ prefix: "/api/products" })
  .get("/", async ({ query }) => {
    await closeExpiredAuctions();
    const where: string[] = [];
    const values: (string | number)[] = [];
    if (query.category && query.category !== "All") {
      values.push(String(query.category));
      where.push(`p.category = $${values.length}`);
    }
    if (query.featured === "true") where.push("p.featured = 1");
    if (query.auction === "true") where.push("p.auction = 1");
    if (query.status) {
      values.push(String(query.status));
      where.push(`p.status = $${values.length}`);
    }
    if (query.search) {
      values.push(`%${String(query.search).toLowerCase()}%`);
      where.push(`LOWER(p.name) LIKE $${values.length}`);
    }
    // Shop filtering power-ups: in-stock only, and a price range that applies
    // to the effective price (current bid for auctions, list price otherwise).
    if (query.inStock === "true") {
      where.push("((p.auction = 1 AND p.status = 'active') OR p.stock > 0)");
    }
    const effectivePrice = "COALESCE(p.current_bid, p.price)";
    const minNum = Number(query.minPrice);
    if (query.minPrice != null && query.minPrice !== "" && !Number.isNaN(minNum)) {
      values.push(minNum);
      where.push(`${effectivePrice} >= $${values.length}`);
    }
    const maxNum = Number(query.maxPrice);
    if (query.maxPrice != null && query.maxPrice !== "" && !Number.isNaN(maxNum)) {
      values.push(maxNum);
      where.push(`${effectivePrice} <= $${values.length}`);
    }
    const SORTS: Record<string, string> = {
      newest: "p.id DESC",
      price_asc: `${effectivePrice} ASC, p.id ASC`,
      price_desc: `${effectivePrice} DESC, p.id ASC`,
      most_bids: "p.bid_count DESC, p.id ASC",
      popular: "p.featured DESC, p.bid_count DESC, p.id ASC",
      ending_soon: "p.ends_at ASC NULLS LAST, p.id ASC",
    };
    const orderBy = SORTS[String(query.sort ?? "")] ?? "p.featured DESC, p.id ASC";
    const sql = `${PRODUCT_SELECT}${
      where.length ? ` WHERE ${where.join(" AND ")}` : ""
    } ORDER BY ${orderBy}`;
    const rows = await all(sql, values);
    return rows.map((r) =>
      toProduct(r, {
        sellerName: (r as Record<string, unknown>).seller_name ?? null,
        sellerAvatar: (r as Record<string, unknown>).seller_avatar ?? null,
        sellerShopName: (r as Record<string, unknown>).seller_shop_name ?? null,
        avgRating:
          (r as Record<string, unknown>).avg_rating == null
            ? null
            : Number((r as Record<string, unknown>).avg_rating),
        reviewCount: Number((r as Record<string, unknown>).review_count ?? 0),
      })
    );
  })
  // ── Trending: rank every sellable product by live marketplace signals ──
  // Score = 2× views (last 14 days) + 4× bid count + 3× review count.
  .get(
    "/trending",
    async () => {
      await closeExpiredAuctions();
      const rows = await all(
        `${TRENDING_SELECT}
         WHERE (p.auction = 1 AND p.status = 'active') OR (p.auction = 0 AND p.stock > 0)
         ORDER BY score DESC, p.bid_count DESC, p.id ASC
         LIMIT 8`
      );
      return rows.map((r) => {
        const row = r as Record<string, unknown>;
        return toProduct(row, {
          sellerName: row.seller_name ?? null,
          sellerAvatar: row.seller_avatar ?? null,
          sellerShopName: row.seller_shop_name ?? null,
          avgRating: row.avg_rating == null ? null : Number(row.avg_rating),
          reviewCount: Number(row.review_count ?? 0),
          views: Number(row.views ?? 0),
          score: Number(row.score ?? 0),
        });
      });
    }
  )
  // ── Picked for you: category co-occurrence recommendations ────────────
  // `basedOn` is a comma-separated list of product ids the visitor has viewed.
  // We surface other sellable products that share a category, ranked by the
  // same trending score, each tagged with which viewed product drove it.
  .get(
    "/recommendations",
    async ({ query }) => {
      await closeExpiredAuctions();
      const ids = String(query.basedOn ?? "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
      const unique = [...new Set(ids)].slice(0, 12);
      if (!unique.length) return { items: [], basedOn: [] };

      const baseRows = await all<{ id: number; name: string; category: string }>(
        `SELECT id, name, category FROM products WHERE id IN (${unique
          .map((_, i) => `$${i + 1}`)
          .join(",")})`,
        unique
      );
      if (!baseRows.length) return { items: [], basedOn: [] };
      const categories = [...new Set(baseRows.map((r) => r.category))];

      // Postgres via Bun.sql doesn't encode JS-array params, so the IN lists
      // are built with explicit placeholders (both lists are non-empty here).
      const catPh = categories.map((_, i) => `$${i + 1}`).join(",");
      const idPh = unique
        .map((_, i) => `$${categories.length + i + 1}`)
        .join(",");
      const rows = await all(
        `${TRENDING_SELECT}
         WHERE p.category IN (${catPh})
           AND p.id NOT IN (${idPh})
           AND ((p.auction = 1 AND p.status = 'active') OR (p.auction = 0 AND p.stock > 0))
         ORDER BY score DESC, p.id ASC
         LIMIT 8`,
        [...categories, ...unique]
      );

      const items = rows.map((r) => {
        const row = r as Record<string, unknown>;
        // The viewed product that shares this item's category (first match).
        const match = baseRows.find((b) => b.category === row.category);
        return toProduct(row, {
          sellerName: row.seller_name ?? null,
          sellerAvatar: row.seller_avatar ?? null,
          sellerShopName: row.seller_shop_name ?? null,
          avgRating: row.avg_rating == null ? null : Number(row.avg_rating),
          reviewCount: Number(row.review_count ?? 0),
          views: Number(row.views ?? 0),
          score: Number(row.score ?? 0),
          reason: match ? { id: match.id, name: match.name } : null,
        });
      });

      return {
        items,
        basedOn: baseRows.map((b) => ({ id: b.id, name: b.name })),
      };
    }
  )
  // ── View tracking: fire-and-forget ping from the product page. Optional
  // auth — guests count too (user_id NULL, visitor_id from localStorage).
  // Dedup: one view per identity per product per hour, so the trending score
  // can't be inflated by hammering this endpoint. Anonymous pings without a
  // visitor id share one bucket and count at most hourly.
  .post(
    "/:id/view",
    async ({ params, request, body, set }) => {
      const found = await all("SELECT id FROM products WHERE id = $1", [params.id]);
      if (!found[0]) {
        set.status = 404;
        return { error: "Product not found" };
      }
      const user = await getUserBySession(request);
      const visitorId = typeof body?.visitorId === "string" ? body.visitorId : null;
      const userParam = user?.id ?? null;
      const visitorParam = user ? null : visitorId;
      // Explicit casts: Postgres can't infer parameter types inside an
      // INSERT..SELECT..WHERE NOT EXISTS without them.
      await all(
        `INSERT INTO product_views (product_id, user_id, visitor_id)
         SELECT $1::int, $2::int, $3::text
         WHERE NOT EXISTS (
           SELECT 1 FROM product_views pv
           WHERE pv.product_id = $1::int
             AND pv.viewed_at >= to_char(now() - interval '1 hour', 'YYYY-MM-DD HH24:MI:SS')
             AND (
               ($2::int IS NOT NULL AND pv.user_id = $2::int)
               OR ($2::int IS NULL AND $3::text IS NOT NULL AND pv.visitor_id = $3::text)
               OR ($2::int IS NULL AND $3::text IS NULL AND pv.user_id IS NULL)
             )
         )`,
        [params.id, userParam, visitorParam]
      );
      return { ok: true };
    },
    { params: t.Object({ id: t.Numeric() }), body: t.Optional(t.Object({ visitorId: t.Optional(t.String({ maxLength: 128 })) })) }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      await closeExpiredAuctions();
      const rows = await all(`${PRODUCT_SELECT} WHERE p.id = $1`, [params.id]);
      if (!rows[0]) {
        set.status = 404;
        return { error: "Product not found" };
      }
      const r = rows[0] as Record<string, unknown>;
      const bidRows = await all<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM bids WHERE product_id = $1",
        [params.id]
      );
      return toProduct(r, {
        sellerName: r.seller_name ?? null,
        sellerAvatar: r.seller_avatar ?? null,
        sellerShopName: r.seller_shop_name ?? null,
        actualBidCount: Number(bidRows[0]?.count ?? 0),
        avgRating: r.avg_rating == null ? null : Number(r.avg_rating),
        reviewCount: Number(r.review_count ?? 0),
      });
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
