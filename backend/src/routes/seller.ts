import { Elysia, t } from "elysia";
import { all } from "../db";
import { requireSeller } from "./auth";
import { REQUEST_STATUSES } from "./helpers";

/**
 * The marketplace seller's own shop: their products (fixed-price and
 * auctions), ending auctions early, and the orders customers placed for
 * their items. Ownership is always checked — a seller can never touch another
 * vendor's catalog.
 */

export const PRODUCT_BODY = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  category: t.String({ minLength: 1, maxLength: 80 }),
  price: t.Number({ minimum: 0 }),
  image: t.String({ maxLength: 500 }),
  description: t.String(),
  stock: t.Number({ minimum: 0, maximum: 100000 }),
  featured: t.Boolean(),
  auction: t.Optional(t.Boolean()),
  startingBid: t.Optional(t.Number({ minimum: 0 })),
  minIncrement: t.Optional(t.Number({ minimum: 1 })),
  endsAt: t.Optional(t.String({ maxLength: 40 })),
  status: t.Optional(
    t.Union([t.Literal("active"), t.Literal("ended"), t.Literal("sold"), t.Literal("cancelled")])
  ),
});

function serializeProductBody(body: Record<string, unknown>) {
  const auction = Boolean(body.auction);
  return [
    String(body.name ?? "").trim(),
    String(body.category ?? "").trim(),
    Number(body.price) || 0,
    String(body.image ?? ""),
    String(body.description ?? ""),
    Number(body.stock) || 0,
    body.featured ? 1 : 0,
    auction ? 1 : 0,
    auction ? (body.startingBid != null ? Number(body.startingBid) : 0) : null,
    auction ? (body.minIncrement != null ? Number(body.minIncrement) : 100) : 100,
    auction && body.endsAt ? String(body.endsAt).slice(0, 19) : null,
    String(body.status ?? "active"),
  ];
}

export const sellerRoutes = new Elysia()
  .guard({ beforeHandle: requireSeller }, (app) =>
    app
      /* ── own products ── */
      .get("/api/seller/products", async ({ user }: any) => {
        const rows = await all(
          `SELECT * FROM products WHERE seller_id = $1 ORDER BY id DESC`,
          [user.id]
        );
        return rows;
      })
      .post(
        "/api/seller/products",
        async ({ body, set, user }: any) => {
          const values = serializeProductBody(body as Record<string, unknown>);
          const inserted = await all<{ id: number }>(
            `INSERT INTO products
               (name, category, price, image, description, stock, featured,
                auction, starting_bid, min_increment, ends_at, status, seller_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING id`,
            [...values, user.id]
          );
          set.status = 201;
          const rows = await all("SELECT * FROM products WHERE id = $1", [inserted[0].id]);
          return rows[0];
        },
        { body: PRODUCT_BODY }
      )
      .put(
        "/api/seller/products/:id",
        async ({ params, body, set, user }: any) => {
          const owns = await all<{ id: number }>(
            "SELECT id FROM products WHERE id = $1 AND seller_id = $2",
            [params.id, user.id]
          );
          if (!owns[0]) {
            set.status = 403;
            return { error: "You can only edit your own products" };
          }
          const values = serializeProductBody(body as Record<string, unknown>);
          await all(
            `UPDATE products SET name = $1, category = $2, price = $3, image = $4,
                    description = $5, stock = $6, featured = $7, auction = $8,
                    starting_bid = $9, min_increment = $10, ends_at = $11, status = $12
             WHERE id = $13`,
            [...values, params.id]
          );
          const rows = await all("SELECT * FROM products WHERE id = $1", [params.id]);
          return rows[0];
        },
        { params: t.Object({ id: t.Numeric() }), body: PRODUCT_BODY }
      )
      .delete(
        "/api/seller/products/:id",
        async ({ params, set, user }: any) => {
          const owns = await all<{ id: number }>(
            "SELECT id FROM products WHERE id = $1 AND seller_id = $2",
            [params.id, user.id]
          );
          if (!owns[0]) {
            set.status = 403;
            return { error: "You can only delete your own products" };
          }
          await all("DELETE FROM products WHERE id = $1", [params.id]);
          return { success: true, id: params.id };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
      /* ── own blog posts (including drafts) ── */
      .get("/api/seller/posts", async ({ user }: any) => {
        const rows = await all(
          `SELECT p.*, u.name AS author_name, u.avatar AS author_avatar,
                  u.shop_name AS author_shop_name, u.bio AS author_bio
           FROM posts p JOIN users u ON u.id = p.seller_id
           WHERE p.seller_id = $1 ORDER BY p.created_at DESC`,
          [user.id]
        );
        return rows;
      })
      /* ── end an auction early (winner = current highest bidder) ── */
      .post(
        "/api/seller/products/:id/end",
        async ({ params, set, user }: any) => {
          const rows = await all<{ id: number; auction: number; status: string }>(
            "SELECT id, auction, status FROM products WHERE id = $1 AND seller_id = $2",
            [params.id, user.id]
          );
          if (!rows[0]) {
            set.status = 404;
            return { error: "Product not found" };
          }
          if (!rows[0].auction) {
            set.status = 400;
            return { error: "This item is not an auction" };
          }
          if (rows[0].status !== "active") {
            set.status = 400;
            return { error: "This auction is already closed" };
          }
          await all("UPDATE products SET status = 'ended' WHERE id = $1", [params.id]);
          return { success: true, id: params.id };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
      /* ── incoming orders (items belonging to this seller) ── */
      .get("/api/seller/orders", async ({ user }: any) => {
        const productIds = await all<{ id: number }>(
          "SELECT id FROM products WHERE seller_id = $1",
          [user.id]
        );
        const ids = productIds.map((p) => p.id);
        if (ids.length === 0) return [];
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
        const rows = await all(`SELECT * FROM orders ORDER BY created_at DESC`);
        // Client-side match: an order is "yours" if any line item is your product.
        return rows
          .filter((r) => {
            const rec = r as Record<string, unknown>;
            let items: { productId: number }[] = [];
            try {
              items = JSON.parse(String(rec.items ?? "[]"));
            } catch {
              items = [];
            }
            return items.some((i) => ids.includes(i.productId));
          })
          .map((r) => r);
      })
      .patch(
        "/api/seller/orders/:id",
        async ({ params, body, set, user }: any) => {
          const rows = await all<{ id: number; items: string }>(
            "SELECT id, items FROM orders WHERE id = $1",
            [params.id]
          );
          if (!rows[0]) {
            set.status = 404;
            return { error: "Order not found" };
          }
          const own = await all<{ id: number }>(
            "SELECT id FROM products WHERE seller_id = $1",
            [user.id]
          );
          const ownIds = own.map((p) => p.id);
          let items: { productId: number }[] = [];
          try {
            items = JSON.parse(rows[0].items);
          } catch {
            items = [];
          }
          if (!items.some((i) => ownIds.includes(i.productId)) && user.role !== "admin") {
            set.status = 403;
            return { error: "This order does not contain any of your products" };
          }
          const updates: string[] = [];
          const values: (string | number)[] = [];
          if (body.status) {
            values.push(body.status);
            updates.push(`status = $${values.length}`);
          }
          if (body.notes !== undefined) {
            values.push(body.notes);
            updates.push(`notes = $${values.length}`);
          }
          if (updates.length === 0) return { success: true, id: params.id };
          values.push(params.id);
          await all(`UPDATE orders SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
          return { success: true, id: params.id };
        },
        {
          params: t.Object({ id: t.Numeric() }),
          body: t.Object({
            status: t.Optional(t.Union([...REQUEST_STATUSES].map((s) => t.Literal(s)))),
            notes: t.Optional(t.String({ maxLength: 2000 })),
          }),
        }
      )
  );
