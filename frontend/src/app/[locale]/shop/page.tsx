"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Gavel } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import ProductCard, { type ShopProduct } from "@/components/ProductCard";
import { useCollection } from "@/lib/useCollection";

export default function ShopPage() {
  const t = useTranslations("shopPage");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [auctionOnly, setAuctionOnly] = useState(false);

  // Live product list from the API (seeded with the studio's shop items).
  const { data: items } = useCollection<ShopProduct>("products", []);

  const categories = useMemo(
    () => [t("all"), ...Array.from(new Set(items.map((p) => p.category)))],
    [items, t]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((p) => {
      const matchesCategory = activeCategory === t("all") || p.category === activeCategory;
      const matchesAuction = !auctionOnly || Boolean(p.auction);
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesCategory && matchesAuction && matchesSearch;
    });
  }, [items, activeCategory, searchQuery, auctionOnly, t]);

  return (
    <>
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

            <button
              onClick={() => setAuctionOnly((v) => !v)}
              aria-pressed={auctionOnly}
              className={`whitespace-nowrap px-4 py-2 text-[0.6rem] font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer ${
                auctionOnly
                  ? "bg-gold-500 text-[#0a0a08]"
                  : "border border-charcoal-200 text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-400 dark:border-white/10 dark:text-white/50 dark:hover:text-white/80 dark:hover:border-white/20"
              }`}
            >
              <Gavel size={11} className="inline mr-1.5" /> {t("auctions")}
            </button>

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
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 sm:py-20 bg-cream-50 dark:bg-[#0a0a08] min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/30">
            <span>
              <SlidersHorizontal size={12} className="inline mr-2 text-gold-400/60" />
              {t("showing", { count: filtered.length })}{" "}
              {filtered.length === 1 ? t("item") : t("items")}
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

          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-charcoal-400 dark:text-white/25 mb-5">
                {t("noResults")}
              </div>
              <h3 className="text-2xl font-heading font-semibold text-charcoal-900 dark:text-white">
                {t("noProducts")}
              </h3>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-white/40">
                {t("noProductsBody")}
              </p>
              <button
                onClick={() => {
                  setActiveCategory(t("all"));
                  setSearchQuery("");
                  setAuctionOnly(false);
                }}
                className="mt-7 inline-flex items-center gap-2 px-6 py-3 border border-charcoal-300 text-charcoal-700 dark:border-white/15 dark:text-white/70 text-xs font-medium tracking-wider uppercase rounded-full hover:border-gold-500/60 dark:hover:border-gold-400/50 hover:text-gold-600 dark:hover:text-gold-300 transition-colors duration-300 cursor-pointer"
              >
                {t("resetFilters")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}

          <div className="mt-16 border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02] p-8 sm:p-10 text-center">
            <p className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-400 dark:text-white/30">
              {t("eyebrow")}
            </p>
            <h3 className="mt-2 font-heading text-xl sm:text-2xl font-semibold text-charcoal-900 dark:text-white">
              {t("customTitle")}
            </h3>
            <p className="mt-2 text-sm text-charcoal-600 dark:text-white/45 max-w-md mx-auto">
              {t("customBody")}
            </p>
            <Link
              href="/custom"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-xs font-medium tracking-wider uppercase rounded-sm transition-colors"
            >
              {t("buildCustom")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
