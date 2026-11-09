"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Gavel } from "lucide-react";
import { useTranslations } from "next-intl";
import ScrollReveal, { DriftWatermark } from "@/components/ScrollReveal";
import ProductCard, { type ShopProduct } from "@/components/ProductCard";
import { useCollection } from "@/lib/useCollection";
import { Link } from "@/i18n/navigation";

/**
 * ── Auction strip ───────────────────────────────────────────────────────────
 * The auction room: a deep lapis/vermilion band where one-of-a-kind pieces
 * go under the gavel. Shows the three auctions closing soonest — each card
 * carries its own live countdown (see ProductCard).
 */
export default function AuctionStrip() {
  const t = useTranslations("market");
  const { data: products } = useCollection<ShopProduct>("products", []);
  const [live, setLive] = useState<ShopProduct[]>([]);

  // Clock-dependent filtering runs post-mount (in a microtask) so render
  // stays pure — the section simply stays empty until then.
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (!alive) return;
      const now = Date.now();
      const open = products
        .filter(
          (p) =>
            p.auction &&
            p.status !== "ended" &&
            (!p.endsAt || new Date(p.endsAt.replace(" ", "T")).getTime() > now)
        )
        .sort((a, b) => (a.endsAt ?? "9999").localeCompare(b.endsAt ?? "9999"))
        .slice(0, 3);
      setLive(open);
    });
    return () => {
      alive = false;
    };
  }, [products]);

  if (live.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-[#0c1024] dark:bg-[#080b1a] text-white">
      {/* Paubha sky wash + watermark */}
      <div className="absolute inset-0 bg-thangka-sky" aria-hidden="true" />
      <DriftWatermark text="BOLI" speed={0.28} className="absolute inset-0" />

      <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vermilion-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-vermilion-500" />
                </span>
                <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-gold-400">
                  {t("auctionsEyebrow")}
                </span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold">
                {t("auctionsTitle")}
              </h2>
            </div>
            <p className="max-w-md text-sm text-white/50">{t("auctionsBody")}</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {live.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="group relative"
            >
              <span className="absolute -top-3 left-4 z-10 px-2.5 py-1 bg-vermilion-600 text-white font-mono text-[0.65rem] tracking-[0.2em] uppercase shadow-lg shadow-vermilion-900/40 inline-flex items-center gap-1.5">
                <Gavel size={11} /> {t("lot", { n: i + 1 })}
              </span>
              <ProductCard product={product} index={i} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/shop?auction=1"
            className="group inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-gold-400 hover:text-gold-300 transition-colors"
          >
            {t("auctionsViewAll")}
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
