"use client";

import { motion } from "framer-motion";
import NextImage from "next/image";
import FrameCorner from "./FrameCorner";
import type { ReactNode } from "react";

// Film-grain noise overlay shared with the hero — keeps the page entrances
// feeling like part of the same gallery wall.
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  /** Optional full-bleed background image (rendered dimmed beneath the grade). */
  image?: string;
  align?: "center" | "left";
  children?: ReactNode;
}

/**
 * Shared route header — a deep gallery-wall entrance with a gold eyebrow,
 * serif masthead, radial gold bloom and a framed hairline footer. All routes
 * render on the same dark canvas so the site feels like one continuous
 * exhibition rather than a set of disconnected templates.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  image,
  align = "center",
  children,
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <section className="relative pt-36 pb-24 sm:pt-40 sm:pb-28 overflow-hidden bg-cream-100 dark:bg-[#1a1512]">
      {image && (
        <NextImage
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
      )}

      {/* Color grade + vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-100/80 via-cream-100/88 to-cream-200 dark:from-[#1a1512]/80 dark:via-[#1a1512]/88 dark:to-[#0a0a08]" />

      {/* Warm gold bloom from the top */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[440px]"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(212,168,56,0.14) 0%, transparent 65%)",
        }}
      />

      {/* Subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: NOISE_BG }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className={centered ? "text-center" : ""}
        >
          {/* Eyebrow */}
          <div className={`flex items-center gap-4 ${centered ? "justify-center" : ""}`}>
            <span
              className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/50"
              aria-hidden="true"
            />
            <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold-400/70">
              {eyebrow}
            </span>
            <span
              className="w-10 h-px bg-gradient-to-l from-transparent to-gold-400/50"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal-900 dark:text-white leading-[1.05] tracking-tight">
            {title}
          </h1>

          {description && (
            <p
              className={`mt-5 text-charcoal-700 dark:text-white/55 leading-relaxed max-w-xl text-base ${
                centered ? "mx-auto" : ""
              }`}
            >
              {description}
            </p>
          )}

          {children}
        </motion.div>

        {/* Framed hairline footer */}
        <div
          className={`relative z-10 mt-16 flex items-center gap-3 ${
            centered ? "justify-center" : ""
          }`}
          aria-hidden="true"
        >
          <FrameCorner size={16} position="top-right" className="text-gold-400/40" />
          <span className="w-16 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
          <FrameCorner size={16} position="top-left" className="text-gold-400/40" />
        </div>
      </div>
    </section>
  );
}
