import { Elysia, t } from "elysia";
import { all } from "../db";
import { requireAdmin } from "./auth";

/* ── Site-wide analytics (admin only) ───────────────────────────────────── */

export const adminAnalyticsRoutes = new Elysia()
  .onBeforeHandle(requireAdmin)
  .get("/api/admin/analytics", async () => {
    const SAFE_PID =
      "CASE WHEN item ? 'productId' AND (item->>'productId') ~ '^[0-9]+$' " +
      "THEN (item->>'productId')::int ELSE -1 END";
    const ITEMS_JSON =
      "CASE WHEN o.items IS NULL OR o.items = '' THEN '[]'::jsonb ELSE o.items::jsonb END";

    const kpis = await all<Record<string, unknown>>(
      `SELECT
         (SELECT COUNT(*)::int FROM users) AS user_count,
         (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS customer_count,
         (SELECT COUNT(*)::int FROM users WHERE role = 'seller') AS seller_count,
         (SELECT COUNT(*)::int FROM products) AS product_count,
         (SELECT COUNT(*)::int FROM products WHERE auction = 1 AND status = 'active') AS active_auctions,
         (SELECT COALESCE(SUM(bid_count), 0)::int FROM products) AS total_bids,
         (SELECT COUNT(*)::int FROM product_reviews) AS total_reviews,
         (SELECT COUNT(*)::int FROM orders WHERE status <> 'cancelled') AS order_count,
         (SELECT COALESCE(SUM(total), 0)::float8 FROM orders WHERE status <> 'cancelled') AS total_revenue,
         (SELECT COUNT(*)::int FROM product_views
           WHERE viewed_at >= to_char(now() - interval '14 days', 'YYYY-MM-DD HH24:MI:SS')) AS views_14d`
    );

    // 30-day revenue curve (contiguous, DB timezone).
    const revenueByDay = await all<{ day: string; revenue: number }>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(o.total), 0)::float8 AS revenue
       FROM generate_series(now() - interval '29 days', now(), interval '1 day') AS d(day)
       LEFT JOIN orders o
         ON to_char(o.created_at::timestamp, 'YYYY-MM-DD') = to_char(d.day, 'YYYY-MM-DD')
         AND o.status <> 'cancelled'
       GROUP BY d.day ORDER BY d.day`
    );

    // Top sellers by attributed revenue over the last 90 days.
    const topSellers = await all<{
      id: number;
      name: string;
      shop_name: string | null;
      orders: number;
      revenue: number;
    }>(
      `SELECT u.id, u.name, u.shop_name,
              COUNT(DISTINCT o.id)::int AS orders,
              COALESCE(SUM(att.rev), 0)::float8 AS revenue
       FROM users u
       JOIN products p ON p.seller_id = u.id
       JOIN orders o
         ON o.created_at >= to_char(now() - interval '90 days', 'YYYY-MM-DD HH24:MI:SS')
         AND o.status <> 'cancelled'
       JOIN LATERAL (
         SELECT SUM((item->>'price')::numeric * (item->>'quantity')::numeric) AS rev
         FROM jsonb_array_elements(${ITEMS_JSON}) item
         WHERE ${SAFE_PID} = p.id
       ) att ON true
       GROUP BY u.id, u.name, u.shop_name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    // Category breakdown: products per category + 90-day attributed revenue.
    const categories = await all<{
      category: string;
      products: number;
      revenue: number;
    }>(
      `SELECT p.category,
              COUNT(DISTINCT p.id)::int AS products,
              COALESCE(SUM(att.rev), 0)::float8 AS revenue
       FROM products p
       LEFT JOIN LATERAL (
         SELECT SUM((item->>'price')::numeric * (item->>'quantity')::numeric) AS rev
         FROM orders o
         CROSS JOIN LATERAL jsonb_array_elements(${ITEMS_JSON}) item
         WHERE o.status <> 'cancelled'
           AND o.created_at >= to_char(now() - interval '90 days', 'YYYY-MM-DD HH24:MI:SS')
           AND ${SAFE_PID} = p.id
       ) att ON true
       GROUP BY p.category
       ORDER BY revenue DESC, products DESC`
    );

    const orderStatuses = await all<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC`
    );

    const k = kpis[0] ?? {};
    return {
      kpis: {
        userCount: Number(k.user_count ?? 0),
        customerCount: Number(k.customer_count ?? 0),
        sellerCount: Number(k.seller_count ?? 0),
        productCount: Number(k.product_count ?? 0),
        activeAuctions: Number(k.active_auctions ?? 0),
        totalBids: Number(k.total_bids ?? 0),
        totalReviews: Number(k.total_reviews ?? 0),
        orderCount: Number(k.order_count ?? 0),
        totalRevenue: Math.round(Number(k.total_revenue ?? 0) * 100) / 100,
        views14d: Number(k.views_14d ?? 0),
      },
      revenueByDay: revenueByDay.map((r) => ({
        day: r.day,
        revenue: Math.round(Number(r.revenue) * 100) / 100,
      })),
      topSellers: topSellers.map((s) => ({
        id: s.id,
        name: s.name,
        shopName: s.shop_name,
        orders: Number(s.orders),
        revenue: Math.round(Number(s.revenue) * 100) / 100,
      })),
      categories: categories.map((c) => ({
        category: c.category,
        products: Number(c.products),
        revenue: Math.round(Number(c.revenue) * 100) / 100,
      })),
      orderStatuses,
    };
  });

/* ── Generic resource CRUD (studio admin session required) ──────────────── */

interface FieldDef {
  /** API field name (camelCase). */
  field: string;
  /** SQL column name. */
  column: string;
  /** Store as JSON text (arrays of strings). */
  json?: boolean;
  /** Store boolean as 0/1. */
  boolean?: boolean;
  /** Fallback when the body omits the field (e.g. min_increment NOT NULL). */
  default?: string | number;
}

interface ResourceDef {
  /** API path segment, e.g. "gallery", "glass-types". */
  path: string;
  /** SQL table name. */
  table: string;
  fields: FieldDef[];
  /** TypeBox body schema for create/update. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  /** Generate a text primary key from the body (for text-keyed tables). */
  idFromBody?: (body: Record<string, unknown>) => string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function serializeFields(def: ResourceDef, body: Record<string, unknown>): (string | number | null)[] {
  return def.fields.map((f) => {
    const v = body[f.field];
    if (f.boolean) return v ? 1 : 0;
    if (f.json) return JSON.stringify(Array.isArray(v) ? v : []);
    return ((v as string | number) ?? f.default ?? null) as string | number | null;
  });
}

function crudRoutes(def: ResourceDef) {
  const cols = def.fields.map((f) => f.column);
  // Numeric tables: VALUES ($1..$n). Text-keyed tables prepend id as $1, so
  // field placeholders shift up: VALUES ($1, $2..$n+1).
  const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(", ");
  const shiftedPlaceholders = cols.map((_, idx) => `$${idx + 2}`).join(", ");
  const insertSql = def.idFromBody
    ? `INSERT INTO ${def.table} (id, ${cols.join(", ")}) VALUES ($1, ${shiftedPlaceholders}) RETURNING id`
    : `INSERT INTO ${def.table} (${cols.join(", ")}) VALUES (${placeholders}) RETURNING id`;
  const updateSql = `UPDATE ${def.table} SET ${def.fields
    .map((f, idx) => `${f.column} = $${idx + 1}`)
    .join(", ")} WHERE id = $${def.fields.length + 1} RETURNING id`;
  const idParam = def.idFromBody ? t.String() : t.Numeric();

  return new Elysia({ prefix: `/api/${def.path}` })
    .onBeforeHandle(requireAdmin)
    .post(
      "/",
      async ({ body, set }) => {
        const b = body as Record<string, unknown>;
        const values = serializeFields(def, b);

        if (def.idFromBody) {
          const id = def.idFromBody(b);
          const exists = await all<{ id: string }>(`SELECT id FROM ${def.table} WHERE id = $1`, [id]);
          if (exists[0]) {
            set.status = 409;
            return { error: "An item with this name already exists" };
          }
          await all(insertSql, [id, ...values]);
          set.status = 201;
          return { success: true, id };
        }

        const inserted = await all<{ id: number }>(insertSql, values);
        set.status = 201;
        return { success: true, id: Number(inserted[0].id) };
      },
      { body: def.body }
    )
    .put(
      "/:id",
      async ({ params, body, set }) => {
        const existing = await all<{ id: string }>(`SELECT id FROM ${def.table} WHERE id = $1`, [params.id]);
        if (!existing[0]) {
          set.status = 404;
          return { error: "Not found" };
        }
        await all(updateSql, [...serializeFields(def, body as Record<string, unknown>), params.id]);
        return { success: true, id: params.id };
      },
      { body: def.body, params: t.Object({ id: idParam }) }
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        const deleted = await all<{ id: string }>(`DELETE FROM ${def.table} WHERE id = $1 RETURNING id`, [params.id]);
        if (!deleted[0]) {
          set.status = 404;
          return { error: "Not found" };
        }
        return { success: true, id: params.id };
      },
      { params: t.Object({ id: idParam }) }
    );
}

const text = (min = 1) => t.String({ minLength: min });

export const adminRoutes = [
  crudRoutes({
    path: "gallery",
    table: "gallery_items",
    fields: [
      { field: "title", column: "title" },
      { field: "category", column: "category" },
      { field: "image", column: "image" },
      { field: "description", column: "description" },
      { field: "client", column: "client" },
    ],
    body: t.Object({
      title: text(),
      category: text(),
      image: text(),
      description: t.String(),
      client: t.String(),
    }),
  }),
  crudRoutes({
    path: "frames",
    table: "frames",
    fields: [
      { field: "name", column: "name" },
      { field: "category", column: "category" },
      { field: "material", column: "material" },
      { field: "sizes", column: "sizes", json: true },
      { field: "priceRange", column: "price_range" },
      { field: "image", column: "image" },
      { field: "description", column: "description" },
      { field: "popular", column: "popular", boolean: true },
    ],
    body: t.Object({
      name: text(),
      category: text(),
      material: text(),
      sizes: t.Array(t.String()),
      priceRange: text(),
      image: text(),
      description: t.String(),
      popular: t.Boolean(),
    }),
  }),
  crudRoutes({
    path: "services",
    table: "services",
    fields: [
      { field: "title", column: "title" },
      { field: "description", column: "description" },
      { field: "icon", column: "icon" },
      { field: "features", column: "features", json: true },
    ],
    body: t.Object({
      title: text(),
      description: t.String(),
      icon: t.String(),
      features: t.Array(t.String()),
    }),
  }),
  crudRoutes({
    path: "testimonials",
    table: "testimonials",
    fields: [
      { field: "name", column: "name" },
      { field: "role", column: "role" },
      { field: "content", column: "content" },
      { field: "rating", column: "rating" },
      { field: "image", column: "image" },
    ],
    body: t.Object({
      name: text(),
      role: t.String(),
      content: text(),
      rating: t.Number({ minimum: 1, maximum: 5 }),
      image: t.String(),
    }),
  }),
  crudRoutes({
    path: "team",
    table: "team_members",
    fields: [
      { field: "name", column: "name" },
      { field: "role", column: "role" },
      { field: "bio", column: "bio" },
      { field: "image", column: "image" },
      { field: "experience", column: "experience" },
    ],
    body: t.Object({
      name: text(),
      role: t.String(),
      bio: t.String(),
      image: t.String(),
      experience: t.String(),
    }),
  }),
  crudRoutes({
    path: "glass-types",
    table: "glass_types",
    fields: [
      { field: "name", column: "name" },
      { field: "description", column: "description" },
      { field: "price", column: "price" },
      { field: "features", column: "features", json: true },
    ],
    body: t.Object({
      name: text(),
      description: t.String(),
      price: t.Number({ minimum: 0 }),
      features: t.Array(t.String()),
    }),
    idFromBody: (b) => slugify(String(b.name ?? "")),
  }),
  crudRoutes({
    path: "products",
    table: "products",
    fields: [
      { field: "name", column: "name" },
      { field: "category", column: "category" },
      { field: "price", column: "price" },
      { field: "image", column: "image" },
      { field: "description", column: "description" },
      { field: "stock", column: "stock" },
      { field: "featured", column: "featured", boolean: true },
      { field: "auction", column: "auction", boolean: true },
      { field: "startingBid", column: "starting_bid" },
      { field: "minIncrement", column: "min_increment", default: 100 },
      { field: "endsAt", column: "ends_at" },
      { field: "status", column: "status", default: "active" },
    ],
    body: t.Object({
      name: text(),
      category: text(),
      price: t.Number({ minimum: 0 }),
      image: text(),
      description: t.String(),
      stock: t.Number({ minimum: 0 }),
      featured: t.Boolean(),
      auction: t.Optional(t.Boolean()),
      startingBid: t.Optional(t.Number({ minimum: 0 })),
      minIncrement: t.Optional(t.Number({ minimum: 1 })),
      endsAt: t.Optional(t.String({ maxLength: 40 })),
      status: t.Optional(t.String({ maxLength: 20 })),
    }),
  }),
  crudRoutes({
    path: "mat-options",
    table: "mat_options",
    fields: [
      { field: "name", column: "name" },
      { field: "color", column: "color" },
      { field: "price", column: "price" },
      { field: "description", column: "description" },
    ],
    body: t.Object({
      name: text(),
      color: t.String(),
      price: t.Number({ minimum: 0 }),
      description: t.String(),
    }),
    idFromBody: (b) => slugify(String(b.name ?? "")),
  }),
];
