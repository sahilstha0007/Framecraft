"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useTranslations } from "next-intl";
import NextImage from "next/image";

/* ═══════════════════════════════════════════════════
   MULTI-LAYER DEPTH PARALLAX
   Three layers (bg / mid / fg) each moving at a
   different speed to create genuine depth.
   ═══════════════════════════════════════════════════ */

interface DepthParallaxProps {
  bgImage?: string;
  bgSpeed?: number;    // 0.0 – 1.0, lower = slower
  midSpeed?: number;
  fgSpeed?: number;
  bgChildren?: ReactNode;
  midChildren?: ReactNode;
  fgChildren?: ReactNode;
  className?: string;
  height?: string;
}

export function DepthParallax({
  bgImage,
  bgSpeed = 0.15,
  midSpeed = 0.35,
  fgSpeed = 0.55,
  bgChildren,
  midChildren,
  fgChildren,
  className = "",
  height = "h-screen",
}: DepthParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const midY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const fgY = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.6, 1, 1, 0.6]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${height} ${className}`}>
      {/* Background layer — slowest */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: bgY }}
      >
        {bgImage && (
          <NextImage
            src={bgImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover scale-110"
          />
        )}
        {bgChildren}
      </motion.div>

      {/* Midground layer */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: midY }}
      >
        {midChildren}
      </motion.div>

      {/* Foreground layer — fastest */}
      <motion.div
        className="relative z-10 h-full will-change-transform"
        style={{ y: fgY, opacity }}
      >
        {fgChildren}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DRIFT LAYER
   A single layer that moves on a chosen axis as the
   user scrolls. Use anywhere for subtle movement.
   ═══════════════════════════════════════════════════ */

interface DriftLayerProps {
  children: ReactNode;
  speed?: number;
  axis?: "x" | "y" | "both";
  className?: string;
  as?: "div" | "section";
}

export function DriftLayer({
  children,
  speed = 0.25,
  axis = "y",
  className = "",
  as: Tag = "div",
}: DriftLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 120, speed * -120]);
  const x = useTransform(scrollYProgress, [0, 1], [speed * 80, speed * -80]);

  const style: Record<string, any> = {};
  if (axis === "y" || axis === "both") style.y = y;
  if (axis === "x" || axis === "both") style.x = x;

  return (
    <Tag ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={style} className="will-change-transform">
        {children}
      </motion.div>
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════
   TILT ON SCROLL
   Cards or panels that tilt as they enter/exit the
   viewport. Creates a kinetic, almost 3D feel.
   ═══════════════════════════════════════════════════ */

interface TiltScrollProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // degrees
}

export function TiltScroll({ children, className = "", maxTilt = 6 }: TiltScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 25 });
  const rotateX = useTransform(smoothProgress, [0, 0.5, 1], [maxTilt, 0, -maxTilt]);

  return (
    <motion.div ref={ref} style={{ rotateX, perspective: 1200 }} className={`origin-center ${className}`}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   REVEAL SHUTTER
   Content is hidden behind a shutter that slides
   open as the user scrolls through the section.
   ═══════════════════════════════════════════════════ */

interface RevealShutterProps {
  children: ReactNode;
  direction?: "left" | "right" | "top" | "bottom";
  className?: string;
  shutterColor?: string;
}

export function RevealShutter({
  children,
  direction = "right",
  className = "",
  shutterColor = "bg-cream-100 dark:bg-black",
}: RevealShutterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const transformMap = {
    left: { x: useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]) },
    right: { x: useTransform(scrollYProgress, [0, 0.8], ["100%", "0%"]) },
    top: { y: useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]) },
    bottom: { y: useTransform(scrollYProgress, [0, 0.8], ["100%", "0%"]) },
  };

  const anim = transformMap[direction];

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <div className="relative z-10">{children}</div>
      <motion.div
        className={`absolute inset-0 z-20 ${shutterColor}`}
        style={anim}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCROLL FADE
   Element fades in/out based on its position in the
   viewport. Good for section transitions.
   ═══════════════════════════════════════════════════ */

interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
  fadeRange?: [number, number, number, number]; // [inStart, inEnd, outStart, outEnd]
}

export function ScrollFade({
  children,
  className = "",
  fadeRange = [0, 0.25, 0.75, 1],
}: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, fadeRange, [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, fadeRange, [40, 0, 0, -40]);

  return (
    <motion.div ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   HORIZONTAL SCROLL GALLERY (pin + translateX)
   ═══════════════════════════════════════════════════ */

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-55%"]);
  const smoothX = useSpring(x, { stiffness: 40, damping: 25 });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const smoothProgress = useSpring(progress, { stiffness: 60, damping: 25 });

  return (
    <section ref={containerRef} className={`relative ${className}`}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        {/* Scroll progress hairline — gold fills as you travel the gallery */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="h-px bg-charcoal-200 dark:bg-white/10" />
          <motion.div
            className="h-px bg-gradient-to-r from-gold-500/60 via-gold-400 to-gold-500/60 -mt-px"
            style={{ scaleX: smoothProgress, originX: 0 }}
          />
        </div>
        <motion.div style={{ x: smoothX }} className="flex gap-6 px-8">
          {children}
        </motion.div>
      </div>
    </section>
  );
}

export function HScrollItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex-shrink-0 w-[85vw] sm:w-[65vw] lg:w-[45vw] ${className}`}>{children}</div>;
}

/* ═══════════════════════════════════════════════════
   SCROLL COUNTER
   ═══════════════════════════════════════════════════ */

interface ScrollCounterProps {
  target: number;
  suffix?: string;
  label: string;
  className?: string;
}

export function ScrollCounter({ target, suffix = "", label, className = "" }: ScrollCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const count = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, target * 0.6, target, target]);
  const rounded = useTransform(count, (v) => Math.round(v));

  return (
    /* Note: styled for the dark stats band on the home page — if this is ever
       reused on a light background, make the label color theme-aware. */
    <div ref={ref} className={`text-center ${className}`}>
      <div className="text-5xl sm:text-7xl font-heading font-bold text-gold-400 tabular-nums">
        <motion.span>{rounded}</motion.span>
        <span className="text-3xl sm:text-4xl">{suffix}</span>
      </div>
      <div className="mt-2 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/40">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HOVER SWAP CARD (before / after)
   ═══════════════════════════════════════════════════ */

interface HoverSwapCardProps {
  primaryImage: string;
  hoverImage: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

export function HoverSwapCard({ primaryImage, hoverImage, title, subtitle, onClick }: HoverSwapCardProps) {
  const t = useTranslations("home");
  return (
    <div
      className="group relative h-80 sm:h-96 overflow-hidden cursor-pointer border border-charcoal-200/60 dark:border-white/[0.06] bg-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 transition-colors duration-500 hover:border-gold-500/40 dark:hover:border-gold-400/30"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Images cross-fade on hover — the "before/after" reveal */}
      <NextImage
        src={primaryImage}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover transition-opacity duration-700 group-hover:opacity-0"
      />
      <NextImage
        src={hoverImage}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover scale-[1.02] transition-opacity duration-700 opacity-0 group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Hover hint — fades out once the swap is engaged */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur text-[0.5rem] font-mono tracking-widest uppercase text-white/60 border border-white/10 transition-opacity duration-500 group-hover:opacity-0">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-400/70" aria-hidden="true" />
        {t("hoverToCompare")}
      </div>

      <div className="absolute bottom-5 left-5">
        <div className="flex gap-2 mb-1">
          <span className="px-2 py-0.5 bg-white/10 backdrop-blur text-[0.5rem] font-mono tracking-widest uppercase text-white/70 border border-white/10">{t("before")}</span>
          <span className="px-2 py-0.5 bg-gold-500/80 text-[0.5rem] font-mono tracking-widest uppercase text-black">{t("after")}</span>
        </div>
        <h3 className="text-lg font-heading font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/50">{subtitle}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════════════════ */

interface MarqueeProps {
  items: { label: string }[];
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}

export function Marquee({ items, direction = "left", speed = 25, className = "" }: MarqueeProps) {
  const dur = Math.max(10, items.length * speed);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-12 items-center whitespace-nowrap"
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-12 text-charcoal-800/20 dark:text-white/20 font-heading text-lg tracking-wide select-none">
            <span>{item.label}</span>
            <span className="text-gold-400/25 text-[0.6rem]" aria-hidden="true">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   IMAGE WITH CLIP REVEAL
   ═══════════════════════════════════════════════════ */

interface ClipRevealProps {
  src: string;
  className?: string;
  direction?: "left" | "right" | "top" | "bottom";
}

export function ClipReveal({ src, className = "", direction = "left" }: ClipRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const clipMap = {
    left: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
    right: ["inset(0 0% 0 100%)", "inset(0 0% 0 0%)"],
    top: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"],
    bottom: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"],
  };

  const clip = useTransform(scrollYProgress, [0, 0.7], clipMap[direction]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        className="relative w-full h-full"
        style={{ clipPath: clip }}
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