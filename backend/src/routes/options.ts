import { Elysia } from "elysia";
import { all, parseJsonArray } from "../db";

export const optionsRoutes = new Elysia({ prefix: "/api/options" })
  .get("/glass-types", async () => {
    const rows = await all("SELECT * FROM glass_types ORDER BY price");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      features: parseJsonArray<string>(r.features),
    }));
  })
  .get("/mat-options", async () => {
    const rows = await all("SELECT * FROM mat_options ORDER BY price");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      price: r.price,
      description: r.description,
    }));
  });
