import { Elysia, t } from "elysia";
import { all, parseJsonArray } from "../db";

function toService(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    icon: r.icon,
    features: parseJsonArray<string>(r.features),
  };
}

export const servicesRoutes = new Elysia({ prefix: "/api/services" })
  .get("/", async () => {
    const rows = await all("SELECT * FROM services ORDER BY id");
    return rows.map(toService);
  })
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await all("SELECT * FROM services WHERE id = $1", [params.id]);
      const row = rows[0];
      if (!row) {
        set.status = 404;
        return { error: "Service not found" };
      }
      return toService(row);
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
