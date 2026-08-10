import { Elysia, t } from "elysia";
import { all } from "../db";
import { config } from "../config";
import { requireAuth } from "./auth";

/**
 * Nepali payment gateways — sandbox-first.
 *
 * Khalti (REST):  POST /epayment/initiate/ → { pidx, payment_url } → we send
 *                 the buyer there; on return, POST /epayment/lookup/ verifies.
 * eSewa (HMAC):   we build an auto-submitting form with an HMAC-SHA256
 *                 signature; on return, `data` is decoded and re-signed to
 *                 prove integrity before the order is marked paid.
 *
 * Both callbacks are server-verified — the browser redirect is never trusted.
 */

const ORDER_STATUSES_OK = ["pending"];

/* ── Khalti ─────────────────────────────────────────────────────────────── */

async function khaltiInitiate(order: Record<string, unknown>, amountNpr: number) {
  const res = await fetch(`${config.khaltiApi}/epayment/initiate/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${config.khaltiSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: `${config.publicBaseUrl}/api/payments/verify/khalti`,
      website_url: config.publicBaseUrl,
      amount: Math.round(amountNpr * 100), // paisa
      purchase_order_id: `ORDER_${order.id}`,
      purchase_order_name: `FrameCraft order #${order.id}`,
      customer_info: {
        name: order.customer_name,
        email: order.email,
        phone: order.phone ?? "",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      config.khaltiSecret
        ? `Khalti initiate failed (${res.status}): ${body.slice(0, 200)}`
        : "Khalti is not configured — set KHALTI_SECRET_KEY in the backend .env"
    );
  }
  const data = (await res.json()) as { pidx: string; payment_url: string };
  return data;
}

async function khaltiLookup(pidx: string) {
  const res = await fetch(`${config.khaltiApi}/epayment/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${config.khaltiSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    pidx: string;
    total_amount: number;
    status: string;
    transaction_id?: string;
  };
}

/* ── eSewa ──────────────────────────────────────────────────────────────── */

/** HMAC-SHA256 → base64, per eSewa's signature rule. */
async function esewaSign(message: string): Promise<string> {
  const key = new TextEncoder().encode(config.esewaSecret);
  const data = new TextEncoder().encode(message);
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", k, data);
  return Buffer.from(sig).toString("base64");
}

/** Re-sign the fields named in signed_field_names to verify a callback. */
async function esewaVerifySignature(payload: Record<string, string>): Promise<boolean> {
  const names = (payload.signed_field_names ?? "").split(",");
  if (names.length === 0) return false;
  const message = names.map((n) => `${n}=${payload[n] ?? ""}`).join(",");
  const expected = await esewaSign(message);
  // Timing-safe compare.
  const a = Buffer.from(expected);
  const b = Buffer.from(payload.signature ?? "");
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function esewaFormFields(orderId: number, amountNpr: number, uuid: string) {
  return {
    amount: String(amountNpr),
    tax_amount: "0",
    product_service_charge: "0",
    product_delivery_charge: "0",
    total_amount: String(amountNpr),
    transaction_uuid: uuid,
    product_code: config.esewaProductCode,
    success_url: `${config.publicBaseUrl}/api/payments/verify/esewa`,
    failure_url: `${config.publicBaseUrl}/api/payments/verify/esewa`,
    signed_field_names: "total_amount,transaction_uuid,product_code",
  };
}

/* ── routes ─────────────────────────────────────────────────────────────── */

export const paymentsRoutes = new Elysia()
  /* Signed in: prepare a gateway checkout for a pending order of theirs. */
  .guard({ beforeHandle: requireAuth }, (app) =>
    app.post(
      "/api/payments/checkout",
      async ({ body, set, user }: any) => {
        const rows = await all<{
          id: number;
          user_id: number | null;
          total: number;
          payment_method: string;
          payment_status: string;
          payment_ref: string | null;
        }>("SELECT * FROM orders WHERE id = $1", [body.orderId]);
        const order = rows[0];
        if (!order) {
          set.status = 404;
          return { error: "Order not found" };
        }
        if (order.user_id !== user.id) {
          set.status = 403;
          return { error: "This order is not yours" };
        }
        if (!ORDER_STATUSES_OK.includes(order.payment_status)) {
          set.status = 400;
          return { error: "This order is not awaiting payment" };
        }

        const gateway = order.payment_method;

        if (gateway === "Khalti") {
          try {
            const intent = await khaltiInitiate(order, order.total);
            await all("UPDATE orders SET payment_ref = $1, gateway = 'khalti' WHERE id = $2", [
              intent.pidx,
              order.id,
            ]);
            return { gateway: "khalti", redirectUrl: intent.payment_url };
          } catch (err) {
            set.status = 502;
            return { error: (err as Error).message };
          }
        }

        if (gateway === "eSewa") {
          const uuid = crypto.randomUUID();
          const fields: Record<string, string> = esewaFormFields(order.id, order.total, uuid);
          fields.signature = await esewaSign(
            `total_amount=${fields.total_amount},transaction_uuid=${uuid},product_code=${config.esewaProductCode}`
          );
          await all("UPDATE orders SET payment_ref = $1, gateway = 'esewa' WHERE id = $2", [
            uuid,
            order.id,
          ]);
          return {
            gateway: "esewa",
            formUrl: `${config.esewaApi}/api/epay/main/v2/form`,
            fields,
          };
        }

        set.status = 400;
        return { error: "This order does not use an online gateway — settle at the studio" };
      },
      {
        body: t.Object({ orderId: t.Numeric() }),
      }
    )
  )
  /* Khalti return: lookup + verify server-side, then bounce back to the shop. */
  .get("/api/payments/verify/khalti", async ({ query }) => {
    const pidx = String(query.pidx ?? "");
    const redirect = (status: string, orderId?: number) =>
      new Response(null, {
        status: 302,
        headers: {
          Location: `${config.frontendOrigin}/checkout?status=${status}${orderId ? `&order=${orderId}` : ""}`,
        },
      });
    if (!pidx) return redirect("failed");
    const result = await khaltiLookup(pidx).catch(() => null);
    if (!result || result.status !== "Completed") return redirect("failed");
    const rows = await all<{ id: number }>("SELECT id FROM orders WHERE payment_ref = $1", [pidx]);
    if (!rows[0]) return redirect("failed");
    await all("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [rows[0].id]);
    return redirect("paid", rows[0].id);
  })
  /* eSewa return: decode + verify the HMAC signature, then mark paid. */
  .get("/api/payments/verify/esewa", async ({ query }) => {
    const redirect = (status: string, orderId?: number) =>
      new Response(null, {
        status: 302,
        headers: {
          Location: `${config.frontendOrigin}/checkout?status=${status}${orderId ? `&order=${orderId}` : ""}`,
        },
      });
    const data = String(query.data ?? "");
    if (!data) return redirect("failed");
    let payload: Record<string, string>;
    try {
      payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    } catch {
      return redirect("failed");
    }
    if (payload.status !== "COMPLETE") return redirect("failed");
    if (!(await esewaVerifySignature(payload))) return redirect("failed");
    const rows = await all<{ id: number; total: number }>(
      "SELECT id, total FROM orders WHERE payment_ref = $1",
      [payload.transaction_uuid]
    );
    if (!rows[0]) return redirect("failed");
    // Reconcile the amount — never trust the callback's total.
    if (Number(payload.total_amount) !== rows[0].total) return redirect("failed");
    await all("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [rows[0].id]);
    return redirect("paid", rows[0].id);
  });
