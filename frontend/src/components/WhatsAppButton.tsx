"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// Nepali mobile number in international format (no leading +), for wa.me.
// Live value comes from NEXT_PUBLIC_WHATSAPP_NUMBER (.env.local) so it can be
// swapped without a code change; falls back to the studio's confirmed number.
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "9779843082974";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Floating WhatsApp button — the #1 way Nepali customers reach a business.
 * Appears bottom-right, above the footer's scroll-to-top control.
 */
export default function WhatsAppButton() {
  const t = useTranslations("whatsapp");
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("message")
  )}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      initial={{ opacity: 0, scale: 0.6, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.4, type: "spring", stiffness: 240, damping: 20 }}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 h-13 pl-3.5 pr-5 rounded-full bg-[#25D366] text-[#0a0a08] shadow-[0_8px_30px_rgba(37,211,102,0.35)] hover:shadow-[0_8px_36px_rgba(37,211,102,0.5)] hover:scale-[1.04] active:scale-[0.96] transition-[transform,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-[#0a0a08]"
    >
      <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/25">
        <WhatsAppIcon className="w-5 h-5" />
        <span className="absolute inset-0 rounded-full bg-white/30 animate-ping [animation-duration:2.8s] pointer-events-none" />
      </span>
      <span className="text-sm font-semibold tracking-wide hidden sm:block">
        WhatsApp
      </span>
    </motion.a>
  );
}
