import { useTranslations } from "next-intl";
import FrameCorner from "@/components/FrameCorner";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notfound");

  return (
    <section className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08] relative overflow-hidden px-4">
      {/* Ambient gold bloom */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        style={{
          background:
            "radial-gradient(circle, rgba(212,168,56,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Faint grid of gallery-wall lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,168,56,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,56,0.6) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 text-center max-w-lg">
        {/* Framed "404" */}
        <div className="relative inline-block">
          {/* Outer gold frame border */}
          <div className="absolute -inset-3 border border-gold-400/25" aria-hidden="true" />
          <div className="absolute -inset-6 border border-gold-400/10" aria-hidden="true" />
          {/* Corner brackets at each corner of the outer frame */}
          <FrameCorner size={22} className="absolute -top-6 -left-6 text-gold-400/60" />
          <FrameCorner size={22} position="top-right" className="absolute -top-6 -right-6 text-gold-400/60" />
          <FrameCorner size={22} position="bottom-left" className="absolute -bottom-6 -left-6 text-gold-400/60" />
          <FrameCorner size={22} position="bottom-right" className="absolute -bottom-6 -right-6 text-gold-400/60" />

          <div className="relative px-12 py-10 sm:px-16 sm:py-12">
            <span className="font-mono text-[0.6rem] tracking-[0.4em] uppercase text-gold-400/60">
              {t("eyebrow")}
            </span>
            <div className="mt-4 font-heading text-7xl sm:text-8xl font-bold text-charcoal-900 dark:text-white leading-none">
              {t("title1")} <span className="italic text-gold-400">{t("title2")}</span>
            </div>
            <p className="mt-5 text-charcoal-600 dark:text-white/50 leading-relaxed">
              {t("body")}
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap gap-4 justify-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-sm font-medium tracking-wider uppercase rounded-full transition-colors duration-300"
          >
            {t("backHome")}
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/frames"
            className="inline-flex items-center gap-2 px-8 py-4 border border-charcoal-300 text-charcoal-900 dark:border-white/20 dark:text-white text-sm font-medium tracking-wider uppercase rounded-full hover:bg-charcoal-900/10 dark:hover:bg-white/10 transition-colors duration-300"
          >
            {t("browseFrames")}
          </Link>
        </div>
      </div>
    </section>
  );
}
