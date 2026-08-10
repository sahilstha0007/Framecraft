import { Elysia, t } from "elysia";
import { all } from "../db";
import { getUserBySession, requireAuth } from "./auth";
import { notify } from "./notifications";

/**
 * The social layer of the marketplace: users follow sellers, like products,
 * and comment on both products and blog posts.
 */

const COMMENT_TARGETS = t.Union([t.Literal("product"), t.Literal("post")]);

function toComment(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    targetType: r.target_type,
    targetId: r.target_id,
    content: r.content,
    userId: r.user_id,
    author: {
      name: r.author_name,
      avatar: r.author_avatar,
    },
    createdAt: r.created_at,
  };
}

export const socialRoutes = new Elysia()
  /* Public: product engagement state (counts + my state when signed in). */
  .get("/api/products/:id/engagement", async ({ params, request }) => {
    const likes = await all<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM product_likes WHERE product_id = $1",
      [params.id]
    );
    const comments = await all<{ count: number }>(
      "SELECT COUNT(*)::int AS count FROM comments WHERE target_type = 'product' AND target_id = $1",
      [params.id]
    );
    const me = await getUserBySession(request);
    let likedByMe = false;
    if (me) {
      const mine = await all(
        "SELECT 1 FROM product_likes WHERE user_id = $1 AND product_id = $2",
        [me.id, params.id]
      );
      likedByMe = Boolean(mine[0]);
    }
    return {
      productId: params.id,
      likeCount: Number(likes[0]?.count ?? 0),
      commentCount: Number(comments[0]?.count ?? 0),
      likedByMe,
    };
  })
  /* Public: comments for a product or post. */
  .get("/api/comments", async ({ query }) => {
    const rows = await all(
      `SELECT c.*, u.name AS author_name, u.avatar AS author_avatar
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.target_type = $1 AND c.target_id = $2
       ORDER BY c.created_at ASC`,
      [query.targetType, Number(query.targetId)]
    );
    return rows.map(toComment);
  })
  /* Signed-in social actions. */
  .guard({ beforeHandle: requireAuth }, (app) =>
    app
      /* follows */
      .post(
        "/api/sellers/:id/follow",
        async ({ params, set, user }: any) => {
          if (Number(params.id) === user.id) {
            set.status = 400;
            return { error: "You cannot follow yourself" };
          }
          const target = await all<{ id: number; role: string }>(
            "SELECT id, role FROM users WHERE id = $1",
            [params.id]
          );
          if (!target[0] || target[0].role === "customer") {
            set.status = 404;
            return { error: "Seller not found" };
          }
          await all(
            "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [user.id, params.id]
          );
          await notify(
            Number(params.id),
            "new_follower",
            `${user.name} started following you`,
            "They'll see your new pieces as soon as you list them.",
            `/sellers/${user.id}`
          );
          return { success: true, following: true };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
      .delete(
        "/api/sellers/:id/follow",
        async ({ params, user }: any) => {
          await all("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [
            user.id,
            params.id,
          ]);
          return { success: true, following: false };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
      .get("/api/me/following", async ({ user }: any) => {
        const rows = await all(
          `SELECT u.id, u.name, u.avatar, u.shop_name, u.bio
           FROM follows f JOIN users u ON u.id = f.following_id
           WHERE f.follower_id = $1 ORDER BY f.created_at DESC`,
          [user.id]
        );
        return rows;
      })
      /* likes */
      .post(
        "/api/products/:id/like",
        async ({ params, user }: any) => {
          await all(
            "INSERT INTO product_likes (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [user.id, params.id]
          );
          return { success: true, liked: true };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
      .delete(
        "/api/products/:id/like",
        async ({ params, user }: any) => {
          await all("DELETE FROM product_likes WHERE user_id = $1 AND product_id = $2", [
            user.id,
            params.id,
          ]);
          return { success: true, liked: false };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
      .get("/api/me/likes", async ({ user }: any) => {
        const rows = await all(
          `SELECT p.id, p.name, p.image, p.price, p.auction, p.current_bid, p.status,
                  p.ends_at, l.created_at AS liked_at
           FROM product_likes l JOIN products p ON p.id = l.product_id
           WHERE l.user_id = $1 ORDER BY l.created_at DESC`,
          [user.id]
        );
        return rows.map((r) => {
          const rec = r as Record<string, unknown>;
          return {
            id: rec.id,
            name: rec.name,
            image: rec.image,
            price: Number(rec.price),
            auction: Boolean(rec.auction),
            currentBid: rec.current_bid == null ? null : Number(rec.current_bid),
            status: rec.status,
            endsAt: rec.ends_at,
            likedAt: rec.liked_at,
          };
        });
      })
      /* comments */
      .post(
        "/api/comments",
        async ({ body, set, user }: any) => {
          // Target must exist; the owner is the one we notify.
          let ownerId: number | null = null;
          let postSlug: string | null = null;
          if (body.targetType === "product") {
            const p = await all<{ id: number; seller_id: number | null }>(
              "SELECT id, seller_id FROM products WHERE id = $1",
              [body.targetId]
            );
            if (!p[0]) {
              set.status = 404;
              return { error: "Product not found" };
            }
            ownerId = p[0].seller_id;
          } else {
            const p = await all<{ id: number; seller_id: number; slug: string }>(
              "SELECT id, seller_id, slug FROM posts WHERE id = $1",
              [body.targetId]
            );
            if (!p[0]) {
              set.status = 404;
              return { error: "Post not found" };
            }
            ownerId = p[0].seller_id;
            postSlug = p[0].slug;
          }
          const inserted = await all<{ id: number }>(
            `INSERT INTO comments (target_type, target_id, user_id, content)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [body.targetType, body.targetId, user.id, body.content.trim()]
          );
          if (ownerId && ownerId !== user.id) {
            await notify(
              ownerId,
              "new_comment",
              `${user.name} commented on your ${body.targetType}`,
              body.content.trim().slice(0, 140),
              body.targetType === "product"
                ? `/products/${body.targetId}`
                : `/blog/${postSlug ?? body.targetId}`
            );
          }
          set.status = 201;
          const rows = await all(
            `SELECT c.*, u.name AS author_name, u.avatar AS author_avatar
             FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
            [inserted[0].id]
          );
          return toComment(rows[0]);
        },
        {
          body: t.Object({
            targetType: COMMENT_TARGETS,
            targetId: t.Numeric(),
            content: t.String({ minLength: 1, maxLength: 2000 }),
          }),
        }
      )
      .delete(
        "/api/comments/:id",
        async ({ params, set, user }: any) => {
          const rows = await all<{ user_id: number }>("SELECT user_id FROM comments WHERE id = $1", [
            params.id,
          ]);
          if (!rows[0]) {
            set.status = 404;
            return { error: "Comment not found" };
          }
          if (rows[0].user_id !== user.id && user.role !== "admin") {
            set.status = 403;
            return { error: "You can only delete your own comments" };
          }
          await all("DELETE FROM comments WHERE id = $1", [params.id]);
          return { success: true, id: params.id };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
  );
