import { Elysia, t } from "elysia";
import { all } from "../db";
import { requireAdmin } from "./auth";

/** Public read — used by the footer, contact page and WhatsApp button. */
export const settingsRoutes = new Elysia().get("/api/settings", async () => {
  const rows = await all<{ key: string; value: string }>("SELECT key, value FROM shop_settings");
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return settings;
});

/** Seller-only write — upsert any number of known keys in one call. */
export const settingsWriteRoutes = new Elysia()
  .onBeforeHandle(requireAdmin)
  .put(
    "/api/settings",
    async ({ body }) => {
      for (const [key, value] of Object.entries(body.values)) {
        await all(
          `INSERT INTO shop_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, String(value)]
        );
      }
      return { success: true };
    },
    {
      body: t.Object({
        values: t.Record(t.String(), t.String(), { maxProperties: 30 }),
      }),
    }
  );
