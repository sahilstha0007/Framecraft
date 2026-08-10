import { Elysia, t } from "elysia";
import { all } from "../db";
import { getUserBySession, requireAuth } from "./auth";

function toSeller(r: Record<string, unknown>, me?: { id: number } | null) {
  return {
    id: r.id,
    name: r.name,
    avatar: r.avatar ?? null,
    shopName: r.shop_name ?? null,
    bio: r.bio ?? null,
    location: r.location ?? null,
    website: r.website ?? null,
    productCount: Number(r.product_count ?? 0),
    followerCount: Number(r.follower_count ?? 0),
    followedByMe: me ? Boolean(r.followed_by_me) : false,
    createdAt: r.created_at,
  };
}

const SELLER_LIST_SQL = `
  SELECT u.id, u.name, u.avatar, u.shop_name, u.bio, u.location, u.website, u.created_at,
         (SELECT COUNT(*) FROM products p WHERE p.seller_id = u.id AND p.status != 'cancelled') AS product_count,
         (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS follower_count
  FROM users u`;

export const sellersRoutes = new Elysia()
  /* Public: marketplace directory of sellers (with active products). */
  .get("/api/sellers", async ({ request }) => {
    const me = await getUserBySession(request);
    const rows = await all(SELLER_LIST_SQL);
    const filtered = rows.filter(
      (r) => Number((r as Record<string, unknown>).product_count) > 0 || me?.id === (r as Record<string, unknown>).id
    );
    return filtered.map((r) => toSeller(r as Record<string, unknown>, me));
  })
  .get(
    "/api/sellers/:id",
    async ({ params, set, request }) => {
      const me = await getUserBySession(request);
      const rows = await all(
        `${SELLER_LIST_SQL},
         (SELECT COUNT(*) FROM posts p2 WHERE p2.seller_id = u.id AND p2.status = 'published') AS post_count
         FROM users u WHERE u.id = $1`,
        [params.id]
      );
      if (!rows[0]) {
        set.status = 404;
        return { error: "Seller not found" };
      }
      const r = rows[0] as Record<string, unknown>;
      const following = me
        ? await all("SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2", [
            me.id,
            params.id,
          ])
        : [];
      return {
        ...toSeller(r, me),
        followedByMe: Boolean(following[0]),
        postCount: Number(r.post_count ?? 0),
      };
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  /* Signed in: update own profile. */
  .guard({ beforeHandle: requireAuth }, (app) =>
    app
      .put(
        "/api/me/profile",
        async ({ body, set, user }: any) => {
          await all(
            `UPDATE users SET name = $1, bio = $2, avatar = $3,
                    shop_name = $4, location = $5, website = $6
             WHERE id = $7`,
            [
              body.name.trim(),
              (body.bio ?? "").trim(),
              body.avatar ?? null,
              (body.shopName ?? "").trim(),
              (body.location ?? "").trim(),
              body.website ?? null,
              user.id,
            ]
          );
          const users = await all("SELECT * FROM users WHERE id = $1", [user.id]);
          return { user: users[0] };
        },
        {
          body: t.Object({
            name: t.String({ minLength: 1, maxLength: 80 }),
            bio: t.Optional(t.String({ maxLength: 1000 })),
            avatar: t.Optional(t.String({ maxLength: 500 })),
            shopName: t.Optional(t.String({ maxLength: 80 })),
            location: t.Optional(t.String({ maxLength: 120 })),
            website: t.Optional(t.String({ maxLength: 200 })),
          }),
        }
      )
      .put(
        "/api/me/password",
        async ({ body, set, user }: any) => {
          const users = await all<{ password_hash: string }>(
            "SELECT password_hash FROM users WHERE id = $1",
            [user.id]
          );
          if (!(await Bun.password.verify(body.currentPassword, users[0].password_hash))) {
            set.status = 400;
            return { error: "Current password is incorrect" };
          }
          const hash = await Bun.password.hash(body.newPassword);
          await all("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user.id]);
          return { success: true };
        },
        {
          body: t.Object({
            currentPassword: t.String({ minLength: 1 }),
            newPassword: t.String({ minLength: 6, maxLength: 128 }),
          }),
        }
      )
  );
