"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Gavel, Loader2, ShoppingBag, Star, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import ProductCard, { type ShopProduct } from "./ProductCard";
import ScrollReveal, { DriftWatermark, ParallaxLayer } from "./ScrollReveal";
import { api } from "@/lib/api";
import { Link } from "@/i18n/navigation";

interface PulseData {
  freshArrivals: ShopProduct[];
  recentWins: { productId: number; productName: string; productImage: string; endedAt: string | null; winnerName: string | null }[];
  recentReviews: { productId: number; productName: string; productImage: string; reviewerName: string | null; rating: number; body: string | null; createdAt: string }[];
  newSellers: { id: number; name: string; shopName: string | null; avatar: string | null; createdAt: string }[];
}

function timeAgo(date: string | null): { label: string; ts: number } {
  if (!date) return { label: "", ts: 0 };
  const ts = new Date(date.replace(" ", "T")).getTime();
  if (Number.isNaN(ts)) return { label: "", ts: 0 };
  const mins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  let label: string;
  if (mins < 60) label = `${mins}m`;
  else if (mins < 1440) label = `${Math.floor(mins / 60)}h`;
  else label = `${Math.floor(mins / 1440)}d`;
  return { label, ts };
}

export default function MarketplacePulse() {
  const t = useTranslations("home");
  const [data, setData] = useState<PulseData | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<PulseData>("/api/activity")
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {
        if (alive) setData({ freshArrivals: [], recentWins: [], recentReviews: [], newSellers: [] });
      });
    return () => {
      alive = false;
    };
  }, []);

  const loading = data === null;
  const arrivals = data?.freshArrivals.slice(0, 4) ?? [];
  // Wins with no recorded winner read as "won by -" — filter those out.
  const feed = [
    ...(data?.recentWins ?? [])
      .filter((w) => w.winnerName)
      .map((w) => ({
        key: `win-${w.productId}-${w.endedAt}`,
        icon: <Gavel size={13} className="text-gold-400" />,
        text: t("pulseWin", { name: w.productName, winner: w.winnerName! }),
        time: timeAgo(w.endedAt),
        href: `/products/${w.productId}`,
      })),
    ...(data?.recentReviews ?? []).map((r) => ({
      key: `rev-${r.productId}-${r.createdAt}`,
      icon: <Star size={13} className="text-gold-400" />,
      text: t("pulseReview", { name: r.productName, reviewer: r.reviewerName ?? "-", rating: r.rating }),
      time: timeAgo(r.createdAt),
      href: `/products/${r.productId}`,
    })),
    ...(data?.newSellers ?? []).map((s) => ({
      key: `seller-${s.id}`,
      icon: <Store size={13} className="text-gold-400" />,
      text: t("pulseSeller", { shop: s.shopName ?? s.name }),
      time: timeAgo(s.createdAt),
      href: `/sellers/${s.id}`,
    })),
  ]
    .sort((a, b) => b.time.ts - a.time.ts || a.text.localeCompare(b.text))
    .slice(0, 9);

  return (
    <section className="py-24 bg-cream-50 dark:bg-[#0a0a08] relative overflow-hidden">
      {/* Parallel layer: giant word drifting behind the pulse grid */}
      <DriftWatermark text="LIVE" speed={0.3} className="absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 40% at 50% 0%, rgba(212,168,56,0.045) 0%, transparent 70%)" }}
      />
      <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <ScrollReveal>            <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-gold-600 dark:text-gold-400">
                  {t("pulseEyebrow")}
                </span>
                <span className="h-px w-8 bg-gold-400/30" aria-hidden="true" />
              </div>
              <h2 className="mt-2 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                {t("pulseTitle")}
              </h2>
              <p className="mt-3 text-sm text-charcoal-600 dark:text-white/45 max-w-md">
                {t("pulseBody")}
              </p>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors"
            >
              {t("viewAllFrames")} <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fresh arrivals — skeleton while loading so the section height
              stays stable and the grid never pops in later */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse">
                  <div className="aspect-[3/4] w-full bg-charcoal-200/50 dark:bg-white/[0.05]" />
                  <div className="mt-3 h-3 w-3/4 bg-charcoal-200/60 dark:bg-white/[0.06]" />
                  <div className="mt-2 h-3 w-1/2 bg-charcoal-200/50 dark:bg-white/[0.05]" />
                </div>
              ))}
            {arrivals.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
              >
                <ParallaxLayer speed={[0.12, 0.25, 0.25, 0.12][i % 4]}>
                  <ProductCard product={p} index={i} />
                </ParallaxLayer>
              </motion.div>
            ))}
            {arrivals.length === 0 && (
              <div className="text-sm text-charcoal-500 dark:text-white/35">{t("pulseEmpty")}</div>
            )}
          </div>

          {/* Live feed — drifts at its own speed, parallel to the arrivals */}
          <ParallaxLayer speed={0.22} className="border border-charcoal-200/60 dark:border-white/[0.07] bg-charcoal-900/[0.02] dark:bg-white/[0.02] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-200/60 dark:border-white/[0.07]">
              <span className="inline-flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/45">
                <ShoppingBag size={13} className="text-gold-400/70" /> {t("pulseFeed")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-mono tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t("live")}
              </span>
            </div>
            <div className="flex-1 divide-y divide-charcoal-200/50 dark:divide-white/[0.05] overflow-hidden">
              {!loading && feed.length === 0 && (
                <div className="p-5 text-sm text-charcoal-500 dark:text-white/35">{t("pulseEmpty")}</div>
              )}
              {feed.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={item.href} className="group flex items-start gap-3 px-5 py-3.5 hover:bg-charcoal-900/[0.03] dark:hover:bg-white/[0.03] transition-colors">
                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 flex items-center justify-center border border-gold-400/25 bg-gold-400/[0.05]">
                      {item.icon}
                    </span>
                    <span className="flex-1 min-w-0 text-xs leading-relaxed text-charcoal-700 dark:text-white/55 group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors">
                      {item.text}
                    </span>
                    <span className="flex-shrink-0 font-mono text-[0.65rem] text-charcoal-400 dark:text-white/30 pt-0.5">
                      {item.time.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </ParallaxLayer>
        </div>
      </div>
    </section>
  );
}
