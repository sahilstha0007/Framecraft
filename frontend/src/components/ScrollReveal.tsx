"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import NextImage from "next/image";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  distance?: number;
  once?: boolean;
  stagger?: boolean;
  index?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.7,
  distance = 50,
  once = true,
}: ScrollRevealProps) {
  const dirMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...dirMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-50px" }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Parallax layer that moves at a different speed than scroll ── */
interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxLayer({ children, speed = 0.5, className = "" }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  // Reduced motion: static layer (scroll-linked drift isn't covered by
  // MotionConfig reducedMotion="user").
  if (useReducedMotion()) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Giant background word drifting on scroll (watermark) ──
   A huge outline word pinned behind a section that travels vertically at
   its own speed — the "parallel" layer beneath the content. Paired with
   per-item ParallaxLayer drift it creates genuine multi-speed depth. */
interface DriftWatermarkProps {
  text: string;
  className?: string; // positioning on the wrapper (e.g. "absolute inset-0")
  speed?: number;     // 0.1–1, higher = more drift
  stroke?: string;    // outline color; default is a faint gold
  sizeClass?: string; // font size utility (default text-[26vw])
}

export function DriftWatermark({
  text,
  className = "",
  speed = 0.35,
  stroke = "1.5px rgba(212,168,56,0.22)",
  sizeClass = "text-[26vw]",
}: DriftWatermarkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 24}%`, `${-speed * 24}%`]);

  const outlineStyle: CSSProperties = {
    WebkitTextStroke: stroke,
    color: "transparent",
  };

  // Reduced motion: static watermark.
  if (useReducedMotion()) {
    return (
      <div ref={ref} aria-hidden="true" className={`pointer-events-none select-none overflow-hidden ${className}`}>
        <div className="flex h-full w-full items-center justify-center">
          <span
            className={`font-heading font-bold whitespace-nowrap leading-none tracking-tight ${sizeClass}`}
            style={outlineStyle}
          >
            {text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="flex h-full w-full items-center justify-center">
        <span
          className={`font-heading font-bold whitespace-nowrap leading-none tracking-tight ${sizeClass}`}
          style={outlineStyle}
        >
          {text}
        </span>
      </motion.div>
    </div>
  );
}

/* ── Scale-on-scroll image ── */
interface ScaleImageProps {
  src: string;
  className?: string;
}

export function ScaleImage({ src, className = "" }: ScaleImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.85]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div className="relative w-full h-full" style={{ scale }}>
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

/* ── Reveal text (character by character) ── */
interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function RevealText({ text, className = "", delay = 0 }: RevealTextProps) {
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: delay + i * 0.02 }}
          className="inline-block"
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}
