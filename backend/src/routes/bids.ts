import { Elysia, t } from "elysia";
import { all, db } from "../db";
import { requireAuth } from "./auth";

class BidError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function toBid(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    productId: r.product_id,
    userId: r.user_id,
    amount: Number(r.amount),
    bidderName: r.bidder_name ?? null,
    createdAt: r.created_at,
  };
}

export const bidsRoutes = new Elysia()
  /* Public: bid history for a product. */
  .get("/api/products/:id/bids", async ({ params }) => {
    const rows = await all(
      `SELECT b.*, u.name AS bidder_name
       FROM bids b LEFT JOIN users u ON u.id = b.user_id
       WHERE b.product_id = $1 ORDER BY b.amount DESC LIMIT 50`,
      [params.id]
    );
    return rows.map(toBid);
  })
  /* Signed in: place a bid. */
  .guard({ beforeHandle: requireAuth }, (app) =>
    app
      .post(
        "/api/products/:id/bid",
        async ({ params, body, set, user }: any) => {
          try {
            await db.begin(async (tx) => {
              const products = (await tx.unsafe(
                `SELECT id, name, auction, starting_bid, min_increment, current_bid,
                        ends_at, status, winner_id, seller_id
                 FROM products WHERE id = $1`,
                [params.id]
              )) as {
                id: number;
                name: string;
                auction: number;
                starting_bid: number | null;
                min_increment: number;
                current_bid: number | null;
                ends_at: string | null;
                status: string;
                winner_id: number | null;
                seller_id: number | null;
              }[];
              const product = products[0];
              if (!product) throw new BidError("Product not found", 404);
              if (!product.auction) throw new BidError("This item is not an auction");
              if (product.status !== "active")
                throw new BidError("This auction has already ended");
              if (product.ends_at && product.ends_at <= new Date().toISOString().slice(0, 19))
                throw new BidError("This auction has closed");
              if (product.seller_id === user.id)
                throw new BidError("You cannot bid on your own auction");

              const floor = product.current_bid ?? product.starting_bid ?? 0;
              if (body.amount < floor + product.min_increment) {
                throw new BidError(
                  `Your bid must be at least NPR ${floor + product.min_increment} (current bid ${floor} + minimum increment ${product.min_increment})`
                );
              }

              // Atomic guard: the conditional UPDATE only lands when the bid
              // still beats the current price, so concurrent bids can't race.
              const updated = (await tx.unsafe(
                `UPDATE products
                 SET current_bid = $1, bid_count = bid_count + 1, winner_id = $2
                 WHERE id = $3 AND auction = 1 AND status = 'active'
                   AND (current_bid IS NULL AND $1 >= COALESCE(starting_bid, 0) + min_increment
                        OR current_bid IS NOT NULL AND $1 >= current_bid + min_increment)
                 RETURNING id`,
                [body.amount, user.id, params.id]
              )) as { id: number }[];
              if (!updated[0]) {
                throw new BidError(
                  "Your bid was too low — someone bid first. Refresh and try again."
                );
              }

              await tx.unsafe(
                "INSERT INTO bids (product_id, user_id, amount) VALUES ($1, $2, $3)",
                [params.id, user.id, body.amount]
              );
            });
          } catch (err) {
            if (err instanceof BidError) {
              set.status = err.status;
              return { error: err.message };
            }
            throw err;
          }
          set.status = 201;
          const productRows = await all(
            "SELECT current_bid, bid_count, winner_id FROM products WHERE id = $1",
            [params.id]
          );
          return { success: true, id: params.id, ...productRows[0] };
        },
        {
          params: t.Object({ id: t.Numeric() }),
          body: t.Object({ amount: t.Number({ minimum: 1 }) }),
        }
      )
      .get("/api/me/bids", async ({ user }: any) => {
        const rows = await all(
          `SELECT b.*, p.name AS product_name, p.image AS product_image,
                  p.status AS product_status, p.ends_at, p.current_bid, p.auction
           FROM bids b
           JOIN products p ON p.id = b.product_id
           WHERE b.user_id = $1
           ORDER BY b.created_at DESC`,
          [user.id]
        );
        return rows.map((r) => {
          const rec = r as Record<string, unknown>;
          return {
            id: rec.id,
            productId: rec.product_id,
            productName: rec.product_name,
            productImage: rec.product_image,
            productStatus: rec.product_status,
            endsAt: rec.ends_at,
            currentBid: rec.current_bid == null ? null : Number(rec.current_bid),
            amount: Number(rec.amount),
            isWinning: Number(rec.current_bid) === Number(rec.amount) && rec.product_status === "active",
            createdAt: rec.created_at,
          };
        });
      })
  );
