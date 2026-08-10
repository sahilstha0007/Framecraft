import { Elysia, t } from "elysia";
import { all } from "../db";
import { requireAdmin } from "./auth";

/**
 * Admin-only user management. The admin (studio owner) runs the whole
 * marketplace: every account is listed here, roles can be promoted/demoted
 * (customer → seller → admin), and a user's access can be removed entirely.
 * Self-mutations are refused so the admin can never lock themselves out.
 */

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  booking_count: number;
  quote_count: number;
}

function toUser(r: UserRow) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
    bookings: Number(r.booking_count),
    quotes: Number(r.quote_count),
  };
}

const ROLE_LITERALS = [
  t.Literal("customer"),
  t.Literal("seller"),
  t.Literal("admin"),
];

export const usersRoutes = new Elysia()
  .onBeforeHandle(requireAdmin)
  .get("/api/users", async () => {
    const rows = await all<UserRow>(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id)      AS booking_count,
              (SELECT COUNT(*) FROM custom_quotes q WHERE q.user_id = u.id) AS quote_count
       FROM users u
       ORDER BY u.created_at DESC`
    );
    return rows.map(toUser);
  })
  .patch(
    "/api/users/:id",
    async ({ params, body, set, user }: any) => {
      if (Number(params.id) === user.id) {
        set.status = 403;
        return { error: "You cannot change your own role" };
      }
      if (!body.role) return { success: true, id: params.id };
      const existing = await all("SELECT id FROM users WHERE id = $1", [params.id]);
      if (!existing[0]) {
        set.status = 404;
        return { error: "User not found" };
      }
      await all("UPDATE users SET role = $1 WHERE id = $2", [body.role, params.id]);
      return { success: true, id: params.id };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        role: t.Optional(t.Union(ROLE_LITERALS)),
      }),
    }
  )
  .delete(
    "/api/users/:id",
    async ({ params, set, user }: any) => {
      if (Number(params.id) === user.id) {
        set.status = 403;
        return { error: "You cannot delete your own account" };
      }
      const existing = await all("SELECT id FROM users WHERE id = $1", [params.id]);
      if (!existing[0]) {
        set.status = 404;
        return { error: "User not found" };
      }
      // Detach their requests rather than deleting the history.
      await all("UPDATE bookings SET user_id = NULL WHERE user_id = $1", [params.id]);
      await all("UPDATE custom_quotes SET user_id = NULL WHERE user_id = $1", [params.id]);
      // Products they listed become studio stock rather than disappearing;
      // their posts, bids, likes, follows and comments cascade away.
      await all("UPDATE products SET seller_id = NULL WHERE seller_id = $1", [params.id]);
      await all("UPDATE products SET winner_id = NULL WHERE winner_id = $1", [params.id]);
      // Sessions cascade via ON DELETE CASCADE.
      await all("DELETE FROM users WHERE id = $1", [params.id]);
      return { success: true, id: params.id };
    },
    { params: t.Object({ id: t.Numeric() }) }
  );
