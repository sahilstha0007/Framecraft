"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  LogIn,
  UserRoundPlus,
  MapPin,
  Phone,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { api, ApiError } from "@/lib/api";
import { formatNPR } from "@/lib/nepali";
import PageHeader from "@/components/PageHeader";

/** Backend PAYMENT_METHODS — display labels come from i18n `payment.items` (same order). */
const API_PAYMENT_METHODS = [
  "eSewa",
  "Khalti",
  "Fonepay",
  "Bank Transfer",
  "Cash on Delivery",
] as const;

interface PlacedOrder {
  id: number;
  paymentMethod: string;
  total: number;
}

interface GatewayCheckout {
  gateway: "khalti" | "esewa";
  redirectUrl?: string;
  formUrl?: string;
  fields?: Record<string, string>;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const t = useTranslations("checkout");
  const ta = useTranslations("auth");
  const tp = useTranslations("payment");
  const locale = useLocale();
  const { user, loading } = useAuth();
  const { items, subtotal, clear } = useCart();

  const paymentLabels = useMemo(() => tp.raw("items") as string[], [tp]);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [gateway, setGateway] = useState<GatewayCheckout | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const esewaFormRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();

  // Coming back from a gateway redirect: ?status=paid&order=ID
  const paidOrder = searchParams.get("status") === "paid" ? Number(searchParams.get("order")) : null;
  const failedOrder = searchParams.get("status") === "failed";

  // Submit the eSewa form the moment it renders.
  useEffect(() => {
    if (gateway?.gateway === "esewa" && esewaFormRef.current) {
      esewaFormRef.current.submit();
    }
  }, [gateway]);

  // Default selection is the first method for the active locale.
  const currentMethod = paymentMethod ?? paymentLabels[0] ?? "";

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setGatewayError(null);
    const methodIndex = Math.max(paymentLabels.indexOf(currentMethod), 0);
    const apiMethod = API_PAYMENT_METHODS[methodIndex] ?? "Cash on Delivery";
    try {
      const order = await api.create<PlacedOrder>("/api/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        address: address.trim(),
        phone: phone.trim() || undefined,
        paymentMethod: apiMethod,
        notes: notes.trim() || undefined,
      });
      setPlaced(order);
      clear();

      // Online gateways take over from here — no cart, no manual settlement.
      if (apiMethod === "Khalti" || apiMethod === "eSewa") {
        try {
          const gc = await api.create<GatewayCheckout>("/api/payments/checkout", {
            orderId: order.id,
          });
          setGateway(gc);
          if (gc.gateway === "khalti" && gc.redirectUrl) {
            window.location.href = gc.redirectUrl;
          }
        } catch (gatewayErr) {
          setGatewayError(
            gatewayErr instanceof ApiError ? gatewayErr.message : "Payment setup failed — pay at the studio instead."
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong placing your order."
      );
    } finally {
      setBusy(false);
    }
  };

  /* ── login gate ── */
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
          description={t("description")}
          image="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=85"
        />
        <section className="py-20 bg-cream-50 dark:bg-[#0a0a08]">
          <div className="max-w-md mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02] text-center"
            >
              <span
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                aria-hidden="true"
              />
              <LogIn size={32} className="mx-auto text-gold-500 dark:text-gold-400" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-charcoal-900 dark:text-white">
                {t("loginRequired")}
              </h2>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-white/45">{t("loginBody")}</p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-sm font-medium tracking-wider uppercase rounded-sm transition-colors"
                >
                  <LogIn size={15} /> {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-charcoal-300 dark:border-white/15 text-charcoal-700 dark:text-cream-200 text-sm font-medium tracking-wider uppercase rounded-sm hover:border-gold-500/60 transition-colors"
                >
                  <UserRoundPlus size={15} /> {t("createAccount")}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

  if (loading) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <Loader2 size={22} className="animate-spin text-gold-400" />
      </section>
    );
  }

  /* ── success state (returned from the gateway, or offline settlement) ── */
  if (placed || paidOrder) {
    const orderId = placed?.id ?? paidOrder;
    const total = placed?.total;
    const method = placed?.paymentMethod;
    return (
      <>
        <PageHeader
          eyebrow={t("successEyebrow")}
          title={
            <>
              {t("successTitle")} <span className="italic text-gold-400">{t("successTitleAccent")}</span>
            </>
          }
          description={placed ? t("successBody") : t("paidBody")}
          image="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=85"
        />
        <section className="py-20 bg-cream-50 dark:bg-[#0a0a08]">
          <div className="max-w-lg mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02] text-center"
            >
              <span
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                aria-hidden="true"
              />
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <div className="mt-5 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-400 dark:text-white/30">
                {t("orderId")}
              </div>
              <div className="mt-1 font-heading text-3xl font-semibold text-charcoal-900 dark:text-white">
                #{orderId}
              </div>
              {total !== undefined && (
                <p className="mt-3 text-lg font-heading font-semibold text-gold-600 dark:text-gold-400">
                  {formatNPR(total, locale)}
                </p>
              )}
              {placed && gateway && gateway.gateway === "esewa" && (
                <p className="mt-4 text-sm text-charcoal-600 dark:text-white/45">
                  {t("redirectingTo")} eSewa…
                </p>
              )}
              {placed && gatewayError && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">{gatewayError}</p>
              )}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/account"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-sm font-medium tracking-wider uppercase rounded-sm transition-colors"
                >
                  {t("viewOrders")}
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-charcoal-300 dark:border-white/15 text-charcoal-700 dark:text-cream-200 text-sm font-medium tracking-wider uppercase rounded-sm hover:border-gold-500/60 transition-colors"
                >
                  {t("continueShopping")}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* eSewa auto-submit form */}
        {gateway?.gateway === "esewa" && gateway.formUrl && gateway.fields && (
          <form ref={esewaFormRef} method="POST" action={gateway.formUrl}>
            {Object.entries(gateway.fields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
          </form>
        )}
      </>
    );
  }

  if (failedOrder) {
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
          image="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=85"
        />
        <section className="py-20 bg-cream-50 dark:bg-[#0a0a08]">
          <div className="max-w-md mx-auto px-4 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{t("paymentFailed")}</p>
            <Link
              href="/account"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-sm font-medium tracking-wider uppercase rounded-sm transition-colors"
            >
              {t("viewOrders")}
            </Link>
          </div>
        </section>
      </>
    );
  }

  /* ── empty cart ── */
  if (items.length === 0) {
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
          image="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=85"
        />
        <section className="py-20 bg-cream-50 dark:bg-[#0a0a08]">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-charcoal-400 dark:text-white/25">
              {t("empty")}
            </div>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-sm font-medium tracking-wider uppercase rounded-sm transition-colors"
            >
              {t("backToShop")}
            </Link>
          </div>
        </section>
      </>
    );
  }

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
        image="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=85"
      />

      <section className="py-14 sm:py-20 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left: details + payment */}
            <div className="lg:col-span-3 space-y-6">
              {/* Delivery details */}
              <div className="relative p-6 sm:p-8 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
                <span
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                  aria-hidden="true"
                />
                <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white mb-5">
                  {t("details")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="checkout-address" className="flex items-center gap-1.5 text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                      <MapPin size={12} className="text-gold-400" /> {t("address")}
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      required
                      minLength={5}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t("addressPlaceholder")}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-400/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className="flex items-center gap-1.5 text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                      <Phone size={12} className="text-gold-400" /> {t("phone")}
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("phonePlaceholder")}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-400/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-notes" className="block text-xs font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                      {t("notes")}
                    </label>
                    <textarea
                      id="checkout-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("notesPlaceholder")}
                      className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-400/30 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="relative p-6 sm:p-8 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
                <span
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2 mb-5">
                  <ShieldCheck size={16} className="text-gold-400" />
                  <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white">
                    {t("paymentMethod")}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentLabels.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPaymentMethod(label)}
                      aria-pressed={currentMethod === label}
                      className={`px-4 py-3 text-left text-sm border rounded-sm transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 ${
                        currentMethod === label
                          ? "border-gold-500 bg-gold-500/10 text-charcoal-900 dark:text-white"
                          : "border-charcoal-200 dark:border-white/10 text-charcoal-600 dark:text-white/50 hover:border-gold-500/50"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                            currentMethod === label
                              ? "border-gold-500 bg-gold-500"
                              : "border-charcoal-300 dark:border-white/25"
                          }`}
                        >
                          {currentMethod === label && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a08]" />
                          )}
                        </span>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: summary */}
            <div className="lg:col-span-2 lg:sticky lg:top-24">
              <div className="relative p-6 sm:p-8 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
                <span
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                  aria-hidden="true"
                />
                <h2 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white mb-5">
                  {t("summary")}
                </h2>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-gold-500/15 border border-gold-500/30 text-[0.65rem] font-mono text-gold-700 dark:text-gold-300">
                        ×{item.quantity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-charcoal-800 dark:text-white/80 truncate">
                          {item.name}
                        </p>
                        <p className="text-[0.65rem] text-charcoal-500 dark:text-white/35">
                          {formatNPR(item.price, locale)}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-charcoal-800 dark:text-white/80 whitespace-nowrap">
                        {formatNPR(item.price * item.quantity, locale)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-charcoal-200/60 dark:border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between text-sm text-charcoal-600 dark:text-white/50">
                    <span>{t("subtotal")}</span>
                    <span className="font-medium text-charcoal-800 dark:text-white/85">
                      {formatNPR(subtotal, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className="font-medium text-charcoal-900 dark:text-white">
                      {t("estimated")}
                    </span>
                    <span className="font-heading text-lg font-semibold text-gold-600 dark:text-gold-400">
                      {formatNPR(subtotal, locale)}
                    </span>
                  </div>
                  <p className="text-[0.65rem] text-charcoal-400 dark:text-white/25 leading-relaxed">
                    {t("pricingNote")}
                  </p>
                </div>

                {error && <p className="mt-4 text-xs text-red-600 dark:text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-60 text-white dark:text-charcoal-900 text-sm font-medium tracking-wider uppercase rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> {t("placing")}
                    </>
                  ) : (
                    t("placeOrder")
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
