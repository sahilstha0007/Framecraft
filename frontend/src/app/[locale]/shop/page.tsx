"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Gavel, ArrowUpDown, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import PageHeader from "@/components/PageHeader";
import ProductCard, { type ShopProduct } from "@/components/ProductCard";
import { useCollection } from "@/lib/useCollection";

/** Effective price: the current bid for auctions, list price otherwise. */
function effectivePrice(p: ShopProduct): number {
  return p.currentBid != null ? p.currentBid : p.price;
}

function ShopBrowser() {
  const t = useTranslations("shopPage");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initial state comes from the URL so filters survive navigation/sharing.
  const [activeCategory, setActiveCategory] = useState(
    // Default to the translated "all" so first load matches every product in
    // any locale (a literal "All" would never equal t("all") in Nepali).
    () => searchParams.get("category") ?? t("all")
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [auctionOnly, setAuctionOnly] = useState(() => searchParams.get("auction") === "1");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "");
  const [minPrice, setMinPrice] = useState(() => searchParams.get("min") ?? "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("max") ?? "");
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get("stock") === "1");

  // Live product list from the API (seeded with the studio's shop items).
  const { data: items } = useCollection<ShopProduct>("products", []);

  const categories = useMemo(
    () => [t("all"), ...Array.from(new Set(items.map((p) => p.category)))],
    [items, t]
  );

  // Debounced URL sync — filters are shareable and survive reloads.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const p = new URLSearchParams();
      if (activeCategory !== t("all")) p.set("category", activeCategory);
      if (searchQuery.trim()) p.set("q", searchQuery.trim());
      if (auctionOnly) p.set("auction", "1");
      if (sort) p.set("sort", sort);
      if (minPrice) p.set("min", minPrice);
      if (maxPrice) p.set("max", maxPrice);
      if (inStockOnly) p.set("stock", "1");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 400);
    return () => window.clearTimeout(id);
  }, [
    activeCategory,
    searchQuery,
    auctionOnly,
    sort,
    minPrice,
    maxPrice,
    inStockOnly,
    t,
    router,
    pathname,
  ]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    return items.filter((p) => {
      if (activeCategory !== t("all") && p.category !== activeCategory) return false;
      if (auctionOnly && !Boolean(p.auction)) return false;
      if (inStockOnly && !(Boolean(p.auction) || p.stock > 0)) return false;
      const price = effectivePrice(p);
      if (min != null && !Number.isNaN(min) && price < min) return false;
      if (max != null && !Number.isNaN(max) && price > max) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [items, activeCategory, auctionOnly, inStockOnly, minPrice, maxPrice, searchQuery, t]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "newest":
        list.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      case "price_asc":
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "price_desc":
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "most_bids":
        list.sort((a, b) => (b.bidCount ?? 0) - (a.bidCount ?? 0));
        break;
      case "ending_soon":
        list.sort((a, b) =>
          (a.endsAt ?? "9999").localeCompare(b.endsAt ?? "9999")
        );
        break;
      case "popular":
        list.sort(
          (a, b) =>
            Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
            (b.bidCount ?? 0) - (a.bidCount ?? 0)
        );
        break;
    }
    return list;
  }, [filtered, sort]);

  const resetAll = () => {
    setActiveCategory(t("all"));
    setSearchQuery("");
    setAuctionOnly(false);
    setSort("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
  };

  const hasFilters =
    activeCategory !== t("all") || auctionOnly || inStockOnly || sort || minPrice || maxPrice;

  const chipBase =
    "whitespace-nowrap px-4 py-2 text-[0.6rem] font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400";
  const chipIdle =
    "border border-charcoal-200 text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-400 dark:border-white/10 dark:text-white/50 dark:hover:text-white/80 dark:hover:border-white/20";
  const chipActive = "bg-gold-500 text-[#0a0a08]";

  const fieldClass =
    "w-full px-3 py-2 bg-charcoal-900/[0.03] border border-charcoal-200 text-sm text-charcoal-900 placeholder-charcoal-400 dark:bg-white/[0.03] dark:border-white/10 dark:text-white dark:placeholder-white/30 rounded-full focus:outline-none focus:border-gold-500/60 dark:focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30 transition-colors";

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
                  className={`${chipBase} ${
                    activeCategory === cat ? chipActive : chipIdle
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAuctionOnly((v) => !v)}
              aria-pressed={auctionOnly}
              className={`${chipBase} ${
                auctionOnly ? chipActive : chipIdle
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
                className={`${fieldClass} pl-10`}
              />
            </div>
          </div>

          {/* Second row: sort, price range, in-stock */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <label className="flex items-center gap-2 text-[0.6rem] font-mono tracking-[0.15em] uppercase text-charcoal-500 dark:text-white/40">
              <ArrowUpDown size={12} className="text-gold-400/70" />
              {t("sortLabel")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent border border-charcoal-200 dark:border-white/10 text-charcoal-800 dark:text-white/80 text-xs px-2 py-1.5 rounded-full focus:outline-none focus:border-gold-500/60 cursor-pointer"
              >
                <option value="">{t("sortDefault")}</option>
                <option value="newest">{t("sortNewest")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
                <option value="most_bids">{t("sortMostBids")}</option>
                <option value="ending_soon">{t("sortEndingSoon")}</option>
              </select>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder={t("minPrice")}
                aria-label={t("minPrice")}
                className={`${fieldClass} w-36`}
              />
              <span className="text-charcoal-400 dark:text-white/30 font-mono text-xs">—</span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={t("maxPrice")}
                aria-label={t("maxPrice")}
                className={`${fieldClass} w-36`}
              />
            </div>

            <button
              onClick={() => setInStockOnly((v) => !v)}
              aria-pressed={inStockOnly}
              className={`${chipBase} ${inStockOnly ? chipActive : chipIdle}`}
            >
              <BadgeCheck size={11} className="inline mr-1.5" /> {t("inStock")}
            </button>

            {hasFilters && (
              <button
                onClick={resetAll}
                className="text-[0.6rem] font-mono tracking-[0.15em] uppercase text-charcoal-500 hover:text-gold-600 dark:text-white/40 dark:hover:text-gold-300 transition-colors cursor-pointer"
              >
                {t("resetFilters")}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 sm:py-20 bg-cream-50 dark:bg-[#0a0a08] min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/30">
            <span>
              <SlidersHorizontal size={12} className="inline mr-2 text-gold-400/60" />
              {t("showing", { count: sorted.length })}{" "}
              {sorted.length === 1 ? t("item") : t("items")}
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
                {t("noProducts")}
              </h3>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-white/40">
                {t("noProductsBody")}
              </p>
              <button
                onClick={resetAll}
                className="mt-7 inline-flex items-center gap-2 px-6 py-3 border border-charcoal-300 text-charcoal-700 dark:border-white/15 dark:text-white/70 text-xs font-medium tracking-wider uppercase rounded-full hover:border-gold-500/60 dark:hover:border-gold-400/50 hover:text-gold-600 dark:hover:text-gold-300 transition-colors duration-300 cursor-pointer"
              >
                {t("resetFilters")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sorted.map((product, i) => (
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

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopBrowser />
    </Suspense>
  );
}
