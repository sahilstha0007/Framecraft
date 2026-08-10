import { Elysia, t } from "elysia";
import { all } from "../db";
import { getUserBySession, requireAuth } from "./auth";

/**
 * Reviews & ratings: one review (1-5 stars) per user per product, with an
 * optional seller reply. Aggregate rating is surfaced on product and seller
 * reads (see products.ts / sellers.ts).
 */

function toReview(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    productId: r.product_id,
    rating: Number(r.rating),
    title: r.title ?? null,
    body: r.body ?? null,
    reply: r.reply ?? null,
    repliedAt: r.replied_at ?? null,
    createdAt: r.created_at,
    userId: r.user_id,
    author: {
      name: r.author_name ?? null,
      avatar: r.author_avatar ?? null,
    },
  };
}

export const reviewsRoutes = new Elysia()
  /* Public: reviews for a product with the average + count. */
  .get("/api/products/:id/reviews", async ({ params }) => {
    const rows = await all(
      `SELECT r.*, u.name AS author_name, u.avatar AS author_avatar
       FROM product_reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [params.id]
    );
    const agg = await all<{ average: number | null; count: number }>(
      `SELECT ROUND(AVG(rating)::numeric, 1) AS average, COUNT(*)::int AS count
       FROM product_reviews WHERE product_id = $1`,
      [params.id]
    );
    return {
      productId: params.id,
      average: agg[0]?.average == null ? null : Number(agg[0].average),
      count: Number(agg[0]?.count ?? 0),
      reviews: rows.map(toReview),
    };
  })
  .guard({ beforeHandle: requireAuth }, (app) =>
    app
      /* Signed-in: write a review (one per user per product). */
      .post(
        "/api/products/:id/reviews",
        async ({ params, body, set, user }: any) => {
          const product = await all<{ id: number; seller_id: number }>(
            "SELECT id, seller_id FROM products WHERE id = $1",
            [params.id]
          );
          if (!product[0]) {
            set.status = 404;
            return { error: "Product not found" };
          }
          const existing = await all(
            "SELECT id FROM product_reviews WHERE product_id = $1 AND user_id = $2",
            [params.id, user.id]
          );
          if (existing[0]) {
            set.status = 409;
            return { error: "You have already reviewed this product" };
          }
          const inserted = await all<{ id: number }>(
            `INSERT INTO product_reviews (product_id, user_id, rating, title, body)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [params.id, user.id, body.rating, body.title ?? null, body.body ?? null]
          );
          set.status = 201;
          const rows = await all(
            `SELECT r.*, u.name AS author_name, u.avatar AS author_avatar
             FROM product_reviews r JOIN users u ON u.id = r.user_id
             WHERE r.id = $1`,
            [inserted[0].id]
          );
          return toReview(rows[0]);
        },
        {
          params: t.Object({ id: t.Numeric() }),
          body: t.Object({
            rating: t.Integer({ minimum: 1, maximum: 5 }),
            title: t.Optional(t.String({ maxLength: 120 })),
            body: t.Optional(t.String({ maxLength: 2000 })),
          }),
        }
      )
      /* Signed-in: the product's seller (or an admin) replies to a review. */
      .put(
        "/api/reviews/:id/reply",
        async ({ params, body, set, user }: any) => {
          const rows = await all<{ id: number; product_id: number }>(
            "SELECT id, product_id FROM product_reviews WHERE id = $1",
            [params.id]
          );
          if (!rows[0]) {
            set.status = 404;
            return { error: "Review not found" };
          }
          const product = await all<{ seller_id: number }>(
            "SELECT seller_id FROM products WHERE id = $1",
            [rows[0].product_id]
          );
          const isSeller = product[0]?.seller_id === user.id;
          if (!isSeller && user.role !== "admin") {
            set.status = 403;
            return { error: "Only the product's seller can reply" };
          }
          await all(
            `UPDATE product_reviews SET reply = $1, replied_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
             WHERE id = $2`,
            [body.reply.trim(), params.id]
          );
          return { success: true, id: params.id };
        },
        {
          params: t.Object({ id: t.Numeric() }),
          body: t.Object({ reply: t.String({ minLength: 1, maxLength: 2000 }) }),
        }
      )
      /* Signed-in: the author (or an admin) deletes a review. */
      .delete(
        "/api/reviews/:id",
        async ({ params, set, user }: any) => {
          const rows = await all<{ user_id: number }>(
            "SELECT user_id FROM product_reviews WHERE id = $1",
            [params.id]
          );
          if (!rows[0]) {
            set.status = 404;
            return { error: "Review not found" };
          }
          if (rows[0].user_id !== user.id && user.role !== "admin") {
            set.status = 403;
            return { error: "You can only delete your own reviews" };
          }
          await all("DELETE FROM product_reviews WHERE id = $1", [params.id]);
          return { success: true, id: params.id };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
  );
