import { Elysia, t } from "elysia";
import { all } from "../db";
import { notify } from "./notifications";

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
 * Close any auction whose deadline has passed: mark it ended and lock in the
 * current highest bidder as the winner. Run lazily on every auction read so a
 * dead auction resolves itself without needing a cron job.
 */
export async function closeExpiredAuctions(): Promise<void> {
  // Atomically close the auctions that just crossed their deadline: the
  // conditional UPDATE only matches `status = 'active'`, so a concurrent call
  // can never double-close or double-notify.
  const closed = await all<{ id: number; name: string; winner_id: number | null }>(
    `UPDATE products SET status = 'ended'
     WHERE id IN (
       SELECT id FROM products
       WHERE auction = 1 AND status = 'active'
         AND ends_at IS NOT NULL AND ends_at < to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS')
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
