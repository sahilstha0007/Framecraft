import { Elysia } from "elysia";
import { all } from "../db";

export const testimonialsRoutes = new Elysia({ prefix: "/api/testimonials" }).get("/", async () => {
  const rows = await all("SELECT * FROM testimonials ORDER BY id");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    content: r.content,
    rating: r.rating,
    image: r.image,
  }));
});
