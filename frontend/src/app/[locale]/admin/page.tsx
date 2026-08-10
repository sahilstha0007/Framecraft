"use client";

import { useCallback, useState } from "react";
import { KeyRound, Loader2, CheckCircle2, AlertTriangle, LogOut, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { emitAuthChanged, useAuth } from "@/lib/auth";
import { RESOURCES } from "@/lib/adminConfig";
import ResourceManager, { type Toast } from "@/components/admin/ResourceManager";
import BookingsManager from "@/components/admin/BookingsManager";
import QuotesManager from "@/components/admin/QuotesManager";
import OrdersManager from "@/components/admin/OrdersManager";
import SettingsManager from "@/components/admin/SettingsManager";
import UsersManager from "@/components/admin/UsersManager";

const MANAGER_TABS = [
  { id: "orders", titleKey: "tabsOrders" },
  { id: "shopOrders", titleKey: "tabsShopOrders" },
  { id: "quotes", titleKey: "tabsQuotes" },
  { id: "users", titleKey: "tabsUsers" },
  { id: "settings", titleKey: "tabsSettings" },
] as const;

export default function AdminPage() {
  const t = useTranslations("admin");
  const to = useTranslations("adminOrders");
  const ta = useTranslations("auth");
  const { user, loading, refresh, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  const pushToast = useCallback((toast: Toast) => {
    setToast(toast);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.login(email.trim(), password);
      if (user.role !== "admin") {
        setError(t("wrongRole"));
        await api.logout().catch(() => {});
        emitAuthChanged();
        return;
      }
      emitAuthChanged();
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401 ? ta("invalidCredentials") : (err as Error).message
      );
    } finally {
      setBusy(false);
    }
  };

  /* ── boot screen ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-gold-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center px-4">
        <div className="w-full max-w-sm border border-charcoal-700 bg-charcoal-900/70 p-8">
          <div className="w-12 h-12 bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mb-6">
            <KeyRound size={20} className="text-gold-400" />
          </div>
          <h1 className="font-heading text-2xl text-cream-100">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-cream-400/70">{t("loginSubtitle")}</p>

          <form onSubmit={login} className="mt-6 space-y-4">
            <div>
              <label htmlFor="seller-email" className="block text-xs text-cream-500/60 mb-1.5">
                {t("email")}
              </label>
              <input
                id="seller-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-charcoal-900 border border-charcoal-600 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="seller-password" className="block text-xs text-cream-500/60 mb-1.5">
                {t("password")}
              </label>
              <input
                id="seller-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-charcoal-900 border border-charcoal-600 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy || !email.trim() || !password}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : t("signIn")}
            </button>
          </form>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1.5 text-[0.65rem] text-cream-500/50 hover:text-cream-200 transition-colors"
          >
            <ArrowLeft size={11} /> {t("backToSite")}
          </Link>
        </div>
      </div>
    );
  }

  /* ── signed in but not an admin ── */
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center px-4">
        <div className="w-full max-w-sm border border-red-500/30 bg-charcoal-900/70 p-8 text-center">
          <AlertTriangle size={22} className="mx-auto text-red-400" />
          <p className="mt-4 text-sm text-cream-200">{t("wrongRole")}</p>
          <button
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors"
          >
            <LogOut size={13} /> {t("signOut")}
          </button>
        </div>
      </div>
    );
  }

  const allTabs = [
    ...RESOURCES.map((r) => ({ id: r.slug, label: r.title })),
    ...MANAGER_TABS.map((m) => ({ id: m.id, label: t(m.titleKey) })),
  ];
  const activeTab = allTabs[active];
  const isCatalogTab = active < RESOURCES.length;

  return (
    <div className="min-h-screen bg-[#0c0a08] text-cream-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-charcoal-800 bg-charcoal-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-heading text-xl text-cream-100">
              {t("brand")} <span className="text-gold-400">{t("brandSub")}</span>
            </div>
            <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-cream-500/60 mt-0.5">
              {t("manage")}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-cream-400 hover:text-cream-100 transition-colors"
            >
              <ArrowLeft size={13} /> {t("backToSite")}
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs text-cream-400 hover:text-cream-100 transition-colors cursor-pointer"
            >
              <LogOut size={14} /> {t("signOut")}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex gap-2 overflow-x-auto pb-1">
        {allTabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActive(i)}
            className={`whitespace-nowrap px-4 py-2 text-[0.65rem] tracking-[0.15em] uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
              active === i
                ? "bg-gold-500 text-charcoal-900"
                : "border border-charcoal-700 text-cream-400 hover:text-cream-100 hover:border-charcoal-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {isCatalogTab ? (
          <ResourceManager
            key={RESOURCES[active].slug}
            resource={RESOURCES[active]}
            onToast={pushToast}
          />
        ) : activeTab.id === "orders" ? (
          <div className="space-y-6">
            <SectionHead title={t("bookingsTitle")} desc={t("bookingsDesc")} />
            <BookingsManager onToast={pushToast} />
          </div>
        ) : activeTab.id === "shopOrders" ? (
          <div className="space-y-6">
            <SectionHead title={to("ordersTitle")} desc={to("ordersDesc")} />
            <OrdersManager onToast={pushToast} />
          </div>
        ) : activeTab.id === "quotes" ? (
          <div className="space-y-6">
            <SectionHead title={t("quotesTitle")} desc={t("quotesDesc")} />
            <QuotesManager onToast={pushToast} />
          </div>
        ) : activeTab.id === "users" ? (
          <div className="space-y-6">
            <SectionHead title={t("usersTitle")} desc={t("usersDesc")} />
            <UsersManager onToast={pushToast} />
          </div>
        ) : (
          <div className="space-y-6">
            <SectionHead title={t("settingsTitle")} desc={t("settingsDesc")} />
            <SettingsManager onToast={pushToast} />
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 border text-sm shadow-xl"
          style={{
            backgroundColor: toast.type === "ok" ? "#17251a" : "#2a1715",
            borderColor: toast.type === "ok" ? "rgba(212,168,56,0.4)" : "rgba(248,113,113,0.4)",
          }}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 size={16} className="text-gold-400 flex-shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          )}
          <span className="text-cream-100">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="font-heading text-2xl text-cream-100">{title}</h2>
      <p className="text-sm text-cream-400/70 mt-1 max-w-xl">{desc}</p>
    </div>
  );
}
