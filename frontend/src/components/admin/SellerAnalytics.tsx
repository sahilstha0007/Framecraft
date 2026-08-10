"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Eye,
  Gavel,
  Loader2,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import NextImage from "next/image";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/nepali";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    orderCount: number;
    totalViews: number;
    totalBids: number;
    avgRating: number | null;
    reviewCount: number;
    activeProducts: number;
  };
  topProducts: {
    id: number;
    name: string;
    image: string;
    price: number;
    auction: boolean;
    bidCount: number;
    avgRating: number | null;
    reviewCount: number;
    views: number;
    revenue: number;
    units: number;
  }[];
  viewsByDay: { day: string; views: number }[];
  ordersByDay: { day: string; orders: number; revenue: number }[];
}

/** Fill a 14-day window so charts stay continuous even on quiet days. */
function fillWindow(entries: { day: string; value: number }[]): { day: string; value: number }[] {
  const byDay = new Map(entries.map((e) => [e.day, e.value]));
  const out: { day: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    out.push({ day: d, value: byDay.get(d) ?? 0 });
  }
  return out;
}

function MiniBars({ data, color }: { data: { day: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-[3px] h-24">
      {data.map((d) => (
        <div key={d.day} className="group relative flex-1 flex flex-col justify-end" title={`${d.day} · ${d.value}`}>
          <div
            className="w-full transition-[height] duration-500 group-hover:opacity-70"
            style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 6 : 2)}%`, backgroundColor: color }}
          />
        </div>
      ))}
    </div>
  );
}

export default function SellerAnalytics() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<"views" | "sales">("views");

  useEffect(() => {
    let alive = true;
    api
      .get<AnalyticsData>("/api/seller/analytics")
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

  const viewsSeries = useMemo(
    () => (data ? fillWindow(data.viewsByDay.map((v) => ({ day: v.day, value: v.views }))) : []),
    [data]
  );
  const salesSeries = useMemo(
    () => (data ? fillWindow(data.ordersByDay.map((o) => ({ day: o.day, value: o.orders }))) : []),
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

  const s = data.summary;
  const stats = [
    { label: t("statRevenue"), value: formatNPR(s.totalRevenue, locale), icon: Wallet },
    { label: t("statOrders"), value: String(s.orderCount), icon: ShoppingBag },
    { label: t("statViews"), value: String(s.totalViews), icon: Eye },
    { label: t("statBids"), value: String(s.totalBids), icon: Gavel },
  ];

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st) => (
          <div key={st.label} className="border border-charcoal-700/70 bg-charcoal-900/50 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60">
                {st.label}
              </span>
              <st.icon size={14} className="text-gold-400/70" />
            </div>
            <div className="mt-3 font-heading text-2xl font-semibold text-cream-100">{st.value}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats + trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border border-charcoal-700/70 bg-charcoal-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60">
              {t("statRating")}
            </span>
            <Star size={14} className="text-gold-400/70" />
          </div>
          <div className="mt-3 font-heading text-2xl font-semibold text-cream-100">
            {s.avgRating == null ? "—" : `${s.avgRating} / 5`}
          </div>
          <div className="mt-1 text-xs text-cream-500/60">
            {s.reviewCount} {t("statReviews")}
          </div>
        </div>
        <div className="border border-charcoal-700/70 bg-charcoal-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60">
              {t("statActiveProducts")}
            </span>
            <Boxes size={14} className="text-gold-400/70" />
          </div>
          <div className="mt-3 font-heading text-2xl font-semibold text-cream-100">{s.activeProducts}</div>
          <div className="mt-1 text-xs text-cream-500/60">{t("statSellable")}</div>
        </div>

        {/* 14-day trend */}
        <div className="border border-charcoal-700/70 bg-charcoal-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60">
              <TrendingUp size={13} className="text-gold-400/70" /> {t("statTrend")}
            </span>
            <div className="flex gap-1">
              {(["views", "sales"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTrend(mode)}
                  className={`px-2.5 py-1 text-[0.55rem] tracking-[0.15em] uppercase transition-colors cursor-pointer ${
                    trend === mode ? "bg-gold-500 text-charcoal-900" : "text-cream-500/60 hover:text-cream-200"
                  }`}
                >
                  {mode === "views" ? t("trendViews") : t("trendSales")}
                </button>
              ))}
            </div>
          </div>
          <MiniBars
            data={trend === "views" ? viewsSeries : salesSeries}
            color={trend === "views" ? "rgba(212,168,56,0.75)" : "rgba(110,231,183,0.7)"}
          />
          <div className="mt-2 flex justify-between font-mono text-[0.5rem] tracking-wider uppercase text-cream-500/40">
            <span>{viewsSeries[0]?.day.slice(5) ?? ""}</span>
            <span>{viewsSeries[viewsSeries.length - 1]?.day.slice(5) ?? ""}</span>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div>
        <h3 className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-cream-500/60 mb-4">
          {t("topProducts")}
        </h3>
        <div className="border border-charcoal-700/70 divide-y divide-charcoal-800">
          {data.topProducts.length === 0 && (
            <div className="p-6 text-sm text-cream-500/50">{t("noProductsYet")}</div>
          )}
          {data.topProducts.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-charcoal-900/40 transition-colors">
              <span className="font-mono text-[0.55rem] tracking-widest text-gold-400/60 w-7">
                No.{String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden bg-charcoal-800">
                <NextImage src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-cream-100 truncate">{p.name}</div>
                <div className="mt-0.5 flex items-center gap-3 font-mono text-[0.55rem] tracking-wider uppercase text-cream-500/50">
                  <span className="inline-flex items-center gap-1">
                    <Eye size={10} /> {p.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Gavel size={10} /> {p.bidCount}
                  </span>
                  {p.reviewCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Star size={10} /> {p.avgRating ?? "—"} ({p.reviewCount})
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-heading text-sm font-semibold text-gold-400">
                  {formatNPR(p.revenue, locale)}
                </div>
                <div className="font-mono text-[0.55rem] tracking-wider uppercase text-cream-500/50">
                  {p.units} {p.units === 1 ? t("unit") : t("units")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
