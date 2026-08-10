import { Elysia, t } from "elysia";
import { all, db } from "../db";
import { REQUEST_STATUSES } from "./helpers";
import { requireAuth, requireAdmin } from "./auth";

/**
 * Orders. Checkout requires a signed-in customer; prices are always computed
 * server-side from the product table (never trusted from the client), and the
 * whole placement — stock check, decrement, insert — runs in one transaction
 * with a conditional `UPDATE … WHERE stock >= qty` as the atomic stock guard,
 * so concurrent orders can never oversell. `payment_status` stays "pending"
 * until the admin confirms offline settlement — a real eSewa/Khalti gateway
 * can later write "paid" here without changing the order model.
 */

/** Thrown inside the transaction to abort it with a specific HTTP status. */
class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const PAYMENT_METHODS = ["eSewa", "Khalti", "Fonepay", "Bank Transfer", "Cash on Delivery"] as const;

interface OrderRow {
  id: number;
  user_id: number | null;
  customer_name: string;
  email: string;
  phone: string | null;
  address: string;
  payment_method: string;
  payment_status: string;
  items: string;
  subtotal: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
}

function toOrder(row: unknown) {
  const r = row as Record<string, unknown>;
  let items: unknown = [];
  try {
    items = JSON.parse(String(r.items ?? "[]"));
  } catch {
    /* malformed — treat as empty */
  }
  return {
    id: r.id,
    userId: r.user_id ?? null,
    customerName: r.customer_name,
    email: r.email,
    phone: r.phone ?? null,
    address: r.address,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    items,
    subtotal: Number(r.subtotal),
    total: Number(r.total),
    status: r.status,
    notes: r.notes ?? null,
    createdAt: r.created_at,
  };
}

export const ordersRoutes = new Elysia({ prefix: "/api" })
  /* Customer: place an order (signed in required). */
  .guard({ beforeHandle: requireAuth }, (app) =>
    app
      .post(
        "/orders",
        async ({ body, set, user }: any) => {
          let orderId: number;
          try {
            orderId = await db.begin(async (tx) => {
              const ids = body.items.map((i: { productId: number }) => i.productId);
              const placeholders = ids.map((_: unknown, i: number) => `$${i + 1}`).join(", ");
              const rows = (await tx.unsafe(
                `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders})`,
                ids
              )) as { id: number; name: string; price: number; stock: number }[];
              const byId = new Map(rows.map((r) => [r.id, r]));

              // Build server-priced line items; reject anything unknown or short.
              const items = body.items.map((item: { productId: number; quantity: number }) => {
                const product = byId.get(item.productId);
                if (!product) throw new OrderError(`Product ${item.productId} not found`, 400);
                if (product.stock < item.quantity) {
                  throw new OrderError(
                    `Not enough stock for “${product.name}” (${product.stock} left)`,
                    400
                  );
                }
                return {
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  quantity: item.quantity,
                };
              });

              // Atomic stock guard: the conditional UPDATE is what prevents
              // overselling when two orders race — 0 rows updated means the
              // stock ran out between the SELECT and here, so abort + rollback.
              for (const item of body.items) {
                const updated = (await tx.unsafe(
                  "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id",
                  [item.quantity, item.productId]
                )) as { id: number }[];
                if (!updated[0]) {
                  const product = byId.get(item.productId);
                  throw new OrderError(
                    `Not enough stock for “${product?.name ?? item.productId}”`,
                    400
                  );
                }
              }

              const subtotal =
                Math.round(
                  items.reduce(
                    (sum: number, i: { price: number; quantity: number }) =>
                      sum + i.price * i.quantity,
                    0
                  ) * 100
                ) / 100;

              const inserted = (await tx.unsafe(
                `INSERT INTO orders
                   (user_id, customer_name, email, phone, address, payment_method,
                    payment_status, items, subtotal, total, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10)
                 RETURNING id`,
                [
                  user.id,
                  user.name,
                  user.email,
                  body.phone ?? null,
                  body.address,
                  body.paymentMethod,
                  JSON.stringify(items),
                  subtotal,
                  subtotal,
                  body.notes ?? null,
                ]
              )) as { id: number }[];
              return inserted[0].id;
            });
          } catch (err) {
            if (err instanceof OrderError) {
              set.status = err.status;
              return { error: err.message };
            }
            throw err;
          }
          set.status = 201;
          const orderRows = await all("SELECT * FROM orders WHERE id = $1", [orderId]);
          return toOrder(orderRows[0]);
        },
        {
          body: t.Object({
            items: t.Array(
              t.Object({
                productId: t.Numeric(),
                quantity: t.Number({ minimum: 1, maximum: 99 }),
              }),
              { minItems: 1, maxItems: 50 }
            ),
            phone: t.Optional(t.String({ maxLength: 40 })),
            address: t.String({ minLength: 5, maxLength: 300 }),
            paymentMethod: t.Union([...PAYMENT_METHODS].map((m) => t.Literal(m))),
            notes: t.Optional(t.String({ maxLength: 1000 })),
          }),
        }
      )
      .get("/my/orders", async ({ user }: any) => {
        const rows = await all<OrderRow>(
          "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
          [user.id]
        );
        return rows.map(toOrder);
      })
  )
  /* Admin: every order + status/payment management. */
  .guard({ beforeHandle: requireAdmin }, (app) =>
    app
      .get("/orders", async () => {
        const rows = await all<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC");
        return rows.map(toOrder);
      })
      .patch(
        "/orders/:id",
        async ({ params, body, set }) => {
          const existing = await all("SELECT id FROM orders WHERE id = $1", [params.id]);
          if (!existing[0]) {
            set.status = 404;
            return { error: "Order not found" };
          }
          const updates: string[] = [];
          const values: (string | number)[] = [];
          if (body.status) {
            values.push(body.status);
            updates.push(`status = $${values.length}`);
          }
          if (body.paymentStatus) {
            values.push(body.paymentStatus);
            updates.push(`payment_status = $${values.length}`);
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
            paymentStatus: t.Optional(t.Union([t.Literal("pending"), t.Literal("paid")])),
            notes: t.Optional(t.String({ maxLength: 2000 })),
          }),
        }
      )
  );
