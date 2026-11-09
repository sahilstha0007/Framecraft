"use client";

import { ArrowRight, Gavel } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/ScrollReveal";
import { DepthParallax } from "@/components/ScrollSections";

/**
 * ── The finale ──────────────────────────────────────────────────────────────
 * Full-viewport, three-layer depth parallax — the same cinematic closer the
 * site always had, now pointing at the marketplace: collect on one side,
 * sell on the other. A giant कला drifts through the midground.
 */
export default function HomeFinale() {
  const t = useTranslations("market");

  return (
    <DepthParallax
      bgImage="/art/brocade.jpg"
      bgSpeed={0.1}
      midSpeed={0.25}
      fgSpeed={0.4}
      height="min-h-[100dvh]"
      className="bg-[#0a0a08]"
      bgChildren={
        <div className="absolute inset-0 bg-[#0a0a08]/60" aria-hidden="true" />
      }
      midChildren={
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-3xl" />
          {/* Giant कला drifting at its own speed — pure parallel depth */}
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2 }}
            className="pointer-events-none select-none absolute font-heading font-bold leading-none text-[18rem] sm:text-[24rem] text-transparent [-webkit-text-stroke:1.5px_rgba(212,168,56,0.16)]"
          >
            कला
          </motion.span>
        </div>
      }
      fgChildren={
        <div className="flex items-center justify-center min-h-[100dvh] px-4">
          <div className="text-center max-w-2xl">
            <ScrollReveal>
              <div className="mb-8 inline-flex items-center gap-3">
                <span className="flag-ribbon w-10 rounded-full" aria-hidden="true" />
                <span className="font-mono text-[0.7rem] tracking-[0.3em] uppercase text-gold-400">
                  {t("finaleEyebrow")}
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white leading-tight">
                {t("finaleTitle1")}
                <br />
                <span className="text-gradient-gold italic">{t("finaleTitle2")}</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="mt-6 text-white/50">{t("finaleBody")}</p>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-white text-black rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium transition-[transform,box-shadow] duration-300 hover:shadow-[0_0_32px_8px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.97]"
                >
                  {t("heroCtaShop")} <ArrowRight size={15} />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 border border-white/20 text-white rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium hover:border-gold-400/60 hover:text-gold-300 hover:bg-white/5 transition-colors duration-300"
                >
                  <Gavel size={15} className="text-gold-400" />
                  {t("ctaSellBtn")}
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      }
    />
  );
}
