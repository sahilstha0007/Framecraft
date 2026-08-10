import { Elysia, t } from "elysia";
import { all } from "../db";
import { EMAIL_PATTERN } from "./helpers";

export const contactRoutes = new Elysia({ prefix: "/api" })
  .get("/contacts", async () => {
    const rows = await all("SELECT * FROM contacts ORDER BY created_at DESC");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      subject: r.subject,
      message: r.message,
      createdAt: r.created_at,
    }));
  })
  .post(
    "/contact",
    async ({ body, set }) => {
      const inserted = await all<{ id: number }>(
        `INSERT INTO contacts (name, email, phone, subject, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [body.name, body.email.toLowerCase(), body.phone ?? null, body.subject ?? null, body.message]
      );
      set.status = 201;
      return {
        success: true,
        message: "Message received — we'll get back to you soon.",
        id: Number(inserted[0].id),
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ pattern: EMAIL_PATTERN }),
        phone: t.Optional(t.String()),
        subject: t.Optional(t.String()),
        message: t.String({ minLength: 1 }),
      }),
    }
  );
