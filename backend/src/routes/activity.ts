import { Elysia } from "elysia";
import { all } from "../db";

/**
 * Marketplace pulse: the homepage's live "what's happening" feed. Pure reads
 * over public data — fresh listings, recent auction wins, recent reviews and
 * new sellers. Never exposes customer PII.
 */
export const activityRoutes = new Elysia().get("/api/activity", async () => {
  const freshArrivals = await all(
    `SELECT p.id, p.name, p.category, p.price, p.image, p.description,
            p.stock, p.featured, p.auction, p.starting_bid, p.min_increment,
            p.ends_at, p.current_bid, p.bid_count, p.status, p.seller_id,
            u.name AS seller_name, u.avatar AS seller_avatar, u.shop_name AS seller_shop_name
     FROM products p
     LEFT JOIN users u ON u.id = p.seller_id
     WHERE p.auction = 0 OR p.status = 'active'
     ORDER BY p.id DESC
     LIMIT 6`
  );

  const recentWins = await all(
    `SELECT p.id AS product_id, p.name AS product_name, p.image AS product_image,
            p.ends_at, u.name AS winner_name
     FROM products p
     JOIN users u ON u.id = p.winner_id
     WHERE p.status = 'ended' AND p.winner_id IS NOT NULL
     ORDER BY p.ends_at DESC NULLS LAST, p.id DESC
     LIMIT 5`
  );

  const recentReviews = await all(
    `SELECT rv.id, rv.rating, rv.body, rv.created_at,
            p.id AS product_id, p.name AS product_name, p.image AS product_image,
            u.name AS reviewer_name
     FROM product_reviews rv
     JOIN products p ON p.id = rv.product_id
     JOIN users u ON u.id = rv.user_id
     ORDER BY rv.id DESC
     LIMIT 5`
  );

  const newSellers = await all(
    `SELECT id, name, shop_name, avatar, created_at
     FROM users
     WHERE role IN ('seller', 'admin') AND shop_name IS NOT NULL AND shop_name <> ''
     ORDER BY id DESC
     LIMIT 4`
  );

  const toProduct = (r: Record<string, unknown>) => ({
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
    sellerName: r.seller_name ?? null,
    sellerAvatar: r.seller_avatar ?? null,
    sellerShopName: r.seller_shop_name ?? null,
  });

  return {
    freshArrivals: freshArrivals.map(toProduct),
    recentWins: recentWins.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        productId: row.product_id,
        productName: row.product_name,
        productImage: row.product_image,
        endedAt: row.ends_at ?? null,
        winnerName: row.winner_name ?? null,
      };
    }),
    recentReviews: recentReviews.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        productId: row.product_id,
        productName: row.product_name,
        productImage: row.product_image,
        reviewerName: row.reviewer_name ?? null,
        rating: Number(row.rating),
        body: row.body ?? null,
        createdAt: row.created_at,
      };
    }),
    newSellers: newSellers.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id,
        name: row.name,
        shopName: row.shop_name ?? null,
        avatar: row.avatar ?? null,
        createdAt: row.created_at,
      };
    }),
  };
});
