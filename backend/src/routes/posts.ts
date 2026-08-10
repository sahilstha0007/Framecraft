import { Elysia, t } from "elysia";
import { all } from "../db";
import { requireSeller } from "./auth";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";

const POST_SELECT = `
  SELECT p.*, u.name AS author_name, u.avatar AS author_avatar,
         u.shop_name AS author_shop_name, u.bio AS author_bio
  FROM posts p JOIN users u ON u.id = p.seller_id`;

function toPost(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt ?? null,
    content: r.content,
    coverImage: r.cover_image ?? null,
    status: r.status,
    sellerId: r.seller_id,
    author: {
      name: r.author_name,
      avatar: r.author_avatar,
      shopName: r.author_shop_name,
      bio: r.author_bio,
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? null,
  };
}

export const postsRoutes = new Elysia()
  /* Public: published posts with author info. */
  .get("/api/posts", async ({ query }) => {
    const where = ["p.status = 'published'"];
    const values: (string | number)[] = [];
    if (query.author) {
      values.push(Number(query.author));
      where.push(`p.seller_id = $${values.length}`);
    }
    const rows = await all(
      `${POST_SELECT} WHERE ${where.join(" AND ")} ORDER BY p.created_at DESC LIMIT 60`,
      values
    );
    return rows.map(toPost);
  })
  .get(
    "/api/posts/:slug",
    async ({ params, set }) => {
      const rows = await all(`${POST_SELECT} WHERE p.slug = $1`, [params.slug]);
      if (!rows[0]) {
        set.status = 404;
        return { error: "Post not found" };
      }
      if ((rows[0] as Record<string, unknown>).status !== "published") {
        set.status = 404;
        return { error: "Post not found" };
      }
      return toPost(rows[0]);
    },
    { params: t.Object({ slug: t.String() }) }
  )
  /* Vendor + admin: author their own blog. */
  .guard({ beforeHandle: requireSeller }, (app) =>
    app
      .post(
        "/api/posts",
        async ({ body, set, user }: any) => {
          const slug = body.slug?.trim() || slugify(body.title);
          try {
            const inserted = await all<{ id: number }>(
              `INSERT INTO posts (seller_id, title, slug, excerpt, content, cover_image, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
              [
                user.id,
                body.title.trim(),
                slug,
                (body.excerpt ?? "").trim(),
                body.content,
                body.coverImage ?? null,
                body.status ?? "published",
              ]
            );
            set.status = 201;
            const rows = await all(`${POST_SELECT} WHERE p.id = $1`, [inserted[0].id]);
            return toPost(rows[0]);
          } catch (err) {
            if ((err as { code?: string }).code === "23505") {
              set.status = 409;
              return { error: "A post with this slug already exists — try a different title" };
            }
            throw err;
          }
        },
        {
          body: t.Object({
            title: t.String({ minLength: 1, maxLength: 200 }),
            slug: t.Optional(t.String({ maxLength: 120 })),
            excerpt: t.Optional(t.String({ maxLength: 400 })),
            content: t.String({ minLength: 1 }),
            coverImage: t.Optional(t.String({ maxLength: 500 })),
            status: t.Optional(t.Union([t.Literal("draft"), t.Literal("published")])),
          }),
        }
      )
      .put(
        "/api/posts/:id",
        async ({ params, body, set, user }: any) => {
          const rows = await all<{ seller_id: number }>(
            "SELECT seller_id FROM posts WHERE id = $1",
            [params.id]
          );
          if (!rows[0]) {
            set.status = 404;
            return { error: "Post not found" };
          }
          if (rows[0].seller_id !== user.id && user.role !== "admin") {
            set.status = 403;
            return { error: "You can only edit your own posts" };
          }
          await all(
            `UPDATE posts SET title = $1, excerpt = $2, content = $3,
                    cover_image = $4, status = $5, updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
             WHERE id = $6`,
            [
              body.title.trim(),
              (body.excerpt ?? "").trim(),
              body.content,
              body.coverImage ?? null,
              body.status ?? "published",
              params.id,
            ]
          );
          const updated = await all(`${POST_SELECT} WHERE p.id = $1`, [params.id]);
          return toPost(updated[0]);
        },
        {
          params: t.Object({ id: t.Numeric() }),
          body: t.Object({
            title: t.String({ minLength: 1, maxLength: 200 }),
            excerpt: t.Optional(t.String({ maxLength: 400 })),
            content: t.String({ minLength: 1 }),
            coverImage: t.Optional(t.String({ maxLength: 500 })),
            status: t.Optional(t.Union([t.Literal("draft"), t.Literal("published")])),
          }),
        }
      )
      .delete(
        "/api/posts/:id",
        async ({ params, set, user }: any) => {
          const rows = await all<{ seller_id: number }>(
            "SELECT seller_id FROM posts WHERE id = $1",
            [params.id]
          );
          if (!rows[0]) {
            set.status = 404;
            return { error: "Post not found" };
          }
          if (rows[0].seller_id !== user.id && user.role !== "admin") {
            set.status = 403;
            return { error: "You can only delete your own posts" };
          }
          await all("DELETE FROM posts WHERE id = $1", [params.id]);
          return { success: true, id: params.id };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
  );
