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

/** Normalize a local phone number to E.164 (required by the Cloud API). */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("977")) return digits;
  if (digits.startsWith("0")) return `977${digits.slice(1)}`;
  return `977${digits}`;
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
        to: toE164(to),
        type: "text",
        text: { body },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
