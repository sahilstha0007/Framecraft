"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValue,
  useSpring,
} from "framer-motion";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { ArrowRight, Rotate3d } from "lucide-react";
import { useTranslations } from "next-intl";
import { galleryItems } from "@/lib/data";
import type { GalleryItem } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

// ── Constants ──

const INTERVAL_MS = 5500;
const FRAME_TRANSITION_S = 1.4;

/* ── Dynamic 3D scene (client-only) ── */
function HeroLoading() {
  const t = useTranslations("hero");
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: "#171310" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border border-gold-400/20 rounded-full" />
          <div className="absolute inset-0 border-t border-gold-400/60 rounded-full animate-spin" />
        </div>
        <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-white/30">
          {t("loading")}
        </span>
      </div>
    </div>
  );
}

const HeroScene3D = dynamic(() => import("@/components/HeroScene3D"), {
  ssr: false,
  loading: HeroLoading,
});

// ── Museum caption (shared by 2D frame and 3D overlay) ──

function MuseumCaption({
  item,
  isDark,
  className = "",
}: {
  item: GalleryItem;
  isDark: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 border-l-[2.5px]"
        style={{
          backgroundColor: isDark ? "rgba(26,21,18,0.75)" : "rgba(255,255,255,0.85)",
          borderLeftColor: "rgba(212,168,56,0.55)",
        }}
      >
        <p
          className="font-mono text-[7px] sm:text-[8px] md:text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(212,168,56,0.7)" }}
        >
          {item.category}
        </p>
        <p className={"font-heading text-[11px] sm:text-xs md:text-sm mt-0.5 leading-snug " + (isDark ? "text-white/90" : "text-walnut-800")}>
          {item.title}
        </p>
        <p
          className="font-mono text-[7px] sm:text-[8px] tracking-[0.1em] mt-1"
          style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(61,42,24,0.4)" }}
        >
          {item.client}
        </p>
      </div>
    </div>
  );
}

// ── Sub-component: frame rotation bar ──
// A draggable turntable bar: slide it left/right to spin the framed piece
// around and look at the "other way" — the back face of the frame.

function FrameRotateSlider({
  rotation,
  onChange,
  onStart,
  onEnd,
}: {
  rotation: number; // degrees, 0 (front) → 360 (front again, back at 180)
  onChange: (deg: number) => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const t = useTranslations("hero");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(false);

  const setFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const frac = (clientX - rect.left) / rect.width;
    onChange(Math.round(Math.min(1, Math.max(0, frac)) * 360));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activeRef.current = true;
    onStart();
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activeRef.current) setFromClientX(e.clientX);
  };

  const endDrag = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    onEnd();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(360, rotation + 15));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(0, rotation - 15));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(360);
    }
  };

  const norm = ((rotation % 360) + 360) % 360;
  const isFront = norm < 45 || norm > 315;
  const isBack = norm > 135 && norm < 225;
  const pct = (rotation / 360) * 100;

  return (
    <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2 z-10">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={t("rotateFrame")}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(rotation)}
        aria-valuetext={
          isFront ? t("front") : isBack ? t("back") : `${Math.round(rotation)}°`
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={onKeyDown}
        className="relative w-56 sm:w-72 h-9 flex items-center cursor-ew-resize touch-none rounded-full outline-none focus-visible:ring-1 focus-visible:ring-gold-400/60"
      >
        {/* Base track */}
        <div
          className="absolute left-0 right-0 h-[3px] rounded-full"
          style={{ background: "rgba(212,168,56,0.14)" }}
        />
        {/* Filled portion */}
        <div
          className="absolute left-0 h-[3px] rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(to right, rgba(212,168,56,0.3), #d4a838)",
          }}
        />
        {/* Centre stop — the back of the frame */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-px h-3"
          style={{ background: "rgba(212,168,56,0.4)" }}
        />
        {/* Knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border backdrop-blur-sm transition-shadow duration-300"
          style={{
            left: `${pct}%`,
            borderColor: "rgba(212,168,56,0.45)",
            backgroundColor: "rgba(23,19,16,0.85)",
            boxShadow: isBack
              ? "0 0 24px rgba(212,168,56,0.35), 0 2px 10px rgba(0,0,0,0.5)"
              : "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          <Rotate3d size={14} style={{ color: "#d4a838" }} />
        </div>
      </div>
      {/* End labels — FRONT · BACK · FRONT */}
      <div className="w-56 sm:w-72 relative h-4">
        <span
          className="absolute left-0 font-mono text-[7px] tracking-[0.25em] uppercase transition-colors duration-500"
          style={{ color: isFront ? "#d4a838" : "rgba(212,168,56,0.35)" }}
        >
          {t("front")}
        </span>
        <span
          className="absolute left-1/2 -translate-x-1/2 font-mono text-[7px] tracking-[0.25em] uppercase transition-colors duration-500"
          style={{ color: isBack ? "#d4a838" : "rgba(212,168,56,0.35)" }}
        >
          {t("back")}
        </span>
        <span
          className="absolute right-0 font-mono text-[7px] tracking-[0.25em] uppercase transition-colors duration-500"
          style={{ color: isFront ? "#d4a838" : "rgba(212,168,56,0.35)" }}
        >
          {t("front")}
        </span>
      </div>
    </div>
  );
}

// ── Sub-component: right-side gallery scrubber ──
// A vertical slider that scrubs through the collection — drag up/down (or
// tap a spot on the rail) to change the picture hanging on the wall.

function GalleryScrubber({
  items,
  index,
  onNavigate,
  onStart,
  onEnd,
  isDark,
}: {
  items: GalleryItem[];
  index: number;
  onNavigate: (i: number) => void;
  onStart: () => void;
  onEnd: () => void;
  isDark: boolean;
}) {
  const t = useTranslations("hero");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(false);
  const lastIndex = Math.max(1, items.length - 1);

  const setFromClientY = (clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    const frac = (clientY - rect.top) / rect.height;
    onNavigate(Math.round(Math.min(1, Math.max(0, frac)) * lastIndex));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activeRef.current = true;
    onStart();
    setFromClientY(e.clientY);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activeRef.current) setFromClientY(e.clientY);
  };

  const endDrag = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    onEnd();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      onNavigate(Math.min(items.length - 1, index + 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      onNavigate(Math.max(0, index - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      onNavigate(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onNavigate(items.length - 1);
    }
  };

  return (
    <nav
      aria-label={t("scrubGallery")}
      className="absolute right-4 sm:right-7 top-1/2 -translate-y-1/2 z-20 hidden md:flex"
    >
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={items.length - 1}
        aria-valuenow={index}
        aria-valuetext={items[index]?.title ?? ""}
        aria-label={t("scrubGallery")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={onKeyDown}
        className="relative h-52 w-12 cursor-pointer touch-none outline-none rounded-full focus-visible:ring-1 focus-visible:ring-gold-400/60"
      >
        {/* Hairline track */}
        <div
          className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px"
          style={{
            background: isDark ? "rgba(255,255,255,0.1)" : "rgba(61,42,24,0.12)",
          }}
        />
        {/* Tick marks */}
        {items.map((item, i) => (
          <span
            key={item.id}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{
              top: `${(i / lastIndex) * 100}%`,
              width: i === index ? 5 : 3,
              height: i === index ? 5 : 3,
              backgroundColor:
                i === index
                  ? "#d4a838"
                  : isDark
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(61,42,24,0.18)",
              boxShadow: i === index ? "0 0 10px rgba(212,168,56,0.5)" : "none",
            }}
          />
        ))}
        {/* Thumb — a miniature framed preview of the current piece */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${(index / lastIndex) * 100}%` }}
        >
          <div
            className="relative w-10 h-12 sm:w-11 sm:h-[52px] overflow-hidden rounded-[2px] bg-[#0a0a08] transition-all duration-500"
            style={{
              border: "1px solid rgba(212,168,56,0.4)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
            }}
          >
            {items[index] && (
              <NextImage
                src={items[index].image}
                alt={items[index].title}
                fill
                sizes="44px"
                className="object-cover"
              />
            )}
            <div
              className="absolute inset-[2px] border pointer-events-none"
              style={{ borderColor: "rgba(212,168,56,0.25)" }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Sub-component: the framed image (2D fallback) ──

function FramedArtwork({
  item,
  backItem,
  isDark,
  rotation,
  priority,
  backLabel,
}: {
  item: GalleryItem;
  backItem: GalleryItem;
  isDark: boolean;
  rotation: number; // degrees — 0 = front face, 180 = the "other way"
  priority: boolean;
  backLabel: string;
}) {
  // Gentle 3D tilt toward the cursor — the "peek" that makes each piece feel
  // like a physical object leaning off the gallery wall. Applied to both
  // faces so the tilt keeps working however the frame is turned.
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 140, damping: 16 });
  const sry = useSpring(ry, { stiffness: 140, damping: 16 });

  const onPointerMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 7);
    rx.set(-py * 7);
  };

  const onPointerLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const tiltStyle = {
    rotateX: srx,
    rotateY: sry,
    transformPerspective: 1100,
  };

  return (
    <div className="relative w-full h-full" style={{ perspective: 1800 }}>
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: rotation }}
        transition={{ type: "spring", stiffness: 110, damping: 20, mass: 0.9 }}
        initial={false}
      >
      {/* ══ FRONT FACE ══ */}
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
      <motion.div
        className="relative w-full h-full group cursor-pointer"
        style={tiltStyle}
        onMouseMove={onPointerMove}
        onMouseLeave={onPointerLeave}
      >
      {/* ── Layer 1: Deep shadow behind frame (deepens on hover) ── */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.6)" }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: "0 22px 80px rgba(0,0,0,0.72)" }}
      />

      {/* ── Layer 2: Outer gold frame border ── */}
      <div
        className="absolute inset-0 border rounded-[1px]"
        style={{ borderColor: "rgba(212,168,56,0.35)" }}
      />

      {/* ── Layer 3: Inner frame line ── */}
      <div
        className="absolute inset-[4px] border rounded-[1px]"
        style={{ borderColor: "rgba(212,168,56,0.18)" }}
      />

      {/* ── Layer 4: Mat / board ── */}
      <div
        className="absolute inset-[7px]"
        style={{ backgroundColor: "rgba(245,240,232,0.035)" }}
      />

      {/* ── Layer 5: The image itself (zooms in gently on hover) ── */}
      <div
        className="absolute inset-[14px] overflow-hidden"
        style={{ backgroundColor: "#0a0a08" }}
      >
        <NextImage
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 80vw, 70vw"
          className="object-cover scale-100 group-hover:scale-[1.06] transition-transform duration-[8000ms] group-hover:duration-[1000ms] ease-out"
          priority={priority}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 60%, rgba(10,10,8,0.25) 100%)",
          }}
        />
      </div>

      {/* ── Layer 6: Soft gold halo on hover (rendered beneath the plaque) ── */}
      <div
        className="absolute -inset-[3px] rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow:
            "0 0 44px rgba(212,168,56,0.25), inset 0 0 0 1px rgba(212,168,56,0.35)",
        }}
      />

      {/* ── Layer 7: Museum caption — the hover title ──
          Hidden until hover on pointer-capable devices; always visible on
          touch (no hover) thanks to pointer-fine / pointer-coarse gating. */}
      <MuseumCaption
        item={item}
        isDark={isDark}
        className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 max-w-[260px] sm:max-w-[300px] pointer-events-none opacity-100 pointer-fine:opacity-0 pointer-fine:translate-y-3 pointer-fine:group-hover:opacity-100 pointer-fine:group-hover:translate-y-0 transition-all duration-500 ease-out"
      />
      </motion.div>
      </div>

      {/* ══ BACK FACE — the "other way" ══
          A hand-finished wood panel that carries its own piece from the
          collection, so turning the frame around shows fresh artwork. */}
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
        <motion.div
          className="relative w-full h-full group cursor-pointer"
          style={tiltStyle}
          onMouseMove={onPointerMove}
          onMouseLeave={onPointerLeave}
        >
          {/* Wood panel */}
          <div
            className="absolute inset-0 rounded-[1px]"
            style={{
              background: "linear-gradient(150deg, #6d4a2b 0%, #4a3119 38%, #33210f 72%, #241608 100%)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
            }}
          />
          {/* Wood grain */}
          <div
            className="absolute inset-0 rounded-[1px] pointer-events-none"
            style={{
              opacity: 0.16,
              background:
                "repeating-linear-gradient(92deg, transparent 0px, transparent 3px, rgba(0,0,0,0.35) 3px, rgba(0,0,0,0.35) 4px)",
            }}
          />
          {/* Recessed panel line */}
          <div className="absolute inset-[6px] rounded-[1px]" style={{ border: "1px solid rgba(0,0,0,0.4)" }} />
          {/* Brass sawtooth hanger */}
          <div
            className="absolute top-[6%] left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 rounded-[2px] flex items-center justify-center gap-3"
            style={{
              background: "linear-gradient(to bottom, #b58f3c, #7c5f22)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <span className="block w-[3px] h-[3px] rounded-full bg-[#241608]/70" />
            <span className="block w-[3px] h-[3px] rounded-full bg-[#241608]/70" />
          </div>
          {/* Studio label */}
          <div
            className="absolute top-[5.5%] right-[7%] font-mono text-[6px] sm:text-[7px] tracking-[0.2em] uppercase px-2 py-1"
            style={{
              color: "rgba(224,190,120,0.75)",
              border: "1px solid rgba(212,168,56,0.22)",
              background: "rgba(20,12,6,0.35)",
            }}
          >
            FrameCraft · {backLabel}
          </div>
          {/* Back artwork */}
          <div
            className="absolute inset-[15%] overflow-hidden"
            style={{
              backgroundColor: "#0a0a08",
              boxShadow: "0 0 0 1px rgba(212,168,56,0.18), 0 6px 24px rgba(0,0,0,0.5)",
            }}
          >
            <NextImage
              src={backItem.image}
              alt={backItem.title}
              fill
              sizes="(max-width: 640px) 70vw, 45vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 60%, rgba(10,10,8,0.3) 100%)",
              }}
            />
          </div>
          {/* Back caption */}
          <MuseumCaption
            item={backItem}
            isDark={isDark}
            className="absolute bottom-[5%] left-[7%] max-w-[55%] sm:max-w-[220px]"
          />
        </motion.div>
      </div>
      </motion.div>
    </div>
  );
}

// ── Framer Motion variants ──

const imageVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const plaqueVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const headlineContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};

const wordVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const sublineVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.55 },
  },
};

const eyebrowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

// ── Spotlight gradient styles (dark/light aware) ──

const MAIN_SPOTLIGHT_STYLE = (dark: boolean) => ({
  background: dark
    ? "radial-gradient(ellipse at top, rgba(230,190,100,0.10) 0%, transparent 60%)"
    : "radial-gradient(ellipse at top, rgba(212,168,56,0.04) 0%, transparent 60%)",
});

const LIGHT_BAR_STYLE = (dark: boolean) => ({
  background: dark
    ? "linear-gradient(to bottom, rgba(212,168,56,0.15), transparent)"
    : "linear-gradient(to bottom, rgba(212,168,56,0.08), transparent)",
});

const FILL_LIGHT_STYLE = (dark: boolean) => ({
  background: dark
    ? "radial-gradient(ellipse at bottom, rgba(212,168,56,0.035) 0%, transparent 60%)"
    : "radial-gradient(ellipse at bottom, rgba(212,168,56,0.015) 0%, transparent 60%)",
});

// ── Noise texture overlay (shared) ──

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

// ── Scroll cue (3D mode only) ──

function ScrollCue() {
  const t = useTranslations("hero");
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
      <span
        className="font-mono text-[8px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(212,168,56,0.6)" }}
      >
        {t("stepCloser")}
      </span>
      <div
        className="h-8 w-px overflow-hidden"
        style={{ background: "rgba(212,168,56,0.15)" }}
      >
        <motion.div
          className="w-px h-full"
          style={{ background: "rgba(212,168,56,0.8)" }}
          animate={{ y: ["-100%", "100%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

// ── Main Hero Component ──

export default function Hero() {
  const t = useTranslations("hero");
  const tn = useTranslations("nav");
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [use3D, setUse3D] = useState(false);
  // Frame rotation (0–360°) and slider interactions. While either slider is
  // being dragged the auto-advance pauses so the piece doesn't change mid-gesture.
  const [rotation, setRotation] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Scroll progress through the hero (0 → 1). Drives the 3D camera push-in.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // The classic 2D gallery-wall hero is the primary experience again, now
  // with interactive hover titles on each piece. (The 3D Curator's Room scene
  // with drag-to-rotate stays in the codebase — flip this to `true` to
  // re-enable it.)
  useEffect(() => {
    setUse3D(false);
  }, []);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Live gallery from the API — falls back to the bundled catalog so the
  // hero still works while the backend is off. Localized for the ne locale.
  const { data: localizedItems } = useLocalizedCollection<GalleryItem>("gallery", galleryItems);
  const items = useMemo(
    () => (localizedItems.length ? localizedItems : galleryItems),
    [localizedItems]
  );
  const heroItems = useMemo(
    () => items.map((item) => ({ ...item, image: item.image.replace("w=800&q=80", "w=1920&q=85") })),
    [items]
  );
  const heroItems3D = useMemo(
    () => heroItems.map((item) => ({ ...item, image: item.image.replace("w=1920&q=85", "w=1200&q=85") })),
    [heroItems]
  );

  const current = useMemo(() => heroItems[index], [index, heroItems]);

  // The reverse of the frame carries another piece from the collection — the
  // same offset trick the 3D turntable uses so the two faces never match.
  const backItem = useMemo(() => {
    const len = heroItems.length;
    const offset = Math.floor(len / 2);
    return heroItems[(index + offset) % len];
  }, [index, heroItems]);

  // Keep the index in range if the live collection is shorter than the bundled one.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, heroItems.length - 1)));
  }, [heroItems.length]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroItems.length);
    }, INTERVAL_MS);
  }, [clearTimer, heroItems.length]);

  useEffect(() => {
    if (!mounted || paused || interacting) {
      clearTimer();
      return;
    }
    startTimer();
    return clearTimer;
  }, [mounted, paused, interacting, startTimer, clearTimer]);

  // Preload adjacent images for smoother transitions (2D hero only — the
  // 3D scene lazily loads its own lighter textures).
  useEffect(() => {
    if (!mounted || use3D) return;
    const next = (index + 1) % heroItems.length;
    const nextNext = (index + 2) % heroItems.length;
    [next, nextNext].forEach((i) => {
      const img = new Image();
      img.src = heroItems[i].image;
    });
  }, [index, mounted, use3D, heroItems]);

  const navigate = useCallback(
    (i: number) => {
      setIndex(i);
      if (!paused && !interacting) startTimer();
    },
    [paused, interacting, startTimer]
  );

  const headlineWords = t.raw("words") as string[];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: isDark ? "#1a1512" : "#faf6ed" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ══ BACKGROUND: 3D Curator's Room (capable devices) ══ */}
      {use3D ? (
        <div className="absolute inset-0">
          <HeroScene3D items={heroItems3D} index={index} progress={scrollYProgress} />
          {/* Film grain over the 3D canvas for cohesion */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{ opacity: 0.04, backgroundImage: NOISE_BG }}
          />
          {/* Soft vignette for edge focus */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(10,8,6,0.55) 100%)",
            }}
          />
        </div>
      ) : (
        /* ══ BACKGROUND: 2D gallery wall (fallback) ══ */
        <>
          {/* Gallery wall background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? "linear-gradient(to bottom, #1f1915, #1a1512, #14100c)"
                : "linear-gradient(to bottom, #fdfbf7, #faf6ed, #f5efe3)",
            }}
          />

          {/* Gallery wall texture (subtle noise overlay) */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{ opacity: isDark ? 0.035 : 0.012, backgroundImage: NOISE_BG }}
          />

          {/* Additional subtle wall grain via CSS overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: isDark ? 0.025 : 0.01,
              background: isDark
                ? "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)"
                : "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(61,42,24,0.008) 2px, rgba(61,42,24,0.008) 3px)",
            }}
          />

          {/* Gallery track lighting effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px]">
              <div className="absolute inset-0" style={MAIN_SPOTLIGHT_STYLE(isDark)} />
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-[120px]"
                style={LIGHT_BAR_STYLE(isDark)}
              />
            </div>
            <div
              className="absolute bottom-0 left-[15%] w-[500px] h-[250px]"
              style={FILL_LIGHT_STYLE(isDark)}
            />
            <div
              className="absolute bottom-0 right-[15%] w-[500px] h-[250px]"
              style={FILL_LIGHT_STYLE(isDark)}
            />
          </div>
        </>
      )}

      {/* ── FrameCraft brand plaque (top-left) ── */}
      <motion.div
        variants={plaqueVariants}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
        className="absolute top-8 sm:top-10 lg:top-12 left-6 sm:left-10 lg:left-14 z-20"
      >
        <Link href="/" className="block group">
          <span className={"block font-heading text-xl sm:text-2xl md:text-3xl tracking-tight transition-colors duration-500 " + (isDark ? "text-white/90 group-hover:text-white" : "text-walnut-800 group-hover:text-walnut-900")}>
            FrameCraft
          </span>
          <span
            className="block font-mono text-[7px] sm:text-[8px] tracking-[0.25em] uppercase mt-1.5 transition-colors duration-500"
            style={{ color: isDark ? "rgba(212,168,56,0.5)" : "rgba(212,168,56,0.7)" }}
          >
            {tn("tagline")}
          </span>
        </Link>
      </motion.div>

      {/* ── 2D presentation area (fallback only) ── */}
      {!use3D && (
        <div
          className="relative w-full flex flex-col items-center justify-center px-5 sm:px-10 md:px-16 lg:px-24 xl:px-32"
          style={{
            paddingTop: "clamp(7rem, 12vh, 10rem)",
            paddingBottom: "clamp(14rem, 18vh, 16rem)",
          }}
        >
          <div className="relative w-full max-w-[1400px] aspect-[4/3] sm:aspect-[16/10] md:aspect-[21/10] lg:aspect-[24/10] max-h-[62vh] flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={current.id}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: FRAME_TRANSITION_S, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-0"
              >
                <FramedArtwork
                  item={current}
                  backItem={backItem}
                  isDark={isDark}
                  rotation={rotation}
                  priority={index === 0}
                  backLabel={t("back")}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Frame rotation bar — slide it to spin the piece around and
              see the "other way" (the back of the frame) */}
          <FrameRotateSlider
            rotation={rotation}
            onChange={setRotation}
            onStart={() => setInteracting(true)}
            onEnd={() => setInteracting(false)}
          />
        </div>
      )}

      {/* ── Museum caption over the 3D room (desktop) ── */}
      {use3D && mounted && (
        <div className="absolute bottom-6 left-6 sm:left-10 z-10 max-w-[240px] sm:max-w-[280px] pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <MuseumCaption item={current} isDark={isDark} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── Exhibition headline ── */}
      <motion.div
        variants={headlineContainer}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
        className="absolute bottom-32 sm:bottom-36 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none w-full px-4"
      >
        <motion.p
          variants={eyebrowVariants}
          className="font-mono text-[8px] sm:text-[10px] tracking-[0.35em] uppercase mb-3 sm:mb-4"
          style={{ color: "#d4a838" }}
        >
          {t("eyebrow")}
        </motion.p>
        <motion.h2
          className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight tracking-tight"
          style={{ color: isDark ? "rgba(255,255,255,0.92)" : "rgba(61,42,24,0.92)" }}
        >
          {headlineWords.map((word) => (
            <motion.span
              key={word}
              variants={wordVariants}
              className="inline-block mr-[0.22em]"
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            variants={wordVariants}
            className="inline-block italic"
            style={{ color: "#d4a838" }}
          >
            {t("emphasis")}
          </motion.span>
        </motion.h2>
        <motion.p
          variants={sublineVariants}
          className="font-body text-[9px] sm:text-[10px] md:text-xs mt-2 sm:mt-3 tracking-[0.15em] uppercase"
          style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(61,42,24,0.35)" }}
        >
          {t("subline")}
        </motion.p>
      </motion.div>

      {/* ── CTA buttons ── */}
      <motion.div
        variants={ctaVariants}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
        className="absolute bottom-16 sm:bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 sm:gap-4"
      >
        <Link
          href="/frames"
          className="group inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
          style={{ backgroundColor: "#d4a838", color: "#1a1512" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e4c675";
            e.currentTarget.style.boxShadow = "0 0 32px rgba(212,168,56,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#d4a838";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <span>{t("exploreFrames")}</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          href="/custom"
          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase transition-all duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400"
          style={{ border: "1px solid rgba(212,168,56,0.25)", color: "rgba(212,168,56,0.7)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(212,168,56,0.5)";
            e.currentTarget.style.color = "#d4a838";
            e.currentTarget.style.backgroundColor = "rgba(212,168,56,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(212,168,56,0.25)";
            e.currentTarget.style.color = "rgba(212,168,56,0.7)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {t("getQuote")}
        </Link>
      </motion.div>

      {/* ── Vertical gallery scrubber rail (desktop) — drag or tap to
          change the picture ── */}
      {mounted && (
        <GalleryScrubber
          items={heroItems}
          index={index}
          onNavigate={navigate}
          onStart={() => setInteracting(true)}
          onEnd={() => setInteracting(false)}
          isDark={isDark}
        />
      )}

      {/* ── Dot pagination (mobile, 2D fallback) ── */}
      {mounted && !use3D && (
        <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 md:hidden">
          {heroItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => navigate(i)}
              className="transition-all duration-500 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400/60"
              aria-label={`${t("viewItem", { title: item.title })}`}
              aria-current={i === index}
              style={{
                width: i === index ? "1.25rem" : "0.375rem",
                height: "0.375rem",
                backgroundColor:
                  i === index
                    ? "#d4a838"
                    : isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(61,42,24,0.15)",
                borderRadius: i === index ? "2px" : "50%",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Scroll cue (3D mode) ── */}
      {use3D && mounted && <ScrollCue />}

      {/* ── Language switch — pinned bottom-right so it never collides with
          the floating nav pill or the right-side gallery rail ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute bottom-10 right-6 sm:right-8 z-20"
      >
        <LanguageSwitcher />
      </motion.div>

      {/* ── Top edge accent line ── */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, rgba(212,168,56,0.12), transparent)",
        }}
      />
    </section>
  );
}
