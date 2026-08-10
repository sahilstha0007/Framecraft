/**
 * WhatsApp Cloud API — best-effort outbound messages (order status, alerts).
 * Completely optional: when the env vars are unset the helpers return false
 * and callers fall back to in-app notifications only.
 */

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const API = "https://graph.facebook.com/v21.0";

export function whatsappConfigured(): boolean {
  return Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID);
}

export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID || !to) return false;
  try {
    const res = await fetch(`${API}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
