"use client";

import { useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { useCollection } from "@/lib/useCollection";

interface Seller {
  id: number;
  name: string;
  avatar: string | null;
  shopName: string | null;
  bio: string | null;
  location: string | null;
  productCount: number;
  followerCount: number;
}

export default function SellersPage() {
  const t = useTranslations("sellersPage");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sellers } = useCollection<Seller>("sellers", []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sellers.filter(
      (s) =>
        !q ||
        (s.shopName ?? s.name).toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.bio ?? "").toLowerCase().includes(q)
    );
  }, [sellers, searchQuery]);

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
        image="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&q=85"
      />

      <section className="py-16 sm:py-20 bg-cream-50 dark:bg-[#0a0a08] min-h-[50vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full lg:w-80 mb-10">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 dark:text-white/30 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 bg-charcoal-900/[0.03] border border-charcoal-200 text-sm text-charcoal-900 placeholder-charcoal-400 dark:bg-white/[0.03] dark:border-white/10 dark:text-white dark:placeholder-white/30 rounded-full focus:outline-none focus:border-gold-500/60 transition-colors"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <Store size={28} className="mx-auto text-charcoal-300 dark:text-white/20" />
              <h3 className="mt-4 text-xl font-heading font-semibold text-charcoal-900 dark:text-white">
                {t("noSellers")}
              </h3>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-white/40">{t("noSellersBody")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/sellers/${s.id}`}
                  className="group p-6 border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02] hover:border-gold-500/40 hover:shadow-[0_0_40px_rgba(212,168,56,0.05)] transition-all duration-500"
                >
                  <div className="flex items-center gap-4">
                    {s.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.avatar} alt={s.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-16 h-16 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                        <Store size={20} className="text-gold-500" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white truncate group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                        {s.shopName || s.name}
                      </h3>
                      <p className="text-xs text-charcoal-500 dark:text-white/40 truncate">
                        {s.name}
                        {s.location ? ` · ${s.location}` : ""}
                      </p>
                    </div>
                  </div>
                  {s.bio && (
                    <p className="mt-4 text-xs text-charcoal-600 dark:text-white/45 leading-relaxed line-clamp-3">
                      {s.bio}
                    </p>
                  )}
                  <div className="mt-5 flex items-center gap-5 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/35">
                    <span>
                      {s.productCount} {s.productCount === 1 ? t("product") : t("products")}
                    </span>
                    <span>
                      {s.followerCount} {s.followerCount === 1 ? t("follower") : t("followers")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
