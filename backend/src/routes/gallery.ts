import { Elysia, t } from "elysia";
import { all } from "../db";

function toGalleryItem(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    image: r.image,
    description: r.description,
    client: r.client,
  };
}

export const galleryRoutes = new Elysia({ prefix: "/api/gallery" })
  .get(
    "/",
    async ({ query }) => {
      const { category } = query;
      if (category) {
        const rows = await all("SELECT * FROM gallery_items WHERE category = $1 ORDER BY id", [category]);
        return rows.map(toGalleryItem);
      }
      const rows = await all("SELECT * FROM gallery_items ORDER BY id");
      return rows.map(toGalleryItem);
    },
    { query: t.Object({ category: t.Optional(t.String()) }) }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await all("SELECT * FROM gallery_items WHERE id = $1", [params.id]);
      const row = rows[0];
      if (!row) {
        set.status = 404;
        return { error: "Gallery item not found" };
      }
      return toGalleryItem(row);
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
