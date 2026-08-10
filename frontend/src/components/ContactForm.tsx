"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ContactFormProps {
  variant?: "contact" | "quote";
}

export default function ContactForm({ variant = "contact" }: ContactFormProps) {
  const t = useTranslations("contactForm");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => setSubmitted(true), 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <CheckCircle size={48} className="mx-auto text-gold-500 mb-4" aria-hidden="true" />
        <h3 className="text-xl font-heading font-semibold text-charcoal-800 dark:text-cream-100">
          {variant === "contact" ? t("sentTitle") : t("sentQuoteTitle")}
        </h3>
        <p className="mt-2 text-charcoal-500 dark:text-cream-300">
          {variant === "contact" ? t("sentBody") : t("sentQuoteBody")}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
            {t("fullName")} *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-600 rounded-sm text-charcoal-800 dark:text-cream-100 placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-500 focus:border-transparent transition-[border-color,box-shadow]"
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
            {t("email")} *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            spellCheck={false}
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-600 rounded-sm text-charcoal-800 dark:text-cream-100 placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-500 focus:border-transparent transition-[border-color,box-shadow]"
            placeholder={t("emailPlaceholder")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
            {t("phone")}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-600 rounded-sm text-charcoal-800 dark:text-cream-100 placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-500 focus:border-transparent transition-[border-color,box-shadow]"
            placeholder={t("phonePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
            {t("subject")} *
          </label>
          <select
            id="subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-600 rounded-sm text-charcoal-800 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-500 focus:border-transparent transition-[border-color,box-shadow]"
          >
            <option value="">{t("subjectPlaceholder")}</option>
            <option value="framing">{t("subjectFraming")}</option>
            <option value="quote">{t("subjectQuote")}</option>
            <option value="consultation">{t("subjectConsultation")}</option>
            <option value="restoration">{t("subjectRestoration")}</option>
            <option value="corporate">{t("subjectCorporate")}</option>
            <option value="other">{t("subjectOther")}</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-charcoal-700 dark:text-cream-200 mb-1.5">
          {t("message")} *
        </label>          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-600 rounded-sm text-charcoal-800 dark:text-cream-100 placeholder-charcoal-400 dark:placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-500 focus:border-transparent transition-[border-color,box-shadow] resize-none"
            placeholder={t("messagePlaceholder")}
          />
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 font-medium tracking-wider uppercase text-sm transition-[background-color] duration-300 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-charcoal-800"
      >
        <Send size={16} aria-hidden="true" />
        {variant === "contact" ? t("sendMessage") : t("requestQuote")}
      </button>
    </form>
  );
}