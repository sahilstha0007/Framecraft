"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from "framer-motion";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import LogoParticles from "./LogoParticles";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

// Scroll thresholds (px) for the morphing bar.
const SCROLLED_AT = 40; // pill starts shrinking + hairline fades in
const HIDE_AT = 320; // never tuck away near the top of the page

// Reserve each nav link's width for BOTH locales. Nepali labels are shorter
// than English in this font, so without this the whole bar shifts on switch.
const NAV_WIDTHS = [58, 54, 88, 82, 74];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const { user, loading, signOut } = useAuth();
  const { count, setOpen: setCartOpen } = useCart();

  // ── Scroll-aware morph ──
  // One rAF-backed motion value drives everything: the pill shrinks and the
  // gold hairline fills along its bottom edge once scrolled; scrolling down
  // past HIDE_AT tucks the bar away (closing the mobile menu with it) and
  // scrolling up slides it back in.
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  // Anchor for direction detection. Using the *previous frame's* scroll value
  // made the bar flip on every 1px jitter; a dead zone keeps it steady.
  const hideAnchor = useRef(0);

  // Stable handler so framer-motion subscribes once instead of re-subscribing
  // on every scrolled/hidden state flip (scrollY and the setters never change).
  const handleScroll = useCallback((y: number) => {
    // Hysteresis on the morph threshold: shrink at 60px, unshrink at 20px.
    setScrolled((was) => (was ? y > SCROLLED_AT - 20 : y > SCROLLED_AT + 20));

    if (y <= HIDE_AT) {
      setHidden(false);
      hideAnchor.current = y;
      return;
    }
    const delta = y - hideAnchor.current;
    // Only change direction after a real 8px move, then re-anchor.
    if (delta > 8) {
      setHidden(true);
      setIsOpen(false);
      hideAnchor.current = y;
    } else if (delta < -8) {
      setHidden(false);
      hideAnchor.current = y;
    }
  }, []);

  useMotionValueEvent(scrollY, "change", handleScroll);

  // Locale-aware nav items — labels come from translations, paths from the
  // (unchanged) route map so links work under /en and /ne automatically.
  const navLinks = [
    { name: t("home"), path: "/" },
    { name: t("shop"), path: "/shop" },
    { name: t("auctions"), path: "/shop?auction=1" },
    { name: t("sellers"), path: "/sellers" },
    { name: t("blog"), path: "/blog" },
  ];

  const cartButton = (
    <button
      onClick={() => setCartOpen(true)}
      className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal-600/70 dark:text-white/60 hover:text-gold-600 dark:hover:text-gold-400 transition-colors cursor-pointer"
      aria-label="Cart"
    >
      <ShoppingBag size={18} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-gold-500 text-[#0a0a08] text-[0.6rem] font-bold rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-full sm:max-w-7xl mx-auto px-2 sm:px-4 pt-3 sm:pt-4">
        {/* The whole bar (pill + mobile menu) shares one slide-out motion. */}
        <motion.div
          animate={{ y: hidden ? "-140%" : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
          // While tucked away the bar must leave the tab order + a11y tree,
          // not just ignore the mouse (pointer-events alone doesn't cover
          // keyboard focus on the translated-off-screen links).
          inert={hidden}
          className={`will-change-transform ${hidden ? "pointer-events-none" : ""}`}
        >
          {/* ── Glass pill ── */}
          <nav
            className={`
              relative w-full
              glass-nav
              ${scrolled ? "glass-nav-scrolled h-12 sm:h-14 rounded-xl" : "h-14 sm:h-16 rounded-2xl"}
              overflow-hidden
              transition-[height,border-radius,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
              pointer-events-auto
            `}
          >
            <div className="flex items-center justify-between h-full px-3 sm:px-5">
              {/* Logo — scales down slightly as the pill tightens */}
              <Link
                href="/"
                style={{ width: 170 }}
                className={`flex items-center group shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  scrolled ? "scale-[0.9]" : "scale-100"
                }`}
              >
                <LogoParticles />
              </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-0.5 min-w-0">
              {navLinks.map((link, i) => (
                <Link
                  key={link.path}
                  href={link.path}
                  style={{ width: NAV_WIDTHS[i] }}
                  className="relative inline-flex items-center px-1.5 xl:px-2 py-1.5 text-sm font-medium tracking-wide uppercase whitespace-nowrap
                    text-charcoal-600/70 dark:text-white/60
                    hover:text-gold-600 dark:hover:text-gold-400
                    transition-colors duration-200 group shrink-0"
                >
                  {link.name}
                  <span className="absolute -bottom-px left-3 right-3 h-0.5 scale-x-0 bg-gradient-to-r from-gold-500 to-gold-400 transition-transform duration-300 group-hover:scale-x-100 origin-center rounded-full" />
                </Link>
              ))}
              <div className="ml-1.5 xl:ml-2 flex items-center gap-1 xl:gap-1.5 shrink-0">
                <LanguageSwitcher />
                <ThemeToggle />
                <NotificationBell />
                {cartButton}
                {!loading && !user && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href="/login"
                      className="relative px-3 xl:px-3.5 py-2 text-sm font-medium tracking-wide uppercase whitespace-nowrap rounded-lg border border-charcoal-300/70 dark:border-white/15 text-charcoal-700 dark:text-white/70 hover:text-gold-600 dark:hover:text-gold-400 hover:border-gold-500/60 transition-all duration-200"
                    >
                      {ta("signIn")}
                    </Link>
                    <Link
                      href="/register"
                      className="relative px-3 xl:px-3.5 py-2 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-sm font-medium tracking-wide uppercase rounded-lg transition-all duration-200 whitespace-nowrap"
                    >
                      {ta("registerCta")}
                    </Link>
                  </div>
                )}
                {user && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Link
                      href="/account"
                      className="relative px-2.5 xl:px-3 py-2 text-sm font-medium tracking-wide uppercase whitespace-nowrap text-charcoal-600/70 dark:text-white/60 hover:text-gold-600 dark:hover:text-gold-400 transition-colors duration-200"
                    >
                      {ta("myRequests")}
                    </Link>
                    {user.role === "seller" && (
                      <Link
                        href="/dashboard"
                        className="relative px-2.5 xl:px-3 py-2 text-sm font-medium tracking-wide uppercase whitespace-nowrap text-charcoal-600/70 dark:text-white/60 hover:text-gold-600 dark:hover:text-gold-400 transition-colors duration-200"
                      >
                        {ta("myShop")}
                      </Link>
                    )}
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="relative px-2.5 xl:px-3 py-2 text-sm font-medium tracking-wide uppercase whitespace-nowrap text-charcoal-600/70 dark:text-white/60 hover:text-gold-600 dark:hover:text-gold-400 transition-colors duration-200"
                      >
                        {ta("admin")}
                      </Link>
                    )}
                    <button
                      onClick={signOut}
                      className="px-2.5 xl:px-3 py-2 text-sm font-medium tracking-wide uppercase whitespace-nowrap text-charcoal-500/70 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                    >
                      {ta("signOut")}
                    </button>
                  </div>
                )}
                <Link
                  href="/register"
                  className="relative px-3.5 xl:px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium tracking-wide uppercase rounded-lg transition-all duration-300 overflow-hidden group shrink-0 whitespace-nowrap"
                >
                  <span className="relative z-10">{t("sellArt")}</span>
                  <span className="absolute inset-0 bg-gradient-to-b from-gold-400 to-gold-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1.5 xl:hidden shrink-0">
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationBell />
              {cartButton}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-charcoal-600/70 dark:text-white/60 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
                aria-label={t("toggleMenu")}
              >
                {isOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
            </div>

            {/* ── Gold progress hairline: fills the pill's bottom edge ── */}
            <motion.span
              aria-hidden="true"
              style={{ scaleX: progress }}
              className={`absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-gold-600 via-gold-500 to-gold-300 transition-opacity duration-500 ${
                scrolled ? "opacity-100" : "opacity-0"
              }`}
            />
          </nav>

          {/* ── Mobile Menu Dropdown (glass panel) ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 glass-nav rounded-2xl pointer-events-auto origin-top max-h-[80dvh] overflow-y-auto overflow-x-hidden"
            >
              <div className="px-2 py-3 space-y-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 rounded-xl
                      text-charcoal-600/70 dark:text-white/60
                      hover:text-gold-600 dark:hover:text-gold-400
                      hover:bg-white/30 dark:hover:bg-white/[0.06]
                      transition-all duration-200
                      text-sm font-medium tracking-wider uppercase"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-3 px-4 space-y-2">
                  {!loading && !user && (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="block w-full py-2.5 px-5 border border-charcoal-200/60 dark:border-white/15 text-charcoal-700 dark:text-white/70 hover:border-gold-500/60 hover:text-gold-600 dark:hover:text-gold-400 text-center text-sm font-medium tracking-wider uppercase rounded-lg transition-all duration-200"
                      >
                        {ta("signIn")}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsOpen(false)}
                        className="block w-full py-2.5 px-5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 text-center text-sm font-medium tracking-wider uppercase rounded-lg transition-all duration-200"
                      >
                        {ta("registerCta")}
                      </Link>
                    </>
                  )}
                  {user && (
                    <div className="space-y-0.5">
                      <Link
                        href="/account"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2.5 rounded-xl text-charcoal-600/70 dark:text-white/60 text-sm font-medium tracking-wider uppercase"
                      >
                        {ta("myRequests")}
                      </Link>
                      {user.role === "seller" && (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-charcoal-600/70 dark:text-white/60 text-sm font-medium tracking-wider uppercase"
                        >
                          {ta("myShop")}
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="block px-4 py-2.5 rounded-xl text-charcoal-600/70 dark:text-white/60 text-sm font-medium tracking-wider uppercase"
                        >
                          {ta("admin")}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          signOut();
                        }}
                        className="block w-full px-4 py-2.5 rounded-xl text-charcoal-500/70 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 text-sm font-medium tracking-wider uppercase text-left"
                      >
                        {ta("signOut")}
                      </button>
                    </div>
                  )}
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full py-2.5 px-5 bg-gold-600 hover:bg-gold-700 text-white text-center text-sm font-medium tracking-wider uppercase rounded-lg transition-all duration-200"
                  >
                    {t("sellArt")}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
}
