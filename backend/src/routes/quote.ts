import { Elysia, t } from "elysia";
import { all } from "../db";
import { EMAIL_PATTERN, REQUEST_STATUSES, parseBasePrice, round2 } from "./helpers";
import { getUserBySession, requireAuth, requireAdmin } from "./auth";

/**
 * Pricing model:
 *   base price   = starting price of the selected frame (from its price range)
 *   size factor  = clamp((width × height) / 320, 1, 3)  — 320 = 16"×20" reference area
 *   total        = (base + mat + glass) × sizeFactor × quantity
 */
const BASE_AREA = 320;

type FrameRow = { id: number; name: string; category: string; price_range: string };
type MatRow = { id: string; name: string; price: number };
type GlassRow = { id: string; name: string; price: number };

function toQuote(row: unknown) {
  const r = row as Record<string, unknown>;
  return {
    id: r.id,
    frameId: r.frame_id,
    frameName: r.frame_name,
    width: r.width,
    height: r.height,
    matId: r.mat_id,
    matName: r.mat_name,
    glassId: r.glass_id,
    glassName: r.glass_name,
    quantity: r.quantity,
    basePrice: r.base_price,
    matPrice: r.mat_price,
    glassPrice: r.glass_price,
    sizeFactor: r.size_factor,
    total: r.total,
    name: r.name,
    email: r.email,
    userId: r.user_id ?? null,
    status: r.status ?? "pending",
    createdAt: r.created_at,
  };
}

export const quoteRoutes = new Elysia({ prefix: "/api" })
  .post(
    "/quote",
    async ({ body, set, request }) => {
      const frameRows = await all<FrameRow>("SELECT * FROM frames WHERE id = $1", [body.frameId]);
      const frame = frameRows[0];
      if (!frame) {
        set.status = 404;
        return { error: "Frame not found" };
      }

      const mat = body.matId
        ? (await all<MatRow>("SELECT * FROM mat_options WHERE id = $1", [body.matId]))[0]
        : undefined;
      if (body.matId && !mat) {
        set.status = 400;
        return { error: "Invalid mat option" };
      }

      const glass = body.glassId
        ? (await all<GlassRow>("SELECT * FROM glass_types WHERE id = $1", [body.glassId]))[0]
        : undefined;
      if (body.glassId && !glass) {
        set.status = 400;
        return { error: "Invalid glass type" };
      }

      const quantity = body.quantity ?? 1;
      const basePrice = parseBasePrice(frame.price_range);
      const matPrice = mat ? mat.price : 0;
      const glassPrice = glass ? glass.price : 0;
      // Round the size factor once so the stored and returned values always match.
      const sizeFactor = round2(Math.min(3, Math.max(1, (body.width * body.height) / BASE_AREA)));
      const total = round2((basePrice + matPrice + glassPrice) * sizeFactor * quantity);

      const quote: Record<string, unknown> = {
        frameId: frame.id,
        frameName: frame.name,
        frameCategory: frame.category,
        width: body.width,
        height: body.height,
        mat: mat ? { id: mat.id, name: mat.name, price: mat.price } : null,
        glass: glass ? { id: glass.id, name: glass.name, price: glass.price } : null,
        quantity,
        basePrice,
        matPrice,
        glassPrice,
        sizeFactor: round2(sizeFactor),
        total,
        currency: "NPR",
      };

      // Persist the quote when the visitor shares contact details (linking the
      // signed-in account, if any, so it appears under "My Requests").
      if (body.name || body.email) {
        const sessionUser = await getUserBySession(request);
        const inserted = await all<{ id: number }>(
          `INSERT INTO custom_quotes
             (frame_id, frame_name, width, height, mat_id, mat_name, glass_id, glass_name,
              quantity, base_price, mat_price, glass_price, size_factor, total, name, email, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           RETURNING id`,
          [
            frame.id,
            frame.name,
            body.width,
            body.height,
            mat?.id ?? null,
            mat?.name ?? null,
            glass?.id ?? null,
            glass?.name ?? null,
            quantity,
            basePrice,
            matPrice,
            glassPrice,
            sizeFactor,
            total,
            body.name ?? null,
            body.email?.toLowerCase() ?? null,
            sessionUser?.id ?? null,
          ]
        );
        quote.id = Number(inserted[0].id);
        set.status = 201;
      } else {
        set.status = 200;
      }
      return quote;
    },
    {
      body: t.Object({
        frameId: t.Numeric(),
        width: t.Number({ minimum: 1, maximum: 120 }),
        height: t.Number({ minimum: 1, maximum: 120 }),
        matId: t.Optional(t.String()),
        glassId: t.Optional(t.String()),
        quantity: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 1 })),
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String({ pattern: EMAIL_PATTERN })),
      }),
    }
  )
  .get(
    "/quotes/:id",
    async ({ params, set }) => {
      const rows = await all("SELECT * FROM custom_quotes WHERE id = $1", [params.id]);
      const row = rows[0];
      if (!row) {
        set.status = 404;
        return { error: "Quote not found" };
      }
      return toQuote(row);
    },
    { params: t.Object({ id: t.Numeric() }) }
  )
  /* Customer: only their own quotes (account link, or email match). */
  .guard({ beforeHandle: requireAuth }, (app) =>
    app.get("/my/quotes", async ({ user }: any) => {
      const rows = await all(
        `SELECT * FROM custom_quotes
         WHERE user_id = $1 OR (LOWER(email) = $2 AND user_id IS NULL)
         ORDER BY created_at DESC`,
        [user.id, user.email.toLowerCase()]
      );
      return rows.map(toQuote);
    })
  )
  /* Seller: all quotes + status updates. */
  .guard({ beforeHandle: requireAdmin }, (app) =>
    app
      .get("/quotes", async () => {
        const rows = await all("SELECT * FROM custom_quotes ORDER BY created_at DESC");
        return rows.map(toQuote);
      })
      .patch(
        "/quotes/:id",
        async ({ params, body, set }) => {
          const existing = await all("SELECT id FROM custom_quotes WHERE id = $1", [params.id]);
          if (!existing[0]) {
            set.status = 404;
            return { error: "Quote not found" };
          }
          if (body.status) {
            await all("UPDATE custom_quotes SET status = $1 WHERE id = $2", [body.status, params.id]);
          }
          return { success: true, id: params.id };
        },
        {
          params: t.Object({ id: t.Numeric() }),
          body: t.Object({
            status: t.Optional(t.Union([...REQUEST_STATUSES].map((s) => t.Literal(s)))),
          }),
        }
      )
  );
