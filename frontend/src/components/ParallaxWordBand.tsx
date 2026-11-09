"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useTranslations } from "next-intl";

/* ── Parallax word band ───────────────────────────────────────────────────
   Two oversized rows of the studio's values drift at different scroll speeds
   as the visitor travels the section: row one slides left while row two
   slides right, so the statement reads like a kinetic gallery plaque. This
   is the original drifting-rows form of the section (kept transform-only so
   it stays silky under Lenis; rows are repeated well past the viewport so
   the drift never exposes an edge).
   ──────────────────────────────────────────────────────────────────────── */

/* ── Interactive plate ────────────────────────────────────────────────────
   One of the four museum plaques that fill the band's lower half. Hovering
   (or tapping, on touch) slides a short definition up over the plate like a
   caption card being pulled from a drawer — transform-only, so the reveal
   never reflows the layout. Keyboard-accessible with a proper focus ring.
   ──────────────────────────────────────────────────────────────────────── */

function WordPlate({ index, word, def }: { index: number; word: string; def: string }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    // Click/tap is the sole trigger: mobile fires mouseenter before click, so
    // hover-driven state would flash open then closed on every tap. Hover on
    // desktop still hints via border and the rotating diamond (pure CSS).
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      className="group relative h-40 text-left p-5 border border-charcoal-200/60 dark:border-white/[0.07] bg-charcoal-900/[0.02] dark:bg-white/[0.02] overflow-hidden hover:border-gold-500/40 dark:hover:border-gold-400/30 transition-[border-color] duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-[#0a0a08] cursor-pointer"
    >
      <span className="flex items-center justify-between">
        <span className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-gold-600/70 dark:text-gold-400/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={`h-1.5 w-1.5 rotate-45 bg-gold-400/40 transition-transform duration-500 ${open ? "rotate-90" : "group-hover:rotate-90"}`}
          aria-hidden="true"
        />
      </span>
      <span className="block mt-4 font-heading italic text-2xl text-charcoal-900 dark:text-white">
        {word}
      </span>
      {/* Definition card slides up over the plate's lower half (transform-only) */}
      <motion.span
        className="absolute inset-x-0 bottom-0 p-4 bg-gold-400/[0.05] border-t border-gold-400/15"
        initial={false}
        animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : "100%" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden={!open}
      >
        <span className="block text-xs leading-relaxed text-charcoal-600 dark:text-white/55">
          {def}
        </span>
      </motion.span>
    </button>
  );
}

interface WordRowProps {
  words: string[];
  reverse?: boolean;
  x: MotionValue<string>;
}

function WordRow({ words, reverse = false, x }: WordRowProps) {
  // Repeat the word set enough that the row is always far wider than the
  // viewport, even at the largest text scale, so the parallax drift is
  // seamless at every screen size.
  const set = reverse ? [...words].reverse() : words;
  const tokens = Array.from({ length: 4 }, () => set).flat();

  return (
    <motion.div
      style={{ x }}
      className="flex items-center whitespace-nowrap will-change-transform"
      aria-hidden="true"
    >
      {tokens.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-flex items-center gap-10 sm:gap-16 font-heading italic text-6xl sm:text-7xl lg:text-8xl leading-none tracking-tight select-none"
        >
          <span
            className={
              i % 2 === 1
                ? "text-transparent"
                : "text-charcoal-900/90 dark:text-white/90"
            }
            style={
              i % 2 === 1
                ? { WebkitTextStroke: "1.5px rgba(212,168,56,0.45)" }
                : undefined
            }
          >
            {word}
          </span>
          <span
            className="w-2 h-2 rotate-45 bg-gold-400/30 flex-shrink-0"
            aria-hidden="true"
          />
        </span>
      ))}
    </motion.div>
  );
}

export default function ParallaxWordBand({ words }: { words: string[] }) {
  const t = useTranslations("home");
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Different drift speeds per row — row one pulls left, row two pulls right,
  // creating genuine parallax depth between the two lines.
  const row1X = useTransform(scrollYProgress, [0, 1], ["4vw", "-34vw"]);
  const row2X = useTransform(scrollYProgress, [0, 1], ["-4vw", "34vw"]);

  return (
    <section
      ref={ref}
      aria-label={words.join(" ")}
      className="relative bg-cream-50 dark:bg-[#0a0a08] overflow-hidden py-24 sm:py-32"
    >
      {/* Soft gold bloom behind the statement */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(212,168,56,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Plate label — the section's eyebrow */}
      <div className="relative text-center mb-14">
        <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-gold-600 dark:text-gold-400">
          {t("wordBandEyebrow")}
        </span>
      </div>

      <div className="relative space-y-8 sm:space-y-12">
        {reduce ? (
          /* Reduced motion: the words rest centered, no drift */
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6" aria-hidden="true">
            {words.map((w, i) => (
              <span
                key={`${w}-${i}`}
                className={`font-heading italic text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight ${
                  i % 2 === 1
                    ? "text-transparent"
                    : "text-charcoal-900/90 dark:text-white/90"
                }`}
                style={
                  i % 2 === 1
                    ? { WebkitTextStroke: "1.5px rgba(212,168,56,0.45)" }
                    : undefined
                }
              >
                {w}
              </span>
            ))}
          </div>
        ) : (
          <>
            <WordRow words={words} x={row1X} />
            <WordRow words={words} reverse x={row2X} />
          </>
        )}
      </div>

      {/* Interactive plates — the band's lower half becomes a touchable row:
          hover or tap a word to pull its definition out of the plate. */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-20 sm:mt-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {words.map((word, i) => (
            <WordPlate
              key={`${word}-plate-${i}`}
              index={i}
              word={word}
              def={t(`wordBandDef${i + 1}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
