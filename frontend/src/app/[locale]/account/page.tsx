"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Ruler,
  ShoppingBag,
  Gavel,
  Heart,
  Settings as SettingsIcon,
  Loader2,
  LogIn,
  UserRoundPlus,
  Store,
  CheckCircle2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { formatNPR } from "@/lib/nepali";
import PageHeader from "@/components/PageHeader";
import StatusBadge, { statusKey } from "@/components/StatusBadge";
import { useCart } from "@/lib/cart";

interface Booking {
  id: number;
  service: string;
  date: string;
  time: string | null;
  status: string;
  createdAt: string;
}

interface Quote {
  id: number;
  frameName: string;
  width: number;
  height: number;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
}

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface MyBid {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  productStatus: string;
  amount: number;
  currentBid: number | null;
  isWinning: boolean;
  createdAt: string;
}

interface SavedProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  auction: boolean;
  currentBid: number | null;
  status: string;
}

type Tab = "overview" | "orders" | "bids" | "saved" | "settings";

export default function AccountPage() {
  const t = useTranslations("account");
  const to = useTranslations("orders");
  const ta = useTranslations("auth");
  const ts = useTranslations("settings");
  const locale = useLocale();
  const { user, loading, refresh } = useAuth();
  const { add } = useCart();

  const [tab, setTab] = useState<Tab>("overview");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [bids, setBids] = useState<MyBid[] | null>(null);
  const [saved, setSaved] = useState<SavedProduct[] | null>(null);

  const [profile, setProfile] = useState({ name: "", bio: "", avatar: "", shopName: "", location: "", website: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name ?? "",
      bio: user.bio ?? "",
      avatar: user.avatar ?? "",
      shopName: user.shopName ?? "",
      location: user.location ?? "",
      website: user.website ?? "",
    });
  }, [user]);

  const load = useCallback(() => {
    if (!user) return;
    api.list<Booking>("/api/my/bookings").then(setBookings).catch(() => setBookings([]));
    api.list<Quote>("/api/my/quotes").then(setQuotes).catch(() => setQuotes([]));
    api.list<Order>("/api/my/orders").then(setOrders).catch(() => setOrders([]));
    api.list<MyBid>("/api/me/bids").then(setBids).catch(() => setBids([]));
    api.list<SavedProduct>("/api/me/likes").then(setSaved).catch(() => setSaved([]));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const label = (s: string) => t(statusKey(s));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.updateProfile({
        name: profile.name.trim(),
        bio: profile.bio,
        avatar: profile.avatar,
        shopName: profile.shopName,
        location: profile.location,
        website: profile.website,
      });
      await refresh();
      setProfileMsg(ts("saved"));
    } catch (err) {
      setProfileMsg(err instanceof ApiError ? err.message : ts("saveFailed"));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg(null);
    setPwError(null);
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "" });
      setPwMsg(ts("passwordChanged"));
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : ts("saveFailed"));
    } finally {
      setSavingPw(false);
    }
  };

  /* ── signed out ── */
  if (!loading && !user) {
    return (
      <>
        <PageHeader
          eyebrow={t("eyebrow")}
          title={
            <>
              {t("title")} <span className="italic text-gold-400">{t("titleAccent")}</span>
            </>
          }
          description={t("subtitle")}
          image="https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1920&q=85"
        />
        <section className="py-20 bg-cream-50 dark:bg-[#0a0a08]">
          <div className="max-w-md mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02] text-center"
            >
              <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
              <LogIn size={32} className="mx-auto text-gold-500 dark:text-gold-400" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-charcoal-900 dark:text-white">{t("signInPrompt")}</h2>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-white/45">{t("signInBody")}</p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-sm font-medium tracking-wider uppercase rounded-sm transition-colors">
                  <LogIn size={15} /> {ta("signInCta")}
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-charcoal-300 dark:border-white/15 text-charcoal-700 dark:text-cream-200 text-sm font-medium tracking-wider uppercase rounded-sm hover:border-gold-500/60 transition-colors">
                  <UserRoundPlus size={15} /> {ta("registerCta")}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

  if (loading || !bookings || !quotes || !orders || !bids || !saved) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <Loader2 size={22} className="animate-spin text-gold-400" />
      </section>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
    { id: "overview", label: t("tabOverview"), icon: CalendarDays },
    { id: "orders", label: to("ordersTitle"), icon: ShoppingBag },
    { id: "bids", label: t("tabBids"), icon: Gavel },
    { id: "saved", label: t("tabSaved"), icon: Heart },
    { id: "settings", label: t("tabSettings"), icon: SettingsIcon },
  ];

  const inputClass =
    "w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-400/30 transition-colors";
  const panelClass =
    "relative p-6 sm:p-8 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]";

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("title")} <span className="italic text-gold-400">{t("titleAccent")}</span>
          </>
        }
        description={t("subtitle")}
        image="https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1920&q=85"
      />

      <section className="py-12 sm:py-16 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-charcoal-600 dark:text-white/45">
              <span className="font-medium text-charcoal-800 dark:text-white/80">{user?.name}</span> · {user?.email}
              {user?.role === "seller" && (
                <span className="ml-2 px-2 py-0.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-[0.6rem] uppercase tracking-wider text-gold-600 dark:text-gold-400">
                  {t("vendorBadge")}
                </span>
              )}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {TABS.map(({ id, label: tabLabel, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 text-[0.65rem] tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer ${
                  tab === id
                    ? "bg-gold-500 text-[#0a0a08]"
                    : "border border-charcoal-200 text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-400 dark:border-white/10 dark:text-white/50 dark:hover:text-white/80 dark:hover:border-white/20"
                }`}
              >
                <Icon size={13} /> {tabLabel}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={panelClass}>
                <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
                <div className="flex items-center gap-2.5 mb-5">
                  <CalendarDays size={17} className="text-gold-400" />
                  <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{t("bookingsTitle")}</h2>
                </div>
                {bookings.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-charcoal-500 dark:text-white/35">{t("noBookings")}</p>
                    <Link href="/booking" className="mt-4 inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-gold-600 dark:text-gold-400 hover:underline">
                      {t("bookNow")}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div key={b.id} className="p-4 border border-charcoal-200/60 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-charcoal-800 dark:text-white/85 truncate">{b.service}</p>
                            <p className="mt-1 text-xs text-charcoal-500 dark:text-white/40">
                              {b.date}
                              {b.time ? ` · ${b.time}` : ""}
                            </p>
                          </div>
                          <StatusBadge status={b.status} label={label(b.status)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={panelClass}>
                <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
                <div className="flex items-center gap-2.5 mb-5">
                  <Ruler size={17} className="text-gold-400" />
                  <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{t("quotesTitle")}</h2>
                </div>
                {quotes.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-charcoal-500 dark:text-white/35">{t("noQuotes")}</p>
                    <Link href="/custom" className="mt-4 inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-gold-600 dark:text-gold-400 hover:underline">
                      {t("buildFrame")}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quotes.map((q) => (
                      <div key={q.id} className="p-4 border border-charcoal-200/60 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-charcoal-800 dark:text-white/85 truncate">{q.frameName}</p>
                            <p className="mt-1 text-xs text-charcoal-500 dark:text-white/40">
                              {q.width}″×{q.height}″ · ×{q.quantity}
                            </p>
                            <p className="mt-1 text-sm font-medium text-gold-600 dark:text-gold-400">{formatNPR(q.total, locale)}</p>
                          </div>
                          <StatusBadge status={q.status} label={label(q.status)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {tab === "orders" && (
            <div className={panelClass}>
              <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
              <div className="flex items-center gap-2.5 mb-5">
                <ShoppingBag size={17} className="text-gold-400" />
                <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{to("ordersTitle")}</h2>
              </div>
              {orders.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-charcoal-500 dark:text-white/35">{to("noOrders")}</p>
                  <Link href="/shop" className="mt-4 inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-gold-600 dark:text-gold-400 hover:underline">
                    {to("viewShop")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="p-4 border border-charcoal-200/60 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-sm text-charcoal-800 dark:text-white/85">{to("orderNumber", { id: o.id })}</p>
                            <span className={`px-2 py-0.5 rounded-full border text-[0.6rem] font-medium tracking-wide ${o.paymentStatus === "paid" ? "bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : "bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-500/30"}`}>
                              {o.paymentStatus === "paid" ? to("paymentPaid") : to("paymentPending")}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-charcoal-500 dark:text-white/40">
                            {to("placedAt", { date: new Date(o.createdAt).toLocaleDateString(locale) })} · {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-heading text-base font-semibold text-gold-600 dark:text-gold-400">{formatNPR(o.total, locale)}</span>
                          <StatusBadge status={o.status} label={label(o.status)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Bids ── */}
          {tab === "bids" && (
            <div className={panelClass}>
              <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
              <div className="flex items-center gap-2.5 mb-5">
                <Gavel size={17} className="text-gold-400" />
                <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{t("tabBids")}</h2>
              </div>
              {bids.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-charcoal-500 dark:text-white/35">{t("noBids")}</p>
                  <Link href="/shop?auction=1" className="mt-4 inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-gold-600 dark:text-gold-400 hover:underline">
                    {t("viewAuctions")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bids.map((b) => (
                    <Link key={b.id} href={`/products/${b.productId}`} className="block p-4 border border-charcoal-200/60 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] hover:border-gold-500/40 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="w-14 h-14 flex-shrink-0 overflow-hidden bg-charcoal-900/[0.03] dark:bg-white/[0.03]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.productImage} alt={b.productName} className="w-full h-full object-cover" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-charcoal-800 dark:text-white/85 truncate">{b.productName}</p>
                          <p className="mt-0.5 text-xs text-charcoal-500 dark:text-white/40">
                            {t("yourBid")}: <span className="font-medium text-gold-600 dark:text-gold-400">{formatNPR(b.amount, locale)}</span>
                            {b.isWinning && <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[0.55rem] uppercase tracking-wider rounded-full">{t("winning")}</span>}
                          </p>
                        </div>
                        <StatusBadge status={b.productStatus} label={label(b.productStatus)} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Saved ── */}
          {tab === "saved" && (
            <div className={panelClass}>
              <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
              <div className="flex items-center gap-2.5 mb-5">
                <Heart size={17} className="text-gold-400" />
                <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{t("tabSaved")}</h2>
              </div>
              {saved.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-charcoal-500 dark:text-white/35">{t("noSaved")}</p>
                  <Link href="/shop" className="mt-4 inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-gold-600 dark:text-gold-400 hover:underline">
                    {to("viewShop")}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {saved.map((p) => (
                    <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-3 p-3 border border-charcoal-200/60 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] hover:border-gold-500/40 transition-colors">
                      <span className="w-14 h-14 flex-shrink-0 overflow-hidden bg-charcoal-900/[0.03] dark:bg-white/[0.03]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-charcoal-800 dark:text-white/85 truncate">{p.name}</p>
                        <p className="text-xs text-gold-600 dark:text-gold-400">
                          {p.auction ? formatNPR(p.currentBid ?? 0, locale) : formatNPR(p.price, locale)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Settings ── */}
          {tab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile */}
              <form onSubmit={saveProfile} className={panelClass}>
                <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
                <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white mb-5">{ts("profileTitle")}</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="p-name" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("name")}</label>
                    <input id="p-name" type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="p-avatar" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("avatar")}</label>
                    <input id="p-avatar" type="text" value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} placeholder="https://…" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="p-location" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("location")}</label>
                    <input id="p-location" type="text" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="p-website" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("website")}</label>
                    <input id="p-website" type="text" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="p-bio" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("bio")}</label>
                    <textarea id="p-bio" rows={4} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className={`${inputClass} resize-none`} />
                  </div>
                  {user?.role === "seller" && (
                    <div>
                      <label htmlFor="p-shop" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("shopName")}</label>
                      <input id="p-shop" type="text" value={profile.shopName} onChange={(e) => setProfile({ ...profile, shopName: e.target.value })} className={inputClass} />
                    </div>
                  )}
                  {profileMsg && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{profileMsg}</p>
                  )}
                  <button type="submit" disabled={savingProfile} className="inline-flex items-center gap-2 px-5 py-2.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-50 text-white dark:text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors cursor-pointer">
                    {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {ts("save")}
                  </button>
                </div>
              </form>

              <div className="space-y-8">
                {/* Password */}
                <form onSubmit={changePassword} className={panelClass}>
                  <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
                  <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white mb-5">{ts("passwordTitle")}</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="pw-current" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("currentPassword")}</label>
                      <input id="pw-current" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="pw-new" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">{ts("newPassword")}</label>
                      <input id="pw-new" type="password" minLength={6} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={inputClass} />
                    </div>
                    {pwMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{pwMsg}</p>}
                    {pwError && <p className="text-xs text-red-600 dark:text-red-400">{pwError}</p>}
                    <button type="submit" disabled={savingPw || !pw.current || pw.next.length < 6} className="px-5 py-2.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-50 text-white dark:text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors cursor-pointer">
                      {savingPw ? <Loader2 size={14} className="animate-spin inline" /> : ts("updatePassword")}
                    </button>
                  </div>
                </form>

                {/* Become a seller */}
                {user?.role === "customer" && (
                  <div className={panelClass}>
                    <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
                    <div className="flex items-center gap-2.5 mb-3">
                      <Store size={17} className="text-gold-400" />
                      <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{ts("openShopTitle")}</h2>
                    </div>
                    <p className="text-sm text-charcoal-600 dark:text-white/45">{ts("openShopBody")}</p>
                    <Link
                      href="/register"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors"
                    >
                      <Store size={14} /> {ts("openShopCta")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
