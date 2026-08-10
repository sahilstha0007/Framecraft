"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Check, Gavel, Timer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import { formatNPR } from "@/lib/nepali";
import { useCart } from "@/lib/cart";

export interface ShopProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  featured: boolean;
  auction?: boolean;
  startingBid?: number | null;
  minIncrement?: number;
  endsAt?: string | null;
  currentBid?: number | null;
  bidCount?: number;
  status?: string;
  sellerId?: number | null;
}

export default function ProductCard({ product, index }: { product: ShopProduct; index: number }) {
  const t = useTranslations("shopPage");
  const locale = useLocale();
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const addToCart = () => {
    if (outOfStock) return;
    add({ productId: product.id, name: product.name, price: product.price, image: product.image });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08 }}
      className="group relative bg-charcoal-900/[0.02] border border-charcoal-200/60 dark:bg-white/[0.02] dark:border-white/[0.06] overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-gold-500/40 dark:hover:border-gold-400/30 hover:shadow-[0_0_40px_rgba(212,168,56,0.06)]"
    >
      {/* Image */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <NextImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {product.featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[0.55rem] font-mono tracking-[0.15em] uppercase text-[#0a0a08] bg-gold-500">
            ★ {t("featured")}
          </span>
        )}
        {product.auction ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-[0.55rem] font-mono tracking-[0.15em] uppercase text-gold-400 bg-[#0a0a08]/80 backdrop-blur inline-flex items-center gap-1">
            <Gavel size={10} /> {t("auction")}
          </span>
        ) : (
          outOfStock && (
            <span className="absolute top-3 right-3 px-2.5 py-1 text-[0.55rem] font-mono tracking-[0.15em] uppercase text-white bg-charcoal-800/80 backdrop-blur">
              {t("outOfStock")}
            </span>
          )
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <span className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-400/70">
          {product.category}
        </span>
        <h3 className="mt-1.5 text-lg font-heading font-semibold text-charcoal-900 dark:text-white leading-snug">
          {product.name}
        </h3>
        <p className="mt-1.5 text-xs text-charcoal-600 dark:text-white/45 leading-relaxed line-clamp-2">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          {product.auction ? (
            <div className="min-w-0">
              <span className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-charcoal-400 dark:text-white/30">
                {t("currentBid")}
              </span>
              <span className="block font-heading text-lg font-semibold text-gold-600 dark:text-gold-400">
                {formatNPR(product.currentBid ?? product.startingBid ?? 0, locale)}
              </span>
              <span className="flex items-center gap-1 text-[0.6rem] font-mono tracking-wider uppercase text-charcoal-500 dark:text-white/30">
                <Timer size={10} /> {product.bidCount ?? 0} {t("bids")}
              </span>
            </div>
          ) : (
            <>
              <span className="font-heading text-lg font-semibold text-gold-600 dark:text-gold-400">
                {formatNPR(product.price, locale)}
              </span>
              {!outOfStock && product.stock <= 3 && (
                <span className="text-[0.6rem] font-mono tracking-wider uppercase text-charcoal-500 dark:text-white/30">
                  {t("lowStock", { n: product.stock })}
                </span>
              )}
            </>
          )}
        </div>

        {product.auction ? (
          <Link
            href={`/products/${product.id}`}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors duration-300 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900"
          >
            <Gavel size={14} /> {t("viewBid")}
          </Link>
        ) : (
          <button
            onClick={addToCart}
            disabled={outOfStock}
            className={`mt-4 w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed ${
              added
                ? "bg-emerald-500 text-white"
                : outOfStock
                  ? "bg-charcoal-900/[0.04] dark:bg-white/[0.04] text-charcoal-400 dark:text-white/25"
                  : "bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900"
            }`}
          >
            {added ? (
              <>
                <Check size={14} /> {t("added")}
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> {outOfStock ? t("outOfStock") : t("addToCart")}
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
