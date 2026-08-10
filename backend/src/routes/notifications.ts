import { Elysia, t } from "elysia";
import { all } from "../db";
import { requireAuth } from "./auth";

/**
 * In-app notification center. `notify()` is imported by the marketplace routes
 * (bids, orders, social, reviews, products) to fan out event notifications.
 */

export async function notify(
  userId: number,
  type: string,
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  if (!userId) return;
  try {
    await all(
      "INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5)",
      [userId, type, title, body ?? null, link ?? null]
    );
  } catch {
    /* never break the triggering request over a notification */
  }
}

function toNotification(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body ?? null,
    link: r.link ?? null,
    read: Boolean(r.read),
    createdAt: r.created_at,
  };
}

export const notificationsRoutes = new Elysia()
  .guard({ beforeHandle: requireAuth }, (app) =>
    app
      /* Signed-in: the user's notifications (newest first) + unread count. */
      .get("/api/me/notifications", async ({ user }: any) => {
        const rows = await all(
          "SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 50",
          [user.id]
        );
        const unread = await all<{ count: number }>(
          "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = 0",
          [user.id]
        );
        return {
          notifications: rows.map(toNotification),
          unreadCount: Number(unread[0]?.count ?? 0),
        };
      })
      .patch(
        "/api/me/notifications/:id",
        async ({ params, user }: any) => {
          await all(
            "UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2",
            [params.id, user.id]
          );
          return { success: true, id: params.id };
        },
        { params: t.Object({ id: t.Numeric() }) }
      )
      .put("/api/me/notifications/read-all", async ({ user }: any) => {
        await all("UPDATE notifications SET read = 1 WHERE user_id = $1 AND read = 0", [
          user.id,
        ]);
        return { success: true };
      })
  );
