"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { formatNPR } from "@/lib/nepali";
import NextImage from "next/image";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { items, count, subtotal, setQuantity, remove, open, setOpen } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.button
            aria-label={t("close")}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.aside
            role="dialog"
            aria-label={t("title")}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-cream-50 dark:bg-[#0c0a08] border-l border-charcoal-200/60 dark:border-white/[0.08] flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-charcoal-200/60 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={17} className="text-gold-500 dark:text-gold-400" />
                <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">
                  {t("title")}
                </h2>
                {count > 0 && (
                  <span className="px-2 py-0.5 bg-gold-500/15 border border-gold-500/30 text-gold-600 dark:text-gold-300 text-[0.65rem] font-medium rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-charcoal-500 hover:text-charcoal-900 dark:text-white/40 dark:hover:text-white transition-colors"
                aria-label={t("close")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-charcoal-500 dark:text-white/35">{t("empty")}</p>
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-gold-600 dark:text-gold-400 hover:underline"
                  >
                    {t("continueShopping")}
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex gap-4 border border-charcoal-200/60 dark:border-white/[0.07] p-3">
                    <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden bg-charcoal-900/[0.03] dark:bg-white/[0.03]">
                      <NextImage
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-800 dark:text-white/85 leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-charcoal-500 dark:text-white/40">
                        {formatNPR(item.price, locale)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center border border-charcoal-200 dark:border-white/10">
                          <button
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                            className="p-2.5 text-charcoal-500 hover:text-gold-600 dark:text-white/50 dark:hover:text-gold-300 transition-colors"
                            aria-label="-"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-xs text-charcoal-800 dark:text-white/85">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            className="p-2.5 text-charcoal-500 hover:text-gold-600 dark:text-white/50 dark:hover:text-gold-300 transition-colors"
                            aria-label="+"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          onClick={() => remove(item.productId)}
                          className="text-[0.65rem] font-mono tracking-widest uppercase text-charcoal-400 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400 transition-colors"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-charcoal-200/60 dark:border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/40">
                    {t("subtotal")}
                  </span>
                  <span className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">
                    {formatNPR(subtotal, locale)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="block w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-center text-sm font-medium tracking-wider uppercase rounded-sm transition-colors"
                >
                  {t("checkout")}
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
