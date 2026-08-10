"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { testimonials } from "@/lib/data";
import type { Testimonial } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import { useTranslations } from "next-intl";
import NextImage from "next/image";

export default function Testimonials() {
  const tr = useTranslations("testimonials");
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  // Live collection from the API — falls back to the bundled catalog.
  const { data: items } = useLocalizedCollection<Testimonial>("testimonials", testimonials);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 200 : -200, opacity: 0 }),
  };

  const paginate = (newDir: number) => {
    setDirection(newDir);
    setCurrent((prev) =>
      newDir > 0
        ? (prev + 1) % items.length
        : (prev - 1 + items.length) % items.length
    );
  };

  const t = items[current];


  // Keep the index in range if the live collection is shorter than the bundled one.
  useEffect(() => {
    setCurrent((c) => Math.min(c, Math.max(0, items.length - 1)));
  }, [items.length]);

  return (
    <section className="py-28 section-deep relative overflow-hidden">
      {/* Soft gold bloom for atmosphere */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(212,168,56,0.05) 0%, transparent 65%)" }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="eyebrow">{tr("eyebrow")}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-mahogany-500 dark:text-cream-100">
            {tr("title")}
          </h2>
        </div>

        <div className="relative mt-16 max-w-2xl mx-auto">
          <div className="relative min-h-[260px] flex items-center" aria-live="polite">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full"
              >
                <div className="flex justify-center mb-6">
                  <Quote size={36} className="text-mahogany-300/30 dark:text-gold-600/30" aria-hidden="true" />
                </div>

                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      aria-hidden="true"
                      className={i < t.rating ? "fill-mahogany-400 text-mahogany-400 dark:fill-gold-400 dark:text-gold-400" : "text-charcoal-200 dark:text-charcoal-700"}
                    />
                  ))}
                </div>

                <blockquote className="text-center text-lg sm:text-xl text-charcoal-700 dark:text-cream-200 leading-relaxed font-light italic px-4">
                  &ldquo;{t.content}&rdquo;
                </blockquote>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-gold-400/30 ring-offset-2 ring-offset-transparent">
                    <NextImage
                      src={t.image}
                      alt={t.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-heading font-semibold text-mahogany-500 dark:text-cream-100">
                      {t.name}
                    </div>
                    <div className="text-sm text-charcoal-400 dark:text-cream-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => paginate(-1)}
              className="p-3 border border-transparent hover:border-gold-400/40 text-charcoal-500 dark:text-cream-400 hover:text-mahogany-500 dark:hover:text-gold-400 transition-[color,border-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
              aria-label={tr("previous")}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2" role="group" aria-label={tr("choose")}>
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`transition-[width,background-color] duration-300 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
                    i === current
                      ? "w-6 h-1.5 bg-mahogany-500 dark:bg-gold-400"
                      : "w-1.5 h-1.5 bg-charcoal-300 dark:bg-charcoal-600 hover:bg-charcoal-400 dark:hover:bg-charcoal-500"
                  }`}
                  aria-label={tr("item", { n: i + 1 })}
                  aria-current={i === current}
                />
              ))}
            </div>

            <button
              onClick={() => paginate(1)}
              className="p-3 border border-transparent hover:border-gold-400/40 text-charcoal-500 dark:text-cream-400 hover:text-mahogany-500 dark:hover:text-gold-400 transition-[color,border-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
              aria-label={tr("next")}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}