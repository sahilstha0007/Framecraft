"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { galleryItems } from "@/lib/data";
import type { GalleryItem } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import { useTranslations } from "next-intl";
import GalleryCard from "@/components/GalleryCard";
import ImageZoom from "@/components/ImageZoom";
import PageHeader from "@/components/PageHeader";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function GalleryPage() {
  const t = useTranslations("galleryPage");
  const [activeCat, setActiveCat] = useState("All");
  const [zoomIndex, setZoomIndex] = useState(-1);

  // Live collection from the API — falls back to the bundled catalog.
  const { data: items } = useLocalizedCollection<GalleryItem>("gallery", galleryItems);

  // Category chips are derived from the (localized) items so they always
  // match the language of the card labels, plus an "All" chip.
  const categories = [t("all"), ...Array.from(new Set(items.map((g) => g.category)))];

  const filtered = activeCat === t("all") ? items : items.filter((g) => g.category === activeCat);
  const zoomImages = filtered.map((g) => ({ image: g.image, title: g.title }));

  const stats = [
    { number: "500+", label: t("stat1Label") },
    { number: "98%", label: t("stat2Label") },
    { number: "15+", label: t("stat3Label") },
    { number: "50+", label: t("stat4Label") },
  ];

  return (
    <>
      {/* Header */}
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("title")} <span className="italic text-gold-400">{t("titleAccent")}</span>
          </>
        }
        description={t("description")}
      />

      {/* Categories */}
      <section className="sticky top-20 z-30 border-b border-charcoal-200/60 dark:border-white/[0.06] bg-cream-50/85 dark:bg-[#0a0a08]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`whitespace-nowrap px-5 py-2.5 text-[0.6rem] font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
                  activeCat === cat
                    ? "bg-gold-500 text-[#0a0a08]"
                    : "border border-charcoal-200 text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-400 dark:border-white/10 dark:text-white/50 dark:hover:text-white/80 dark:hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Masonry Gallery */}
      <section className="py-16 sm:py-20 bg-cream-50 dark:bg-[#0a0a08] min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Project Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center px-4 py-8 border border-charcoal-200/60 dark:border-white/[0.06] hover:border-gold-500/40 dark:hover:border-gold-400/25 transition-colors duration-500 group"
              >
                <div className="font-heading text-2xl font-bold text-gold-400">{stat.number}</div>
                <div className="mt-1.5 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/40">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Results meta */}
          <div className="flex items-center justify-between mb-8 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/30">
            <span>
              {t("showing", { count: filtered.length })}{" "}
              {filtered.length === 1 ? t("project") : t("projects")}
            </span>
            <span className="hidden sm:block">{activeCat}</span>
          </div>

          {/* Gallery Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-charcoal-600 dark:text-white/40">{t("noProjects")}</p>
              <button
                onClick={() => setActiveCat(t("all"))}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 border border-charcoal-300 text-charcoal-700 dark:border-white/15 dark:text-white/70 text-xs font-medium tracking-wider uppercase rounded-full hover:border-gold-500/60 dark:hover:border-gold-400/50 hover:text-gold-600 dark:hover:text-gold-300 transition-colors duration-300 cursor-pointer"
              >
                {t("viewAllProjects")}
              </button>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              {filtered.map((item, i) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  index={i}
                  onClick={() => setZoomIndex(i)}
                />
              ))}
            </div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <p className="text-charcoal-600 dark:text-white/50 mb-7">{t("readyToStart")}</p>
            <Link
              href="/booking"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-sm font-medium tracking-wider uppercase rounded-full transition-[background-color] duration-300"
            >
              {t("bookConsultation")}
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Image Zoom */}
      <ImageZoom
        images={zoomImages}
        currentIndex={zoomIndex}
        isOpen={zoomIndex >= 0}
        onClose={() => setZoomIndex(-1)}
        onPrev={() => setZoomIndex((p) => (p > 0 ? p - 1 : zoomImages.length - 1))}
        onNext={() => setZoomIndex((p) => (p < zoomImages.length - 1 ? p + 1 : 0))}
      />
    </>
  );
}
