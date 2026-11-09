"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Gavel, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import ProductCard, { type ShopProduct } from "./ProductCard";
import { api } from "@/lib/api";
import ScrollReveal, { DriftWatermark, ParallaxLayer } from "./ScrollReveal";
import FrameCorner from "./FrameCorner";
import { Link } from "@/i18n/navigation";

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

  // Keep the section mounted with a reserved grid while loading so the page
  // doesn't jump when the fetch resolves — never a silent unmount (CLS).
  const loading = items === null;
  const shown = items?.slice(0, 4) ?? [];

  // Signal-bar scaling — each row's bars are sized relative to the strongest
  // signal of the same kind across the top-4 row, so the chart reads honestly.
  const maxViews = Math.max(1, ...shown.map((i) => i.views ?? 0));
  const maxBids = Math.max(1, ...shown.map((i) => i.bidCount ?? 0));
  const maxReviews = Math.max(1, ...shown.map((i) => i.reviewCount ?? 0));

  return (
    <section className="py-24 bg-cream-100 dark:bg-[#0a0a08] relative overflow-hidden">
      {/* Parallel layer: giant word drifting behind the ranked row */}
      <DriftWatermark text="TRENDING" speed={0.3} className="absolute inset-0" />
      {/* Soft gold ambience */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(212,168,56,0.045) 0%, transparent 70%)" }}
      />
      <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
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
                  <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-gold-600 dark:text-gold-400">
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
          {/* Only the top 4 — a full row on desktop, keeps the homepage light.
              The full ranked list lives on the shop page. */}
          {shown.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="group relative"
            >
              {/* Rank badge */}
              <span className="absolute -top-3 left-4 z-10 px-2.5 py-1 bg-gold-500 text-[#0a0a08] font-mono text-[0.65rem] tracking-[0.2em] uppercase shadow-lg shadow-gold-500/20">
                #{i + 1}
              </span>
              <FrameCorner className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Each column drifts at its own speed, a quiet parallel wave.
                  Card and signal chips drift together as one unit. */}
              <ParallaxLayer speed={[0.15, 0.3, 0.3, 0.15][i % 4]}>
                <ProductCard product={item} index={i} />
                {/* Signal chips — hidden while loading or when a piece has no
                    signals yet, so we never show a dead "0 / 0 / 0" row */}
                {!loading && (item.views || (item.bidCount ?? 0) || (item.reviewCount ?? 0)) > 0 && (
                  <div className="mt-3 px-1">
                    <div className="flex items-center gap-4 font-mono text-[0.65rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/35">
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
                    {/* Signal bars — three gold hairlines sized to the real
                        views/bids/review counts, relative to the row peak.
                        aria-hidden: the numbers above already carry the info. */}
                    <div className="mt-2 space-y-1" aria-hidden="true">
                      {[
                        { icon: <Eye size={10} />, pct: Math.round(((item.views ?? 0) / maxViews) * 100) },
                        { icon: <Gavel size={10} />, pct: Math.round(((item.bidCount ?? 0) / maxBids) * 100) },
                        { icon: <Star size={10} />, pct: Math.round(((item.reviewCount ?? 0) / maxReviews) * 100) },
                      ].map((bar, b) => (
                        <div key={b} className="flex items-center gap-2">
                          <span className="flex-shrink-0 text-gold-400/50">{bar.icon}</span>
                          <span className="relative flex-1 h-[3px] bg-charcoal-200/40 dark:bg-white/[0.05]">
                            <motion.span
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-400/40 to-gold-500"
                              style={{ transformOrigin: "left" }}
                              initial={{ scaleX: 0 }}
                              whileInView={{ scaleX: bar.pct / 100 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 + b * 0.12 }}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ParallaxLayer>
            </motion.div>
          ))}
          {/* Reserved skeleton grid while loading — holds the layout steady */}
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="animate-pulse">
                <div className="aspect-[3/4] w-full bg-charcoal-200/50 dark:bg-white/[0.05]" />
                <div className="mt-3 h-3 w-3/4 bg-charcoal-200/60 dark:bg-white/[0.06]" />
                <div className="mt-2 h-3 w-1/2 bg-charcoal-200/50 dark:bg-white/[0.05]" />
              </div>
            ))}
          {/* Empty: full-width note so the section still self-identifies */}
          {!loading && shown.length === 0 && (
            <div className="col-span-full py-10 text-center text-sm text-charcoal-500 dark:text-white/35">
              {t("pulseEmpty")}
            </div>
          )}
        </div>

        {/* Escape hatch to the full ranked list */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors"
          >
            {t("viewAllFrames")}{" "}
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
