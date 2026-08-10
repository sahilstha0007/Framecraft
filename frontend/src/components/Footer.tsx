"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatBsYear } from "@/lib/nepali";

/* ── Inline brand marks (lucide-react dropped brand icons) ── */

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function PinterestIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");

  const navLinks = [
    { name: tn("home"), path: "/" },
    { name: tn("shop"), path: "/shop" },
    { name: tn("frames"), path: "/frames" },
    { name: tn("custom"), path: "/custom" },
    { name: tn("gallery"), path: "/gallery" },
    { name: tn("services"), path: "/services" },
    { name: tn("about"), path: "/about" },
    { name: tn("contact"), path: "/contact" },
  ];

  // All links, split so quick links shows the first 8.

  // Service names come from translations so the footer speaks the active locale.
  const servicesList = t.raw("serviceList") as string[];

  const socials = [
    { label: "Instagram", href: "#", icon: InstagramIcon, aria: t("instagram") },
    { label: "Facebook", href: "#", icon: FacebookIcon, aria: t("facebook") },
    { label: "Pinterest", href: "#", icon: PinterestIcon, aria: t("pinterest") },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative overflow-hidden bg-cream-50 dark:bg-charcoal-900 text-charcoal-700 dark:text-cream-300">
      {/* Newari lattice pattern — a quiet nod to Patan's woodworking heritage */}
      <svg
        className="absolute inset-0 w-full h-full text-gold-400 opacity-[0.045] pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="newari-lattice" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 22h44M22 0v44" stroke="currentColor" strokeWidth="0.75" fill="none" />
            <rect x="20" y="20" width="4" height="4" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#newari-lattice)" />
      </svg>

      {/* Maroon hairline — the crimson of the Nepali flag */}
      <div className="relative h-[3px] bg-gradient-to-r from-transparent via-[#9b1b30] to-transparent" aria-hidden="true" />

      {/* Top section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="text-2xl font-heading font-bold text-gold-400">
              FrameCraft
            </Link>
            <p className="mt-4 text-sm text-charcoal-500 dark:text-cream-400 leading-relaxed">
              {t("tagline")}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[0.65rem] font-mono tracking-[0.15em] uppercase text-charcoal-400 dark:text-cream-500">
              <span aria-hidden="true">🇳🇵</span>
              {t("handcraftedIn", { year: formatBsYear() })}
            </p>
            <div className="flex gap-3 mt-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.aria}
                  className="w-10 h-10 flex items-center justify-center border border-charcoal-200 dark:border-cream-700 hover:border-gold-500 text-charcoal-500 dark:text-cream-400 hover:text-gold-400 rounded-sm transition-all hover:bg-gold-500/10"
                >
                  <s.icon className="w-[15px] h-[15px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wider uppercase text-charcoal-800 dark:text-cream-100 mb-5">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-3">
              {navLinks.slice(0, 8).map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-charcoal-500 dark:text-cream-400 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-medium tracking-wider uppercase text-charcoal-800 dark:text-cream-100 mb-5">
              {t("services")}
            </h4>
            <ul className="space-y-3">
              {servicesList.map((service) => (
                <li key={service}>
                  <Link
                    href="/services"
                    className="text-sm text-charcoal-500 dark:text-cream-400 hover:text-gold-400 transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-medium tracking-wider uppercase text-charcoal-800 dark:text-cream-100 mb-5">
              {t("visitUs")}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 text-gold-500 flex-shrink-0" />
                <span className="text-sm text-charcoal-500 dark:text-cream-400 whitespace-pre-line">
                  {t("address")}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-gold-500 flex-shrink-0" />
                <span className="text-sm text-charcoal-500 dark:text-cream-400">+977 1-5531234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-gold-500 flex-shrink-0" />
                <span className="text-sm text-charcoal-500 dark:text-cream-400">hello@framecraft.com.np</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 text-gold-500 flex-shrink-0" />
                <div className="text-sm text-charcoal-500 dark:text-cream-400 whitespace-pre-line">
                  {t("hours")}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream-200 dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-charcoal-400 dark:text-cream-500">
            {t("rights", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6 text-xs text-charcoal-400 dark:text-cream-500">
            <Link href="/admin" className="hover:text-gold-400 transition-colors">{t("studioAdmin")}</Link>
            <a href="#" className="hover:text-gold-400 transition-colors">{t("privacy")}</a>
            <a href="#" className="hover:text-gold-400 transition-colors">{t("terms")}</a>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        onClick={scrollToTop}
        className="fixed bottom-24 right-8 z-40 w-12 h-12 bg-gold-500 hover:bg-gold-600 text-charcoal-900 rounded-sm flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        aria-label={t("scrollToTop")}
      >
        <ArrowUp size={20} />
      </motion.button>
    </footer>
  );
}
