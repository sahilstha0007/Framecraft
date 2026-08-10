"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Gavel, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import ProductCard, { type ShopProduct } from "./ProductCard";
import { api } from "@/lib/api";
import ScrollReveal from "./ScrollReveal";
import FrameCorner from "./FrameCorner";

interface TrendingItem extends ShopProduct {
  views: number;
  score: number;
}

/**
 * ── Trending Now ────────────────────────────────────────────────────────────
 * Live homepage section ranked by real marketplace signals (views ×2, bids ×4,
 * reviews ×3 over the last 14 days). Ships with a rank badge per card and a
 * pulsing LIVE marker. Silent on failure — the homepage must never break over
 * a data section.
 */
export default function TrendingNow() {
  const t = useTranslations("home");
  const [items, setItems] = useState<TrendingItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .list<TrendingItem>("/api/products/trending")
      .then((data) => {
        if (alive) setItems(data);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Loading or empty: render nothing (silent fallback keeps the page clean).
  if (!items || items.length === 0) return null;

  return (
    <section className="py-24 bg-cream-100 dark:bg-zinc-950 relative overflow-hidden">
      {/* Soft gold ambience */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(212,168,56,0.045) 0%, transparent 70%)" }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div className="flex items-center gap-3">
              {/* LIVE pulse */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-500" />
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
                    {t("trendingEyebrow")}
                  </span>
                  <span className="h-px w-8 bg-gold-400/30" aria-hidden="true" />
                </div>
                <h2 className="mt-2 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                  {t("trendingTitle")}
                </h2>
              </div>
            </div>
            <p className="max-w-md text-sm text-charcoal-600 dark:text-white/45">
              {t("trendingBody")}
            </p>
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
              className="group relative"
            >
              {/* Rank badge */}
              <span className="absolute -top-3 left-4 z-10 px-2.5 py-1 bg-gold-500 text-[#0a0a08] font-mono text-[0.55rem] tracking-[0.2em] uppercase shadow-lg shadow-gold-500/20">
                No. {String(i + 1).padStart(2, "0")}
              </span>
              <FrameCorner className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ProductCard product={item} index={i} />
              {/* Signal chips */}
              <div className="mt-3 flex items-center gap-4 px-1 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/30">
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={11} className="text-gold-400/60" />
                  {item.views}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Gavel size={11} className="text-gold-400/60" />
                  {item.bidCount ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star size={11} className="text-gold-400/60" />
                  {item.reviewCount ?? 0}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
