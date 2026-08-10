"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import ProductCard, { type ShopProduct } from "./ProductCard";
import { api } from "@/lib/api";
import { useBrowsingHistory } from "@/lib/useBrowsingHistory";
import ScrollReveal from "./ScrollReveal";

interface RecommendedItem extends ShopProduct {
  reason: { id: number; name: string } | null;
}

/**
 * ── Picked for you ──────────────────────────────────────────────────────────
 * Personalized recommendations from the visitor's browsing history (category
 * co-occurrence, computed server-side). Each card explains which viewed piece
 * drove it. Hidden entirely when there's no history or nothing to recommend —
 * and it never blocks the page (silent fetch).
 */
export default function PickedForYou() {
  const t = useTranslations("home");
  const { history, clear } = useBrowsingHistory();
  const [items, setItems] = useState<RecommendedItem[] | null>(null);

  const basedOn = useMemo(
    () => history.slice(0, 6).map((h) => h.id).join(","),
    [history]
  );

  useEffect(() => {
    if (!basedOn) {
      setItems([]);
      return;
    }
    let alive = true;
    api
      .get<{ items: RecommendedItem[] }>(
        `/api/products/recommendations?basedOn=${basedOn}`
      )
      .then((data) => {
        if (alive) setItems(data.items);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [basedOn]);

  if (!history.length || !items || items.length === 0) return null;

  return (
    <section className="py-24 bg-cream-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles size={14} className="text-gold-400/80" aria-hidden="true" />
                <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
                  {t("recEyebrow")}
                </span>
                <span className="h-px w-8 bg-gold-400/30" aria-hidden="true" />
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                {t("recTitle")}
              </h2>
              <p className="mt-3 text-sm text-charcoal-600 dark:text-white/45 max-w-md">
                {t("recBody")}
              </p>
            </div>
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-[0.6rem] font-mono tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/30 hover:text-gold-600 dark:hover:text-gold-400 transition-colors cursor-pointer"
            >
              <X size={12} /> {t("clearHistory")}
            </button>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            >
              <ProductCard product={item} index={i} />
              {item.reason && (
                <p className="mt-3 px-1 text-[0.6rem] font-mono tracking-[0.15em] uppercase text-charcoal-500 dark:text-white/30 leading-relaxed">
                  {t("becauseViewed", {
                    name: item.reason.name.length > 34
                      ? `${item.reason.name.slice(0, 34)}…`
                      : item.reason.name,
                  })}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
