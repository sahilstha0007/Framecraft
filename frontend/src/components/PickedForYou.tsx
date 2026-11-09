"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import ProductCard, { type ShopProduct } from "./ProductCard";
import { api } from "@/lib/api";
import { useBrowsingHistory } from "@/lib/useBrowsingHistory";
import { useHydrated } from "@/lib/useHydrated";
import ScrollReveal, { ParallaxLayer } from "./ScrollReveal";

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
  // localStorage is only readable on the client, so defer rendering until
  // after mount — otherwise SSR output (no section) and hydration (section
  // present) would mismatch.
  const mounted = useHydrated();

  const basedOn = useMemo(
    () => history.slice(0, 6).map((h) => h.id).join(","),
    [history]
  );

  useEffect(() => {
    if (!basedOn) return;
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

  if (!mounted || !history.length || !items || items.length === 0) return null;

  return (
    <section className="py-24 bg-cream-50 dark:bg-[#0a0a08] relative overflow-hidden">
      <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                {t("recTitle")}
              </h2>
              <p className="mt-3 text-sm text-charcoal-600 dark:text-white/45 max-w-md">
                {t("recBody")}
              </p>
            </div>
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-mono tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/35 hover:text-gold-600 dark:hover:text-gold-400 transition-colors cursor-pointer"
            >
              <X size={13} /> {t("clearHistory")}
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
              {/* Card and its "because you viewed" note drift as one unit */}
              <ParallaxLayer speed={[0.15, 0.3, 0.3, 0.15][i % 4]}>
                <ProductCard product={item} index={i} />
                {item.reason && (
                  <p className="mt-3 px-1 text-[0.7rem] font-mono tracking-[0.15em] uppercase text-charcoal-500 dark:text-white/35 leading-relaxed">
                    {t("becauseViewed", {
                      name: item.reason.name.length > 34
                        ? `${item.reason.name.slice(0, 34)}…`
                        : item.reason.name,
                    })}
                  </p>
                )}
              </ParallaxLayer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
