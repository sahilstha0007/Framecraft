"use client";

import { motion } from "framer-motion";
import { ArrowRight, Gavel, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import { formatNPR } from "@/lib/nepali";
import { useCollection } from "@/lib/useCollection";
import { useHydrated } from "@/lib/useHydrated";
import type { ShopProduct } from "@/components/ProductCard";

/* ── Floating artwork card ────────────────────────────────────────────────
   One live marketplace piece, lifted off the hero canvas. The card drifts
   on a slow float loop while a magnetic hover tilt responds to the cursor. */
function HeroArtwork({
  product,
  className = "",
  delay = 0,
  priority = false,
}: {
  product: ShopProduct;
  className?: string;
  delay?: number;
  priority?: boolean;
}) {
  const t = useTranslations("shopPage");
  const locale = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6 + delay * 2, repeat: Infinity, ease: "easeInOut" }}
        className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]"
      >
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            <NextImage
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 60vw, 26vw"
              priority={priority}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/70 via-transparent to-transparent" />
            {product.auction && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 text-[0.6rem] font-mono tracking-[0.15em] uppercase text-gold-300 bg-[#0a0a08]/80 backdrop-blur rounded-sm">
                <Gavel size={10} /> {t("auction")}
              </span>
            )}
          </div>
          <div className="p-4">
            <span className="font-mono text-[0.6rem] tracking-tighter text-sm/normal uppercase text-gold-400/80">
              {product.category}
            </span>
            <h3 className="mt-1 text-sm font-heading font-semibold text-white leading-snug line-clamp-1">
              {product.name}
            </h3>
            <span className="mt-1 block font-heading text-base font-semibold text-gradient-gold">
              {formatNPR(product.auction ? (product.currentBid ?? product.startingBid ?? 0) : product.price, locale)}
            </span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function HomeHero() {
  const t = useTranslations("market");
  const locale = useLocale();
  const mounted = useHydrated();
  const { data: products } = useCollection<ShopProduct>("products", []);

  // Hero picks: featured pieces first, then anything with stock/bids.
  const picks = [...products]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, 3);
  const [main, ...rest] = picks;

  // Category words drift along the hero's bottom edge.
  const categories = Array.from(new Set(products.map((p) => p.category))).slice(0, 8);
  const marqueeItems = (categories.length ? categories : ["Thangka", "Paubha", "Mithila", "Contemporary"]).map(
    (label) => ({ label })
  );

  const stats = [
    { value: products.length ? `${Math.max(products.length, 12)}+` : "120+", label: t("heroStatArtworks") },
    { value: "35+", label: t("heroStatArtists") },
    { value: "LIVE", label: t("heroStatAuctions"), accent: true },
  ];

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-[#0a0a0a]/40 backdrop-blur-3xl border border-white/10 text-white">
      {/* ── Backdrop: thangka sky + Newari lattice ── */}
      <div className="absolute inset-0 bg-thangka-sky" aria-hidden="true" />
      <div className="absolute inset-0 bg-lattice opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 90% 65% at 50% 115%, rgba(10,10,8,0.9) 0%, transparent 60%)" }}
        aria-hidden="true"
      />

      {/* Giant Devanagari watermark — the word for art itself */}
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="pointer-events-none select-none absolute -right-8 top-16 lg:top-auto lg:-bottom-14 font-heading font-bold leading-none text-[16rem] sm:text-[22rem] lg:text-[28rem] text-transparent [-webkit-text-stroke:1.5px_rgba(212,168,56,0.14)]"
      >
        कला
      </motion.span>

      <div className="relative z-10 max-w-7xl 2xl:max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
        {/* ── Copy ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="inline-flex items-center gap-3"
          >
            <span className="flag-ribbon w-10 rounded-full" aria-hidden="true" />
            <span className="font-mono text-[0.7rem] tracking-[0.3em] uppercase text-gold-400">
              {t("heroEyebrow")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-5 text-4xl sm:text-6xl xl:text-7xl font-heading font-bold leading-[1.05]"
          >
            {t("heroTitle1")}{" "}
            <span className="text-gradient-gold italic">{t("heroTitleAccent")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 max-w-lg text-charcoal-200/70 dark:text-white/55 leading-relaxed"
          >
            {t("heroBody")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-[#0a0a08] rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium transition-all duration-300 hover:shadow-[0_0_36px_rgba(212,168,56,0.35)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("heroCtaShop")}
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/shop?auction=1"
              className="group inline-flex items-center gap-2 border border-white/20 text-white rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium hover:border-gold-400/60 hover:text-gold-300 hover:bg-gold-400/[0.06] transition-colors duration-300"
            >
              <Gavel size={15} className="text-gold-400" />
              {t("heroCtaAuctions")}
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.dl
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-12 flex divide-x divide-white/10"
          >
            {stats.map((s) => (
              <div key={s.label} className="px-6 first:pl-0 last:pr-0">
                <dt className="sr-only">{s.label}</dt>
                <dd
                  className={`font-heading text-2xl sm:text-3xl font-bold tabular-nums ${
                    s.accent ? "text-gold-400" : "text-white"
                  }`}
                >
                  {mounted || !s.accent ? s.value : "—"}
                </dd>
                <dd className="mt-1 font-mono text-[0.6rem] tracking-tighter text-sm/normal uppercase text-white/40">
                  {s.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ── Floating artworks ── */}
        <div className="relative hidden md:block h-[520px]">
          {main && (
            <HeroArtwork
              product={main}
              priority
              delay={0.5}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] z-20"
            />
          )}
          {rest[0] && (
            <HeroArtwork
              product={rest[0]}
              delay={0.75}
              className="absolute left-0 bottom-6 w-[220px] z-10 opacity-90"
            />
          )}
          {rest[1] && (
            <HeroArtwork
              product={rest[1]}
              delay={0.95}
              className="absolute right-0 top-4 w-[230px] z-10 opacity-90"
            />
          )}
          {/* Gold halo behind the stack */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[420px] h-[420px] rounded-full bg-gold-400/[0.07] blur-3xl" />
          </div>
        </div>
      </div>

      {/* Mobile fallback: single featured strip instead of the floating stack */}
      {main && (
        <div className="relative z-10 md:hidden max-w-7xl mx-auto w-full px-4 pb-10 -mt-6">
          <HeroArtwork product={main} delay={0.6} />
        </div>
      )}

      {/* ── Bottom category marquee ── */}
      <div className="relative z-10 border-t border-white/[0.06] py-4 mask-fade-x overflow-hidden">
        <div
          className="flex w-max gap-10 whitespace-nowrap animate-marquee"
          aria-hidden="true"
        >
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-10 font-heading text-lg tracking-wide text-white/25 select-none"
            >
              {item.label}
              <span className="text-[0.6rem] text-vermilion-400/60">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Location whisper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-16 right-6 z-10 hidden lg:flex items-center gap-1.5 font-mono text-[0.6rem] tracking-[0.25em] uppercase text-white/30"
      >
        <MapPin size={11} className="text-vermilion-400" />
        Kathmandu · Nepal
      </motion.div>
    </section>
  );
}
