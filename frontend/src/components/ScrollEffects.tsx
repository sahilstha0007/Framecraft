"use client";

import { useRef, useState, useEffect, useMemo, type ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import { useTheme } from "next-themes";
import NextImage from "next/image";

/* ═══════════════════════════════════════════════════════
   MAGNETIC CARD
   Tilts toward the cursor AND responds to scroll position
   for a 3D hover + parallax hybrid effect.
   ═══════════════════════════════════════════════════════ */

/* ── Shared resize bus ───────────────────────────────────────────────
   Every MagneticCard previously registered its own window `resize`
   listener — a page with a dozen cards created a dozen listeners, all
   doing the same getBoundingClientRect work. One shared listener notifies
   a Set of registered cards instead. */
const resizeCallbacks = new Set<() => void>();
let resizeBound = false;

function measureBounds(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

function bindSharedResize() {
  if (resizeBound) return;
  resizeBound = true;
  window.addEventListener(
    "resize",
    () => {
      for (const cb of resizeCallbacks) cb();
    },
    { passive: true }
  );
}

interface MagneticCardProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  scrollTilt?: number;
}

export function MagneticCard({ children, className = "", strength = 8, scrollTilt = 3 }: MagneticCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scrollRotate = useTransform(scrollYProgress, [0, 0.5, 1], [scrollTilt, 0, -scrollTilt]);

  const [bounds, setBounds] = useState({ cx: 0, cy: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const smoothX = useSpring(x, { stiffness: 150, damping: 15 });
  const smoothY = useSpring(y, { stiffness: 150, damping: 15 });
  const smoothRotX = useSpring(rotateX, { stiffness: 100, damping: 20 });
  const smoothRotY = useSpring(rotateY, { stiffness: 100, damping: 20 });
  const smoothScrollRot = useSpring(scrollRotate, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBounds(measureBounds(el));
    update();
    resizeCallbacks.add(update);
    bindSharedResize();
    return () => {
      resizeCallbacks.delete(update);
    };
  }, []);

  const handleMouse = (e: React.MouseEvent) => {
    const dx = (e.clientX - bounds.cx) / bounds.cx || 0;
    const dy = (e.clientY - bounds.cy) / bounds.cy || 0;
    x.set(dx * strength);
    y.set(dy * strength);
    rotateY.set(dx * strength * 0.6);
    rotateX.set(-dy * strength * 0.6);
  };

  const handleLeave = () => {
    x.set(0); y.set(0); rotateX.set(0); rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{
        x: smoothX,
        y: smoothY,
        rotateX: smoothRotX,
        rotateY: smoothRotY,
        perspective: 800,
      }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCROLL WAVE GRID
   Items animate in a diagonal wave based on scroll
   position. Each cell's delay is derived from its
   row+col index, creating a ripple effect.
   ═══════════════════════════════════════════════════════ */

interface ScrollWaveProps {
  children: ReactNode[];
  className?: string;
  columns?: number;
}

export function ScrollWave({ children, className = "", columns = 3 }: ScrollWaveProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 30 });

  // Collapse below the desktop column count — the old inline
  // `repeat(N, 1fr)` grid forced e.g. 4 stat cards into ~90px cells on
  // phones. Wave timing still uses `columns`, only the layout collapses.
  const colsClass =
    columns === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-2 md:grid-cols-3";

  return (
    <div ref={ref} className={className}>
      <div className={`grid gap-6 ${colsClass}`}>
        {children.map((child, i) => {
          const row = Math.floor(i / columns);
          const col = i % columns;
          const waveDelay = (row + col) * 0.12 + row * 0.08;
          const inputRange = [waveDelay * 0.4, waveDelay * 0.4 + 0.25];
          const outputRange = [60, 0];
          const y = useTransform(progress, inputRange, outputRange);
          const opacity = useTransform(progress, inputRange, [0, 1]);
          const blur = useTransform(progress, inputRange, [8, 0]);
          // Reactive filter — `blur` is a MotionValue, so it must be bound
          // through a useMotionTemplate. Reading `blur.get()` here would
          // freeze the filter at its mount-time value (8px) forever, since
          // plain strings in `style` are never recomputed on scroll.
          const filterStyle = useMotionTemplate`blur(${blur}px)`;

          return (
            <motion.div key={i} style={{ y, opacity, filter: filterStyle }}>
              {child}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PERSPECTIVE REVEAL
   Section rotates from steep angle to flat as it
   scrolls into view. Creates a dramatic "opening" feel.
   ═══════════════════════════════════════════════════════ */

interface PerspectiveRevealProps {
  children: ReactNode;
  className?: string;
  startAngle?: number;
}

export function PerspectiveReveal({ children, className = "", startAngle = 70 }: PerspectiveRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 50, damping: 25 });

  // Resolve the reveal by ~50% of the section's scroll range so content is
  // clearly visible well before the section is centered — previously it stayed
  // at opacity 0 with a steep 70° tilt until 60% progress, which read as
  // "missing / not visible" while scrolling past.
  const rotateX = useTransform(smoothScroll, [0, 0.5], [startAngle, 0]);
  const y = useTransform(smoothScroll, [0, 0.5], [80, 0]);
  const opacity = useTransform(smoothScroll, [0, 0.12, 0.5], [0, 0.6, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, y, opacity, perspective: 1000, transformOrigin: "50% 0%" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   BLUR REVEAL IMAGE
   Image starts blurred + dark, snaps sharp on scroll.
   ═══════════════════════════════════════════════════════ */

interface BlurRevealProps {
  src: string;
  className?: string;
}

export function BlurReveal({ src, className = "" }: BlurRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 50, damping: 25 });

  const blur = useTransform(smooth, [0, 0.5], [12, 0]);
  const bright = useTransform(smooth, [0, 0.5], [0.3, 1]);
  const scale = useTransform(smooth, [0, 0.5], [1.2, 1]);
  const filterStyle = useMotionTemplate`brightness(${bright}) blur(${blur}px)`;

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        className="relative w-full h-full"
        style={{
          filter: filterStyle,
          scale,
        }}
      >
        <NextImage
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KINETIC HEADLINE
   Each character animates individually on scroll with
   staggered timing for a typographic performance.
   ═══════════════════════════════════════════════════════ */

interface KineticHeadlineProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span";
  stagger?: number;
}

export function KineticHeadline({ text, className = "", as: Tag = "h2", stagger = 0.03 }: KineticHeadlineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 40, damping: 30 });

  const chars = text.split("");

  return (
    <div ref={ref} className={`flex flex-wrap ${className}`}>
      {chars.map((char, i) => {
        const delay = i * stagger;
        const start = delay * 0.3;
        const end = start + 0.35;

        const y = useTransform(smooth, [start, end], [60, 0]);
        const opacity = useTransform(smooth, [start, end], [0, 1]);
        const rotX = useTransform(smooth, [start, end], [40, 0]);

        return (
          <motion.span
            key={i}
            style={{ y, opacity, rotateX: rotX, perspective: 600 }}
            className="inline-block"
          >
            {char === " " ? " " : char}
          </motion.span>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MORPH TRANSITION
   A section divider that uses SVG path morphing driven
   by scroll position. The wave between sections shifts.
   ═══════════════════════════════════════════════════════ */

interface MorphDividerProps {
  className?: string;
  color?: string;
  /** Color used in light mode when `color` is provided (theme-aware fallback). */
  lightColor?: string;
}

export function MorphDivider({ className = "", color, lightColor }: MorphDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const d = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [
      "M0,32 C160,64 320,0 480,32 C640,64 800,0 960,32 L960,0 L0,0 Z",
      "M0,48 C160,16 320,80 480,48 C640,16 800,80 960,48 L960,0 L0,0 Z",
      "M0,32 C160,0 320,64 480,32 C640,0 800,64 960,32 L960,0 L0,0 Z",
    ]
  );

  return (
    <div ref={ref} className={`h-24 -mb-1 ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 960 64" preserveAspectRatio="none">
        <motion.path
          fill={color}
          d={d}
          className={
            !color
              ? "fill-cream-150 dark:fill-zinc-950"
              : lightColor
                ? "fill-[var(--morph-light)] dark:fill-[var(--morph-dark)]"
                : undefined
          }
          style={color && lightColor ? ({ "--morph-light": lightColor, "--morph-dark": color } as React.CSSProperties) : undefined}
        />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCROLL GRADIENT
   Background smoothly shifts through a color palette
   as the user scrolls through the section.
   ═══════════════════════════════════════════════════════ */

interface ScrollGradientProps {
  children: ReactNode;
  className?: string;
  /** Dark-mode palette (default). */
  colors?: string[];
  /** Light-mode palette — used instead of `colors` when the site is in light mode. */
  lightColors?: string[];
}

export function ScrollGradient({
  children,
  className = "",
  colors = ["#000000", "#1a1a2e", "#16213e", "#0f3460", "#000000"],
  lightColors,
}: ScrollGradientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Hydration-safe theme detection: next-themes only exposes `resolvedTheme`
  // after mount, so the server render and the first client render agree (both
  // default to the dark `colors` palette), then this flips once mounted.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const activeColors = lightColors && !isDark ? lightColors : colors;

  const steps = activeColors.length - 1;
  const stops = useMemo(() => Array.from({ length: steps + 1 }, (_, i) => i / steps), [steps]);
  const bg = useTransform(scrollYProgress, stops, activeColors);

  return (
    <motion.div ref={ref} style={{ backgroundColor: bg }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SPLIT DRIFT
   Two columns that scroll at different speeds,
   creating an independent parallax narrative.
   ═══════════════════════════════════════════════════════ */

interface SplitDriftProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftSpeed?: number;
  rightSpeed?: number;
}

export function SplitDrift({ left, right, className = "", leftSpeed = 0.2, rightSpeed = 0.4 }: SplitDriftProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const lY = useTransform(scrollYProgress, [0, 1], [leftSpeed * 150, leftSpeed * -150]);
  const rY = useTransform(scrollYProgress, [0, 1], [rightSpeed * -120, rightSpeed * 120]);

  return (
    <div ref={ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${className}`}>
      <motion.div style={{ y: lY }}>{left}</motion.div>
      <motion.div style={{ y: rY }}>{right}</motion.div>
    </div>
  );
}