"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { emitAuthChanged } from "@/lib/auth";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(email.trim(), password);
      emitAuthChanged();
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? t("invalidCredentials")
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
            <UserRound size={20} className="text-gold-500 dark:text-gold-400" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-charcoal-900 dark:text-white">
            {t("loginTitle")}
          </h1>
          <p className="mt-2 text-sm text-charcoal-600 dark:text-white/45">{t("loginBody")}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
                {t("email")}
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
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className={inputClass}
              />
            </div>

            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy || !email || !password}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 font-medium tracking-wider uppercase text-sm transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              {t("signInCta")}
            </button>
          </form>

          <p className="mt-6 text-sm text-charcoal-600 dark:text-white/45">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-gold-600 dark:text-gold-400 hover:underline font-medium">
              {t("registerLink")}
            </Link>
          </p>
          <p className="mt-2 text-xs text-charcoal-500 dark:text-white/30">{t("guestNote")}</p>
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
