import { Elysia, t } from "elysia";
import { all } from "../db";
import { EMAIL_PATTERN, REQUEST_STATUSES } from "./helpers";
import { getUserBySession, requireAuth, requireAdmin } from "./auth";

function toBooking(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    service: r.service,
    date: r.date,
    time: r.time,
    message: r.message,
    status: r.status,
    notes: r.notes ?? null,
    userId: r.user_id ?? null,
    createdAt: r.created_at,
  };
}

export const bookingsRoutes = new Elysia({ prefix: "/api/bookings" })
  /* Seller: every booking, newest first. */
  .guard({ beforeHandle: requireAdmin }, (app) =>
    app.get("/", async () => {
      const rows = await all("SELECT * FROM bookings ORDER BY created_at DESC");
      return rows.map(toBooking);
    })
  )
  /* Public: create a booking. When the visitor is signed in, the request is
     linked to their account (and to any older bookings under the same email). */
  .post(
    "/",
    async ({ body, set, request }) => {
      const sessionUser = await getUserBySession(request);
      const rows = await all(
        `INSERT INTO bookings (name, email, phone, service, date, time, message, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          body.name,
          body.email.toLowerCase(),
          body.phone ?? null,
          body.service,
          body.date,
          body.time ?? null,
          body.message ?? null,
          sessionUser?.id ?? null,
        ]
      );
      set.status = 201;
      return toBooking(rows[0]);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ pattern: EMAIL_PATTERN }),
        phone: t.Optional(t.String()),
        service: t.String({ minLength: 1 }),
        date: t.String({ minLength: 8 }),
        time: t.Optional(t.String()),
        message: t.Optional(t.String()),
      }),
    }
  )
  /* Seller: move a booking through its status and add internal notes. */
  .guard({ beforeHandle: requireAdmin }, (app) =>
    app.patch(
      "/:id",
      async ({ params, body, set }) => {
        const existing = await all("SELECT id FROM bookings WHERE id = $1", [params.id]);
        if (!existing[0]) {
          set.status = 404;
          return { error: "Booking not found" };
        }
        const updates: string[] = [];
        const values: (string | number)[] = [];
        if (body.status) {
          values.push(body.status);
          updates.push(`status = $${values.length}`);
        }
        if (body.notes !== undefined) {
          values.push(body.notes);
          updates.push(`notes = $${values.length}`);
        }
        if (updates.length === 0) return { success: true, id: params.id };
        values.push(params.id);
        await all(`UPDATE bookings SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
        return { success: true, id: params.id };
      },
      {
        params: t.Object({ id: t.Numeric() }),
        body: t.Object({
          status: t.Optional(t.Union([...REQUEST_STATUSES].map((s) => t.Literal(s)))),
          notes: t.Optional(t.String({ maxLength: 2000 })),
        }),
      }
    )
  );

/** Customer view: only their own bookings (account link, or email match for
    requests placed before they signed up). */
export const myRequestsRoutes = new Elysia().guard({ beforeHandle: requireAuth }, (app) =>
  app.get("/api/my/bookings", async ({ user }: any) => {
    const rows = await all(
      `SELECT * FROM bookings
       WHERE user_id = $1 OR (email = $2 AND user_id IS NULL)
       ORDER BY created_at DESC`,
      [user.id, user.email.toLowerCase()]
    );
    return rows.map(toBooking);
  })
);
