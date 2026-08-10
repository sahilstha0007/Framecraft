"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function AssemblyLoading() {
  const t = useTranslations("assembly");
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border border-gold-400/15 rounded-full" />
          <div className="absolute inset-0 border-t border-gold-400/50 rounded-full animate-spin" />
        </div>
        <span className="font-mono text-[0.5rem] tracking-[0.3em] uppercase text-charcoal-500/20 dark:text-white/20">
          {t("loading3d")}
        </span>
      </div>
    </div>
  );
}

const HeroAssembly = dynamic(() => import("./HeroAssembly"), {
  ssr: false,
  loading: AssemblyLoading,
});

// ─── Wrapper to subscribe to a MotionValue ─────────────────────────────────

function ProgressSubscriber({ progress }: { progress: any }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const unsub = progress.on("change", setVal);
    return () => unsub();
  }, [progress]);

  return <HeroAssembly progress={val} />;
}

// ─── Label text that fades based on scroll ─────────────────────────────────

function TopLabel({ progress }: { progress: any }) {
  const t = useTranslations("assembly");
  const [val, setVal] = useState(0);

  useEffect(() => {
    const unsub = progress.on("change", setVal);
    return () => unsub();
  }, [progress]);

  // Fade out as the section scrolls away
  const opacity = Math.max(0, 1 - val * 1.8);

  return (
    <motion.div
      className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
      style={{ opacity }}
    >
      <span className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500/30 dark:text-white/30">
        {t("watch")}
      </span>
    </motion.div>
  );
}

// ─── Completion glow & corner brackets ────────────────────────────────────

function CompletionEffect({ progress }: { progress: any }) {
  const t = useTranslations("assembly");
  const [val, setVal] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const unsub = progress.on("change", setVal);
    return () => unsub();
  }, [progress]);

  // Track the moment assembly first reaches completion. Threshold of 0.98
  // (not exactly 1) because the spring-smoothed progress asymptotes toward 1
  // and only locks to exactly 1 after scrolling stops.
  useEffect(() => {
    if (val >= 0.98 && !hasCompleted) {
      setHasCompleted(true);
    }
  }, [val, hasCompleted]);

  // Fade in glow as we approach completion (val > 0.85)
  const glowOpacity = Math.max(0, Math.min(1, (val - 0.85) / 0.15));

  return (
    <>
      {/* Golden radial glow that fades in as assembly nears completion */}
      <motion.div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{ opacity: glowOpacity }}
        animate={
          val >= 0.98
            ? {
                opacity: [glowOpacity, Math.min(glowOpacity + 0.08, 0.5), glowOpacity],
              }
            : undefined
        }
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)",
          }}
        />
        {/* Inner ring glow */}
        <div
          className="absolute inset-[30%]"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* Corner L-brackets that glow when assembled */}
      {[
        { position: "top-8 left-8", rotate: 0 },
        { position: "top-8 right-8", rotate: 90 },
        { position: "bottom-8 left-8", rotate: -90 },
        { position: "bottom-8 right-8", rotate: 180 },
      ].map((corner, i) => (
        <motion.div
          key={i}
          className={`absolute ${corner.position} z-[2] pointer-events-none`}
          style={{ opacity: glowOpacity, rotate: corner.rotate }}
          animate={
            val >= 0.98
              ? {
                  scale: [1, 1.08, 1],
                }
              : { scale: 1 }
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        >
          {/* L-bracket: horizontal + vertical lines meeting at the corner */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M0 0h20M0 0v20"
              stroke="rgba(212,175,55,0.8)"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
            {/* Small dot at the corner vertex */}
            <circle cx="0" cy="0" r="1.5" fill="rgba(212,175,55,0.9)" />
          </svg>
        </motion.div>
      ))}

      {/* "Assembled" label that appears when complete */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[2] pointer-events-none"
        style={{
          opacity: Math.max(0, Math.min(1, (val - 0.95) / 0.05)),
          y: 8,
        }}
      >
        <motion.span
          className="font-mono text-[0.5rem] tracking-[0.4em] uppercase block"
          style={{ color: "rgba(212, 175, 55, 0.7)" }}
          animate={val >= 0.98 ? { opacity: [0.5, 0.85, 0.5] } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {t("fullyAssembled")}
        </motion.span>
      </motion.div>
    </>
  );
}

// ─── Bottom progress indicator ─────────────────────────────────────────────

function BottomIndicator({ progress }: { progress: any }) {
  const t = useTranslations("assembly");
  const [val, setVal] = useState(0);

  useEffect(() => {
    const unsub = progress.on("change", setVal);
    return () => unsub();
  }, [progress]);

  const percent = Math.round(Math.min(val, 1) * 100);
  const opacity = Math.max(0, 1 - val * 1.5);

  return (
    <motion.div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      style={{ opacity }}
    >
      {/* Progress bar */}
      <div className="w-40 h-px bg-charcoal-200/30 dark:bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-gold-400"
          style={{ width: `${Math.min(val, 1) * 100}%` }}
        />
      </div>
      {/* Text */}
      <span className="font-mono text-[0.5rem] tracking-[0.3em] uppercase text-charcoal-500/40 dark:text-white/40">
        {val >= 0.98 ? t("complete") : t("assembling", { percent })}
      </span>
    </motion.div>
  );
}

// ─── Exported Section ──────────────────────────────────────────────────────

export default function FrameAssemblySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Track scroll through the section: 0 when section top enters viewport,
  // 1 when section bottom leaves viewport.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Start tracking from the current scroll value so a mid-page load/refresh
  // doesn't pop the frame to a partial-assembly state on the first change.
  const lastScrollRef = useRef(scrollYProgress.get());

  // Direction-aware assembly: scrolling DOWN assembles the frame (0 → 1),
  // scrolling back UP disassembles it (1 → 0). Instead of mapping to the
  // section's position in the viewport (which re-assembles the frame on the
  // way up — the "zoom" effect), this accumulates scroll deltas in the
  // current direction, so reversing direction is perfectly continuous: the
  // frame picks up from wherever it was and scatters back apart.
  const directional = useMotionValue(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const diff = latest - lastScrollRef.current;
    lastScrollRef.current = latest;
    if (Math.abs(diff) < 0.00005) return;
    directional.set(
      Math.max(0, Math.min(1, directional.get() + diff))
    );
  });

  // Spring-smoothed signal so the frame pieces glide instead of snapping to
  // each raw scroll tick — the pieces trail the scroll slightly with weight.
  const smoothedScroll = useSpring(directional, {
    stiffness: 80,
    damping: 24,
    mass: 0.5,
  });

  // Multi-point mapping for satisfying assembly timing with an easeOutCubic
  // feel (fast start, gentle deceleration):
  //
  //   Scroll       Assembly     Feel
  //   ───────      ────────     ─────────────────────────────
  //   0%           0%           Scattered — immediate start
  //   15%          30%          Pieces fly in fast
  //   40%          80%          Mostly assembled (bulk done)
  //   70%          100%         Final pieces click in slowly
  //   70–100%      100%         Enjoy the finished frame
  //
  // This gives the user: 40% scroll to reach 80% assembly (fast action),
  // then 30% scroll for the last 20% (satisfying finish), then 30% scroll
  // to admire the completed frame.
  const assemblyProgress = useTransform(
    smoothedScroll,
    [0, 0.15, 0.4, 0.7],
    [0, 0.3, 0.8, 1]
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full bg-cream-50 dark:bg-[#0a0a08] overflow-hidden"
    >
      {/* 3D Canvas fills the section */}
      <div className="absolute inset-0">
        <ProgressSubscriber progress={assemblyProgress} />
      </div>

      {/* Completion effects — golden glow, corner brackets, assembled text */}
      <CompletionEffect progress={assemblyProgress} />

      {/* Gradient overlay at the very top for readability */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-cream-100 dark:from-[#1a1512] to-transparent z-[1] pointer-events-none" />

      {/* Gradient overlay at the very bottom for readability */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-cream-100 dark:from-[#1a1512] to-transparent z-[1] pointer-events-none" />

      {/* Top label */}
      <TopLabel progress={assemblyProgress} />

      {/* Bottom progress indicator */}
      <BottomIndicator progress={assemblyProgress} />
    </section>
  );
}