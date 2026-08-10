"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, UserRoundPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { emitAuthChanged } from "@/lib/auth";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "seller">("customer");
  const [shopName, setShopName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.register(
        name.trim(),
        email.trim(),
        password,
        role,
        role === "seller" ? shopName.trim() : undefined,
        role === "seller" ? bio.trim() : undefined
      );
      emitAuthChanged();
      router.push(role === "seller" ? "/dashboard" : "/account");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? t("emailExists")
          : (err as Error).message
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-600 rounded-sm text-charcoal-800 dark:text-cream-100 placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-500 focus:border-transparent transition-[border-color,box-shadow]";

  return (
    <section className="min-h-screen pt-32 pb-24 bg-cream-50 dark:bg-[#0a0a08] flex items-center">
      <div className="max-w-md mx-auto px-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative p-8 sm:p-10 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]"
        >
          <span
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
            aria-hidden="true"
          />
          <div className="w-12 h-12 bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mb-6">
            <UserRoundPlus size={20} className="text-gold-500 dark:text-gold-400" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-charcoal-900 dark:text-white">
            {t("registerTitle")}
          </h1>
          <p className="mt-2 text-sm text-charcoal-600 dark:text-white/45">{t("registerBody")}</p>

          {/* Role picker — open marketplace: join as a buyer or open your own shop.
              Stacks on small phones so the descriptions don't squeeze into
              ~135px cards. */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("customer")}
              aria-pressed={role === "customer"}
              className={`px-4 py-3 text-left border rounded-sm transition-all duration-200 cursor-pointer ${
                role === "customer"
                  ? "border-gold-500 bg-gold-500/10"
                  : "border-charcoal-200 dark:border-white/10 hover:border-gold-500/50"
              }`}
            >
              <span className="block text-sm font-medium text-charcoal-900 dark:text-white">
                {t("roleCustomer")}
              </span>
              <span className="mt-0.5 block text-[0.7rem] text-charcoal-500 dark:text-white/40">
                {t("roleCustomerDesc")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              aria-pressed={role === "seller"}
              className={`px-4 py-3 text-left border rounded-sm transition-all duration-200 cursor-pointer ${
                role === "seller"
                  ? "border-gold-500 bg-gold-500/10"
                  : "border-charcoal-200 dark:border-white/10 hover:border-gold-500/50"
              }`}
            >
              <span className="block text-sm font-medium text-charcoal-900 dark:text-white">
                {t("roleSeller")}
              </span>
              <span className="mt-0.5 block text-[0.7rem] text-charcoal-500 dark:text-white/40">
                {t("roleSellerDesc")}
              </span>
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                {t("name")} *
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className={inputClass}
              />
            </div>
            {role === "seller" && (
              <div>
                <label htmlFor="shopName" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                  {t("shopName")} *
                </label>
                <input
                  id="shopName"
                  type="text"
                  required={role === "seller"}
                  maxLength={80}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t("shopNamePlaceholder")}
                  className={inputClass}
                />
              </div>
            )}
            {role === "seller" && (
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                  {t("bio")}
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("bioPlaceholder")}
                  className={`${inputClass} resize-none`}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                {t("email")} *
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                {t("password")} *
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className={inputClass}
              />
            </div>

            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy || !name || !email || password.length < 6 || (role === "seller" && !shopName.trim())}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 font-medium tracking-wider uppercase text-sm transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <UserRoundPlus size={15} />}
              {t("registerCta")}
            </button>
          </form>

          <p className="mt-6 text-sm text-charcoal-600 dark:text-white/45">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-gold-600 dark:text-gold-400 hover:underline font-medium">
              {t("loginLink")}
            </Link>
          </p>
        </motion.div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-xs text-charcoal-500 dark:text-white/35 hover:text-gold-600 dark:hover:text-gold-400 transition-colors">
            {t("backHome")}
          </Link>
        </p>
      </div>
    </section>
  );
}
