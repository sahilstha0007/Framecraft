"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import FrameCorner from "./FrameCorner";

/* ── Branded preloader ─────────────────────────────────────────────────────
   A short, cinematic curtain before the hero: the FrameCraft wordmark
   reveals letter-by-letter inside a frame that draws itself, with a gold
   progress hairline below. Shows once per session (sessionStorage), then
   the whole panel glides up with a smooth ease to reveal the gallery.
   ──────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = "kalabazaar-preloader-seen";
const SHOW_MS = 1650; // how long the panel stays before the curtain lift
const LIFT_S = 0.9;   // curtain exit duration

// Flip to "done" before paint on the client (locale switches remount this
// component). useEffect would let one curtain frame flash on every switch.
const useBeforePaint = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Preloader() {
  const t = useTranslations("preloader");
  // Start as "show" so the curtain exists in the very first painted HTML.
  // "init" made the landing flash for a frame before hydration flipped it.
  const [stage, setStage] = useState<"show" | "exit" | "done">("show");

  useBeforePaint(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external store (sessionStorage) read on mount; guards the once-per-session intro
      setStage("done");
      return;
    }
    // Mark as seen immediately so the intro only plays once per session.
    sessionStorage.setItem(STORAGE_KEY, "1");
    setStage("show");
  }, []);

  // Lock scroll while the panel is up, free it the moment the curtain lifts.
  // Restored on unmount too, so a mid-exit unmount can never leave the page
  // frozen (the globals.css Lenis note warns against *permanent* overflow
  // locks — this one is short-lived and always released).
  useEffect(() => {
    if (stage === "show") {
      document.documentElement.style.overflow = "hidden";
    } else if (stage === "exit" || stage === "done") {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "show") return;
    const timer = setTimeout(() => setStage("exit"), SHOW_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const wordmark = "Kala Bazaar";

  return (
    <AnimatePresence onExitComplete={() => setStage("done")}>
      {/* Rendered only while SHOWING — when stage flips to "exit" the child
          unmounts, AnimatePresence runs the curtain exit, and only then does
          onExitComplete move us to "done". */}
      {stage === "show" && (
        <motion.div
          key="preloader"
          data-preloader
          aria-hidden="true"
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-cream-50 dark:bg-[#1a1512]"
          exit={{ y: "-100%" }}
          transition={{ duration: LIFT_S, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* Soft gold bloom */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 45% at 50% 45%, rgba(212,168,56,0.07) 0%, transparent 70%)",
            }}
          />

          {/* Wordmark held in a frame that draws its corners in */}
          <div className="relative px-10 py-9 sm:px-14 sm:py-11">
            {/* Four corners scale in from the edges */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <FrameCorner size={26} className="absolute top-0 left-0 text-gold-400" />
              <FrameCorner size={26} position="top-right" className="absolute top-0 right-0 text-gold-400" />
              <FrameCorner size={26} position="bottom-left" className="absolute bottom-0 left-0 text-gold-400" />
              <FrameCorner size={26} position="bottom-right" className="absolute bottom-0 right-0 text-gold-400" />
            </motion.div>

            {/* Letter-by-letter wordmark reveal */}
            <h1 className="flex font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-charcoal-900 dark:text-white">
              {wordmark.split("").map((char, i) => (
                <span key={i} className="inline-block overflow-hidden">
                  <motion.span
                    className="inline-block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.65,
                      delay: 0.15 + i * 0.055,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {char}
                  </motion.span>
                </span>
              ))}
              <span className="inline-block overflow-hidden ml-1">
                <motion.span
                  className="inline-block text-gold-500"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.65, delay: 0.15 + wordmark.length * 0.055, ease: [0.22, 1, 0.36, 1] }}
                >
                  .
                </motion.span>
              </span>
            </h1>

            {/* Caption */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="mt-4 text-center font-mono text-[0.7rem] tracking-[0.35em] uppercase text-gold-600 dark:text-gold-400"
            >
              {t("caption")}
            </motion.p>
          </div>

          {/* Progress hairline */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40 sm:w-56">
            <div className="h-px w-full bg-gold-400/15" />
            <motion.div
              className="h-px -mt-px bg-gradient-to-r from-gold-500/50 via-gold-400 to-gold-500/80"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: SHOW_MS / 1000, ease: "easeInOut" }}
              style={{ originX: 0 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
