import { Elysia, t } from "elysia";
import { all, parseJsonArray } from "../db";

function toFrame(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    material: r.material,
    sizes: parseJsonArray<string>(r.sizes),
    priceRange: r.price_range,
    image: r.image,
    description: r.description,
    popular: r.popular === 1,
  };
}

export const framesRoutes = new Elysia({ prefix: "/api/frames" })
  .get(
    "/",
    async ({ query }) => {
      const { category, popular, search } = query;
      const where: string[] = [];
      const params: (string | number)[] = [];
      let n = 1;

      if (category) {
        where.push(`category = $${n++}`);
        params.push(category);
      }
      if (popular === "true") {
        where.push("popular = 1");
      }
      if (search) {
        where.push(`(name LIKE $${n} OR description LIKE $${n + 1} OR material LIKE $${n + 2})`);
        const like = `%${search}%`;
        params.push(like, like, like);
        n += 3;
      }

      const sql = `SELECT * FROM frames${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY id`;
      const rows = await all(sql, params);
      return rows.map(toFrame);
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        popular: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await all("SELECT * FROM frames WHERE id = $1", [params.id]);
      const row = rows[0];
      if (!row) {
        set.status = 404;
        return { error: "Frame not found" };
      }
      return toFrame(row);
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
