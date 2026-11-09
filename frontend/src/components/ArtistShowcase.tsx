"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Store, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ScrollReveal, { DriftWatermark, ParallaxLayer } from "@/components/ScrollReveal";
import { useCollection } from "@/lib/useCollection";

interface Seller {
  id: number;
  name: string;
  avatar: string | null;
  shopName: string | null;
  bio: string | null;
  location: string | null;
  productCount: number;
  followerCount: number;
}

/**
 * ── Artist showcase ─────────────────────────────────────────────────────────
 * The people behind the work. Top sellers by catalog size, each card a
 * doorway into their public profile (shop, stories, followers).
 */
export default function ArtistShowcase() {
  const t = useTranslations("market");
  const { data: sellers } = useCollection<Seller>("sellers", []);

  const top = [...sellers].sort((a, b) => b.productCount - a.productCount).slice(0, 4);
  if (top.length === 0) return null;

  return (
    <section className="py-24 bg-cream-100 dark:bg-[#0a0a08] relative overflow-hidden">
      {/* Lattice whispers the craft heritage without shouting */}
      <div className="absolute inset-0 bg-lattice opacity-60 dark:opacity-40 pointer-events-none" aria-hidden="true" />
      {/* Parallel layer: giant word drifting behind the artists */}
      <DriftWatermark text="ARTISTS" speed={0.28} className="absolute inset-0" />

      <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gold-400/40" aria-hidden="true" />
                <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-gold-600 dark:text-gold-400">
                  {t("artistsEyebrow")}
                </span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                {t("artistsTitle")}
              </h2>
            </div>
            <Link
              href="/sellers"
              className="group inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors"
            >
              {t("artistsViewAll")}
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {top.map((seller, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 4) * 0.08 }}
            >
              {/* Parallel wave: each card drifts at its own scroll speed */}
              <ParallaxLayer speed={[0.14, 0.3, 0.22, 0.36][i % 4]}>
                <Link
                  href={`/sellers/${seller.id}`}
                  className="group relative block border border-charcoal-200/60 dark:border-white/[0.07] bg-white/50 dark:bg-white/[0.02] p-6 text-center transition-[border-color,box-shadow] duration-500 hover:border-gold-500/50 dark:hover:border-gold-400/30 hover:shadow-[0_0_40px_rgba(212,168,56,0.08)]"
                >
                <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {seller.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={seller.avatar}
                    alt={seller.shopName || seller.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-gold-400/30 group-hover:ring-gold-400/60 transition-shadow duration-500"
                  />
                ) : (
                  <span className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-walnut-600/10 dark:bg-gold-500/10 text-gold-600 dark:text-gold-400">
                    <Store size={26} />
                  </span>
                )}
                <h3 className="mt-4 font-heading text-lg font-semibold text-charcoal-900 dark:text-white leading-snug line-clamp-1">
                  {seller.shopName || seller.name}
                </h3>
                <p className="mt-1 font-mono text-[0.65rem] tracking-[0.15em] uppercase text-charcoal-500 dark:text-white/35">
                  {seller.name}
                </p>
                {seller.bio && (
                  <p className="mt-3 text-xs text-charcoal-600 dark:text-white/45 leading-relaxed line-clamp-2">
                    {seller.bio}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-charcoal-200/60 dark:border-white/[0.06] flex items-center justify-center gap-4 font-mono text-[0.65rem] tracking-[0.15em] uppercase text-charcoal-500 dark:text-white/40">
                  {seller.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} className="text-vermilion-500 dark:text-vermilion-400" />
                      {seller.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users size={11} className="text-gold-500 dark:text-gold-400" />
                    {t("followers", { n: seller.followerCount })}
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
