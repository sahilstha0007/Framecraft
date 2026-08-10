"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Newsletter() {
  const t = useTranslations("newsletter");
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <section className="py-28 bg-walnut-100 dark:bg-charcoal-800 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-300 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cream-50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Hairline frame echoing the studio's craft */}
        <div className="pointer-events-none absolute inset-0 border border-gold-300/15" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="px-4 sm:px-10 py-12"
        >
          <span className="font-mono-caption text-gold-700 dark:text-gold-300">
            {t("eyebrow")}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-mahogany-600 dark:text-cream-50">
            {t("title")}
          </h2>
          <p className="mt-3 text-mahogany-500/80 dark:text-cream-200/70 max-w-md mx-auto text-sm leading-relaxed">
            {t("body")}
          </p>

          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 flex items-center justify-center gap-3 text-gold-300"
              role="status"
            >
              <CheckCircle size={20} aria-hidden="true" />
              <span className="text-base">{t("onTheList")}</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                {t("emailLabel")}
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com…"
                autoComplete="email"
                spellCheck={false}
                required
                className="flex-1 px-4 py-3 bg-white/70 border border-walnut-300/60 text-mahogany-600 placeholder-mahogany-400/60 dark:bg-cream-50/10 dark:border-cream-50/20 dark:text-cream-50 dark:placeholder-cream-300/40 focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-gold-400/60 transition-[border-color,box-shadow] text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-medium tracking-wider uppercase text-xs transition-[background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-walnut-100 dark:focus-visible:ring-offset-charcoal-800"
              >
                <Send size={14} aria-hidden="true" />
                {t("subscribe")}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}