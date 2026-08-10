import { Elysia, t } from "elysia";
import { db } from "../db";
import { EMAIL_PATTERN } from "./helpers";

export const newsletterRoutes = new Elysia({ prefix: "/api/newsletter" })
  .post(
    "/subscribe",
    async ({ body, set }) => {
      const inserted = (await db.unsafe(
        "INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id",
        [body.email.toLowerCase()]
      )) as { id: number }[];
      if (!inserted[0]) {
        set.status = 409;
        return { success: false, error: "This email is already subscribed" };
      }
      set.status = 201;
      return { success: true, message: "Subscribed successfully!", id: Number(inserted[0].id) };
    },
    {
      body: t.Object({
        email: t.String({ pattern: EMAIL_PATTERN }),
      }),
    }
  );
