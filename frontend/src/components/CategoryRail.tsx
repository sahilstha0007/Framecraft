"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import ScrollReveal, { DriftWatermark, ParallaxLayer } from "@/components/ScrollReveal";
import FrameCorner from "@/components/FrameCorner";
import type { ShopProduct } from "@/components/ProductCard";
import { useCollection } from "@/lib/useCollection";

interface Category {
  name: string;
  count: number;
  image: string;
}

/**
 * ── Category rail ───────────────────────────────────────────────────────────
 * Nepali art traditions surfaced straight from the live catalog: each card
 * takes its cover image from the newest piece in that category, so the rail
 * always shows real work — never stock icons.
 */
export default function CategoryRail() {
  const t = useTranslations("market");
  const { data: products } = useCollection<ShopProduct>("products", []);

  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, Category>();
    for (const p of products) {
      const existing = map.get(p.category);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(p.category, { name: p.category, count: 1, image: p.image });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  if (categories.length === 0) return null;

  return (
    <section className="py-24 bg-cream-50 dark:bg-[#0a0a08] relative overflow-hidden">
      {/* Parallel layer: giant word drifting behind the rail */}
      <DriftWatermark text="HERITAGE" speed={0.3} className="absolute inset-0" />
      <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gold-400/40" aria-hidden="true" />
                <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-gold-600 dark:text-gold-400">
                  {t("categoriesEyebrow")}
                </span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                {t("categoriesTitle")}
              </h2>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors"
            >
              {t("viewAll")}
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.slice(0, 5).map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 5) * 0.08 }}
            >
              {/* Each column drifts at its own scroll speed — the rail reads
                  as a parallel wave, same language as the hero stack. */}
              <ParallaxLayer speed={[0.12, 0.26, 0.2, 0.32, 0.16][i % 5]}>
                <Link
                  href={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="group relative block aspect-[3/4] overflow-hidden border border-charcoal-200/60 dark:border-white/[0.07]"
                >
                  <NextImage
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/85 via-[#0a0a08]/15 to-transparent" />
                  <FrameCorner
                    size={16}
                    className="absolute top-3 left-3 text-gold-300/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-heading text-lg font-semibold text-white leading-snug line-clamp-2">
                      {cat.name}
                    </h3>
                    <span className="mt-1 block font-mono text-[0.65rem] tracking-[0.2em] uppercase text-gold-400">
                      {t("pieces", { n: cat.count })}
                    </span>
                  </div>
                </Link>
              </ParallaxLayer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
