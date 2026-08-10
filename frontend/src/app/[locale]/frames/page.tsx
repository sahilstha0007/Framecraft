"use client";

import { useState } from "react";
import { frames } from "@/lib/data";
import type { Frame } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import { useTranslations } from "next-intl";
import FrameCard from "@/components/FrameCard";
import ImageZoom from "@/components/ImageZoom";
import PageHeader from "@/components/PageHeader";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function FramesPage() {
  const t = useTranslations("framesPage");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("");
  const [zoomIndex, setZoomIndex] = useState(-1);

  // Live collection from the API — falls back to the bundled catalog.
  const { data: items } = useLocalizedCollection<Frame>("frames", frames);

  // Category chips derived from the (localized) frames so they always match.
  const categories = [t("all"), ...Array.from(new Set(items.map((f) => f.category)))];

  const filtered = items.filter((frame) => {
    const matchesCategory = activeCategory === t("all") || frame.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      frame.name.toLowerCase().includes(q) ||
      frame.material.toLowerCase().includes(q) ||
      frame.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name);
    if (sort === "name_desc") return b.name.localeCompare(a.name);
    if (sort === "popular") return Number(Boolean(b.popular)) - Number(Boolean(a.popular));
    return Number(a.id) - Number(b.id);
  });

  const zoomImages = filtered.map((f) => ({ image: f.image, title: f.name }));

  return (
    <>
      {/* Page Header */}
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("title")} <span className="italic text-gold-400">{t("titleAccent")}</span>
          </>
        }
        description={t("description")}
      />

      {/* Filters */}
      <section className="sticky top-20 z-30 border-b border-charcoal-200/60 dark:border-white/[0.06] bg-cream-50/85 dark:bg-[#0a0a08]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 text-[0.6rem] font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
                    activeCategory === cat
                      ? "bg-gold-500 text-[#0a0a08]"
                      : "border border-charcoal-200 text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-400 dark:border-white/10 dark:text-white/50 dark:hover:text-white/80 dark:hover:border-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-64 flex-shrink-0">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 dark:text-white/30 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900/[0.03] border border-charcoal-200 text-sm text-charcoal-900 placeholder-charcoal-400 dark:bg-white/[0.03] dark:border-white/10 dark:text-white dark:placeholder-white/30 rounded-full focus:outline-none focus:border-gold-500/60 dark:focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30 transition-colors"
              />
            </div>

            <label className="flex items-center gap-2 text-[0.6rem] font-mono tracking-[0.15em] uppercase text-charcoal-500 dark:text-white/40 flex-shrink-0">
              <ArrowUpDown size={12} className="text-gold-400/70" />
              {t("sortLabel")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent border border-charcoal-200 dark:border-white/10 text-charcoal-800 dark:text-white/80 text-xs px-2 py-1.5 rounded-full focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="">{t("sortDefault")}</option>
                <option value="name_asc">{t("sortNameAsc")}</option>
                <option value="name_desc">{t("sortNameDesc")}</option>
                <option value="popular">{t("sortPopular")}</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Frame Grid */}
      <section className="py-16 sm:py-20 bg-cream-50 dark:bg-[#0a0a08] min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-10 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/30">
            <span>
              <SlidersHorizontal size={12} className="inline mr-2 text-gold-400/60" />
              {t("showing", { count: sorted.length })}{" "}
              {sorted.length === 1 ? t("profile") : t("profiles")}
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-charcoal-500 hover:text-gold-600 dark:text-white/40 dark:hover:text-gold-300 transition-colors cursor-pointer"
              >
                {t("clearSearch")}
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-24">
              <div className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-charcoal-400 dark:text-white/25 mb-5">
                {t("noResults")}
              </div>
              <h3 className="text-2xl font-heading font-semibold text-charcoal-900 dark:text-white">
                {t("noFrames")}
              </h3>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-white/40">
                {t("noFramesBody")}
              </p>
              <button
                onClick={() => {
                  setActiveCategory(t("all"));
                  setSearchQuery("");
                }}
                className="mt-7 inline-flex items-center gap-2 px-6 py-3 border border-charcoal-300 text-charcoal-700 dark:border-white/15 dark:text-white/70 text-xs font-medium tracking-wider uppercase rounded-full hover:border-gold-500/60 dark:hover:border-gold-400/50 hover:text-gold-600 dark:hover:text-gold-300 transition-colors duration-300 cursor-pointer"
              >
                {t("resetFilters")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sorted.map((frame, i) => (
                <div key={frame.id} id={`frame-${frame.id}`} className="scroll-mt-40">
                  <FrameCard
                    frame={frame}
                    index={i}
                    onClick={() => setZoomIndex(i)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
