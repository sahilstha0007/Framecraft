import { Elysia, t } from "elysia";
import { all } from "../db";
import { requireAdmin } from "./auth";

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
