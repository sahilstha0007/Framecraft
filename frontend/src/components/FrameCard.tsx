"use client";

import { motion } from "framer-motion";
import { Frame } from "@/lib/types";
import { ArrowRight, Ruler, Expand } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import NextImage from "next/image";
import { CardCorners } from "./FrameCorner";
import { localizePrice } from "@/lib/nepali";

interface FrameCardProps {
  frame: Frame;
  index: number;
  /** Optional — fired when the card body is clicked (used for image zoom). */
  onClick?: () => void;
}

export default function FrameCard({ frame, index, onClick }: FrameCardProps) {
  const t = useTranslations("framesPage");
  const locale = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={onClick ? t("viewFrame", { name: frame.name }) : undefined}
      className={`group relative bg-charcoal-900/[0.02] border border-charcoal-200/60 dark:bg-white/[0.02] dark:border-white/[0.06] overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-gold-500/40 dark:hover:border-gold-400/30 hover:shadow-[0_0_40px_rgba(212,168,56,0.06)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <CardCorners className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image Container */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        <NextImage
          src={frame.image}
          alt={frame.name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {frame.popular && (
          <span className="absolute top-4 left-4 px-3 py-1 text-[0.6rem] font-mono tracking-[0.15em] uppercase text-[#0a0a08] bg-gold-500 z-10">
            {t("popular")}
          </span>
        )}

        {/* Expand hint (appears on hover when clickable) */}
        {onClick && (
          <span className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-[#0a0a08]/60 backdrop-blur border border-white/10 text-white/70 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-500 z-10">
            <Expand size={15} />
          </span>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
          <Link
            href={`/frames#frame-${frame.id}`}
            onClick={(e) => e.stopPropagation()}
            className="px-6 py-3 bg-[#0a0a08]/85 backdrop-blur border border-white/10 text-cream-100 text-xs font-medium tracking-wider uppercase hover:bg-gold-500 hover:text-[#0a0a08] hover:border-gold-500 transition-[background-color,color,border-color] duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
          >
            {t("quickView")}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-400/70">
              {frame.category}
            </span>
            <h3 className="mt-1.5 text-xl font-heading font-semibold text-charcoal-900 group-hover:text-gold-600 dark:text-white dark:group-hover:text-gold-300 transition-colors duration-500">
              {frame.name}
            </h3>
          </div>
          <span className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/30 whitespace-nowrap pt-1">
            {localizePrice(frame.priceRange, locale)}
          </span>
        </div>

        <p className="text-sm text-charcoal-600 dark:text-white/45 leading-relaxed line-clamp-2">
          {frame.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-charcoal-600 dark:text-white/40">
            <Ruler size={13} className="text-gold-400/60" />
            {frame.sizes[0]} – {frame.sizes[frame.sizes.length - 1]}
          </span>
          <span className="text-[0.6rem] font-mono tracking-[0.15em] uppercase text-charcoal-500 dark:text-white/30">
            {frame.material}
          </span>
        </div>

        <Link
          href={`/frames#frame-${frame.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 transition-colors duration-300 group/link focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-[#0a0a08]"
        >
          {t("viewDetails")}
          <ArrowRight size={14} aria-hidden="true" className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
