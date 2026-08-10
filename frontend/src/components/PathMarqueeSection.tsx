"use client";

import { useTranslations } from "next-intl";
import MarqueeAlongSvgPath from "./MarqueeAlongSvgPath";
import ScrollReveal from "./ScrollReveal";
import FrameCorner from "./FrameCorner";
import { Link } from "@/i18n/navigation";
import { ArrowRight, MousePointer2 } from "lucide-react";

// Wide S-curve drawn in the SVG viewBox space (996 × 330) — the framed works
// travel along this path, rising and dipping across the section.
const MARQUEE_PATH =
  "M1 214 C 90 268 210 320 330 296 C 470 268 520 80 640 74 C 760 68 860 210 995 170";

interface PathMarqueeSectionProps {
  images: string[];
}

export default function PathMarqueeSection({ images }: PathMarqueeSectionProps) {
  const t = useTranslations("marquee");

  return (
    <section className="relative bg-cream-50 dark:bg-black overflow-hidden">
      {/* Faint gold bloom behind the header */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 25%, rgba(212,168,56,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
        <div className="text-center mb-10">
          <ScrollReveal>
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="w-8 h-px bg-gold-400/30" aria-hidden="true" />
              <FrameCorner size={14} className="text-gold-400/40" />
              <span className="w-8 h-px bg-gold-400/30" aria-hidden="true" />
            </div>
            <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
              {t("eyebrow")}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
              {t("title")}
            </h2>
            <p className="mt-3 text-charcoal-600 dark:text-white/50 max-w-lg mx-auto">{t("body")}</p>
          </ScrollReveal>
        </div>
      </div>

      {/* The travelling gallery — clipped so tiles never paint over the header */}
      <div className="relative h-[44vh] sm:h-[54vh] w-full overflow-hidden">
        <MarqueeAlongSvgPath
          path={MARQUEE_PATH}
          viewBox="0 0 996 330"
          baseVelocity={9}
          slowdownOnHover
          draggable
          grabCursor
          repeat={2}
          dragSensitivity={0.1}
          className="w-full h-full"
          responsive
        >
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="group/item relative w-14 h-full transition-[transform] duration-300 ease-in-out hover:scale-[1.35]"
            >
              {/* Frame around the artwork */}
              <div className="w-full h-full border border-gold-400/25 bg-zinc-900 p-1.5 transition-[border-color] duration-300 group-hover/item:border-gold-400/70">
                {/* Inner mat line */}
                <div className="w-full h-full border border-white/10">
                  <img
                    src={src}
                    alt={t("alt")}
                    draggable={false}
                    loading="lazy"
                    className="w-full h-full object-cover select-none"
                  />
                </div>
              </div>
              {/* Hover caption */}
              <span
                className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.5rem] tracking-[0.25em] uppercase text-gold-400/0 transition-colors duration-300 group-hover/item:text-gold-400/80"
                aria-hidden="true"
              >
                No. {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </MarqueeAlongSvgPath>
      </div>

      {/* Hint + CTA */}
      <div className="relative pb-24 pt-10 flex flex-col items-center gap-6">
        <ScrollReveal delay={0.15}>
          <span className="inline-flex items-center gap-2 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/30">
            <MousePointer2 size={13} className="text-gold-400/60" />
            {t("hint")}
          </span>
        </ScrollReveal>
        <ScrollReveal delay={0.25}>
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-2 border border-charcoal-300 text-charcoal-900 dark:border-white/20 dark:text-white rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium transition-[color,background-color,border-color,box-shadow] duration-300 hover:border-gold-500/60 hover:text-gold-600 dark:hover:border-gold-400/50 dark:hover:text-gold-300 hover:bg-gold-400/[0.06] hover:shadow-[0_0_24px_rgba(212,168,56,0.15)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-black"
          >
            {t("cta")}
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
