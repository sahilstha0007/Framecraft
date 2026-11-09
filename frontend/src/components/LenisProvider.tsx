"use client";

import { useEffect, useSyncExternalStore, createContext, useContext, type ReactNode } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

/* The Lenis instance is created once on mount and never changes afterwards.
   A tiny external store makes it a proper snapshot for useSyncExternalStore —
   no ref reads during render, and no setState-in-effect. Consumers receive
   null until the effect below mounts Lenis, which is what they already handled. */
let lenisInstance: Lenis | null = null;
const lenisListeners = new Set<() => void>();

function setLenisInstance(instance: Lenis | null) {
  lenisInstance = instance;
  for (const l of lenisListeners) l();
}

function subscribeLenis(cb: () => void) {
  lenisListeners.add(cb);
  return () => {
    lenisListeners.delete(cb);
  };
}

function useLenisSnapshot() {
  return useSyncExternalStore(subscribeLenis, () => lenisInstance, () => null);
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  const lenis = useLenisSnapshot();

  useEffect(() => {
    // Users who opt out of motion get native scrolling — Lenis stays mounted
    // (context consumers like anchor helpers still work) but with smoothing
    // fully disabled, which is equivalent to no Lenis at all.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const instance = new Lenis({
      duration: 1.6,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      // Smooth only wheel input — touch/native fallback stays browser-driven
      // so mobile scrolling never fights the page.
      smoothWheel: !prefersReducedMotion,
      // Touch smoothing is also motion — leave it native for reduced-motion users.
      syncTouch: !prefersReducedMotion,
      touchMultiplier: 1.35,
      wheelMultiplier: 0.9,
      // Intercept in-page anchor links (#id) and glide to them.
      anchors: true,
    });

    setLenisInstance(instance);
    document.documentElement.classList.add("lenis");

    function raf(time: number) {
      instance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      document.documentElement.classList.remove("lenis");
      setLenisInstance(null);
      instance.destroy();
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
