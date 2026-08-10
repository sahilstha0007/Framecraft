"use client";

import { useCallback, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  LogOut,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { RESOURCES } from "@/lib/adminConfig";
import ResourceManager, { type Toast } from "@/components/admin/ResourceManager";
import SellerOrdersManager from "@/components/admin/SellerOrdersManager";
import SellerAnalytics from "@/components/admin/SellerAnalytics";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("auth");
  const { user, loading, signOut } = useAuth();

  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  const pushToast = useCallback((toast: Toast) => {
    setToast(toast);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

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
        <div className="w-full max-w-sm border border-charcoal-700 bg-charcoal-900/70 p-8 text-center">
          <Store size={24} className="mx-auto text-gold-400" />
          <p className="mt-4 text-sm text-cream-200">{t("signInPrompt")}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors"
          >
            {ta("signInCta")}
          </Link>
        </div>
      </div>
    );
  }

  if (user.role === "customer") {
    return (
      <div className="min-h-screen bg-[#0c0a08] flex items-center justify-center px-4">
        <div className="w-full max-w-sm border border-red-500/30 bg-charcoal-900/70 p-8 text-center">
          <AlertTriangle size={22} className="mx-auto text-red-400" />
          <p className="mt-4 text-sm text-cream-200">{t("notVendor")}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/register"
              className="px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors text-center"
            >
              {t("openShop")}
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-cream-400 hover:text-cream-100 transition-colors text-center"
            >
              {t("backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const productResource = RESOURCES.find((r) => r.slug === "seller-products")!;
  const postsResource = RESOURCES.find((r) => r.slug === "seller-posts")!;

  const tabs = [
    { id: "analytics", label: t("tabAnalytics") },
    { id: "products", label: t("tabProducts") },
    { id: "posts", label: t("tabPosts") },
    { id: "orders", label: t("tabOrders") },
  ];

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
              {user.shopName || user.name}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/sellers/${user.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-cream-400 hover:text-cream-100 transition-colors"
            >
              <Store size={13} /> {t("viewShop")}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-cream-400 hover:text-cream-100 transition-colors"
            >
              <ArrowLeft size={13} /> {t("backHome")}
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
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActive(i)}
            className={`whitespace-nowrap px-4 py-2 text-[0.65rem] tracking-[0.15em] uppercase transition-colors cursor-pointer ${
              active === i
                ? "bg-gold-500 text-charcoal-900"
                : "border border-charcoal-700 text-cream-400 hover:text-cream-100 hover:border-charcoal-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {active === 0 && <SellerAnalytics />}
        {active === 1 && <ResourceManager key="dp" resource={productResource} onToast={pushToast} />}
        {active === 2 && <ResourceManager key="posts" resource={postsResource} onToast={pushToast} />}
        {active === 3 && <SellerOrdersManager onToast={pushToast} />}
      </main>

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
