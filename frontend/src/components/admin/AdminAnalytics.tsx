"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Eye,
  Gavel,
  Loader2,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/nepali";

interface AdminAnalyticsData {
  kpis: {
    userCount: number;
    customerCount: number;
    sellerCount: number;
    productCount: number;
    activeAuctions: number;
    totalBids: number;
    totalReviews: number;
    orderCount: number;
    totalRevenue: number;
    views14d: number;
  };
  revenueByDay: { day: string; revenue: number }[];
  topSellers: { id: number; name: string; shopName: string | null; orders: number; revenue: number }[];
  categories: { category: string; products: number; revenue: number }[];
  orderStatuses: { status: string; count: number }[];
}

function RevenueBars({ data }: { data: { day: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-[3px] h-28">
      {data.map((d) => (
        <div
          key={d.day}
          className="group relative flex-1 flex flex-col justify-end"
          title={`${d.day} · ${formatNPR(d.revenue, "en")}`}
        >
          <div
            className="w-full transition-[height] duration-500 group-hover:opacity-70"
            style={{
              height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 6 : 2)}%`,
              backgroundColor: "rgba(212,168,56,0.75)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<AdminAnalyticsData>("/api/admin/analytics")
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load analytics");
      });
    return () => {
      alive = false;
    };
  }, []);

  const maxCategoryRevenue = useMemo(
    () => Math.max(...(data?.categories.map((c) => c.revenue) ?? []), 1),
    [data]
  );

  if (error) {
    return (
      <div className="border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-300">{error}</div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-gold-400" />
      </div>
    );
  }

  const k = data.kpis;
  const cards = [
    { label: t("anRevenue"), value: formatNPR(k.totalRevenue, locale), icon: Wallet },
    { label: t("anOrders"), value: String(k.orderCount), icon: ShoppingBag },
    { label: t("anUsers"), value: String(k.userCount), icon: Users },
    { label: t("anSellers"), value: String(k.sellerCount), icon: Store },
    { label: t("anProducts"), value: String(k.productCount), icon: Boxes },
    { label: t("anAuctions"), value: String(k.activeAuctions), icon: Gavel },
    { label: t("anBids"), value: String(k.totalBids), icon: Gavel },
    { label: t("anReviews"), value: String(k.totalReviews), icon: Star },
    { label: t("anViews"), value: String(k.views14d), icon: Eye },
  ];

  const statusTotal = data.orderStatuses.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-charcoal-700/70 bg-charcoal-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.5rem] tracking-[0.2em] uppercase text-cream-500/60">
                {c.label}
              </span>
              <c.icon size={13} className="text-gold-400/70" />
            </div>
            <div className="mt-2 font-heading text-xl font-semibold text-cream-100">{c.value}</div>
          </div>
        ))}
      </div>

      {/* 30-day revenue */}
      <div className="border border-charcoal-700/70 bg-charcoal-900/50 p-5">
        <div className="flex items-center gap-1.5 mb-4 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60">
          <TrendingUp size={13} className="text-gold-400/70" /> {t("anRevenueTrend")}
        </div>
        <RevenueBars data={data.revenueByDay} />
        <div className="mt-2 flex justify-between font-mono text-[0.5rem] tracking-wider uppercase text-cream-500/40">
          <span>{data.revenueByDay[0]?.day ?? ""}</span>
          <span>{data.revenueByDay[data.revenueByDay.length - 1]?.day ?? ""}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top sellers */}
        <div>
          <h3 className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60 mb-3">
            {t("anTopSellers")}
          </h3>
          <div className="border border-charcoal-700/70 divide-y divide-charcoal-800">
            {data.topSellers.length === 0 && (
              <div className="p-5 text-sm text-cream-500/50">{t("anNoSales")}</div>
            )}
            {data.topSellers.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-4">
                <span className="font-mono text-[0.55rem] tracking-widest text-gold-400/60 w-7">
                  No.{String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-cream-100 truncate">{s.shopName || s.name}</div>
                  <div className="mt-0.5 text-[0.6rem] text-cream-500/50">
                    {s.orders} {s.orders === 1 ? t("anOrder") : t("anOrders")}
                  </div>
                </div>
                <div className="font-heading text-sm font-semibold text-gold-400">
                  {formatNPR(s.revenue, locale)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div>
          <h3 className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60 mb-3">
            {t("anCategories")}
          </h3>
          <div className="border border-charcoal-700/70 divide-y divide-charcoal-800">
            {data.categories.map((c) => (
              <div key={c.category} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-cream-100 truncate">{c.category}</span>
                  <span className="text-xs text-gold-400 whitespace-nowrap">
                    {formatNPR(c.revenue, locale)} · {c.products}{" "}
                    {c.products === 1 ? t("anProduct") : t("anProducts")}
                  </span>
                </div>
                <div className="mt-2 h-1 bg-charcoal-800 overflow-hidden">
                  <div
                    className="h-full bg-gold-500/70 transition-[width] duration-700"
                    style={{ width: `${(c.revenue / maxCategoryRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order statuses */}
      <div>
        <h3 className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60 mb-3">
          {t("anOrderStatuses")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.orderStatuses.map((s) => (
            <div key={s.status} className="border border-charcoal-700/70 bg-charcoal-900/50 p-4">
              <div className="font-heading text-xl font-semibold text-cream-100">{s.count}</div>
              <div className="mt-1 font-mono text-[0.5rem] tracking-[0.2em] uppercase text-cream-500/60 truncate">
                {s.status}
              </div>
              <div className="mt-2 h-1 bg-charcoal-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60 transition-[width] duration-700"
                  style={{ width: `${(s.count / statusTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
