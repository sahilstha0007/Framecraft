"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ArrowRight, Sparkles, Layers, Zap, Palette } from "lucide-react";
import { useTranslations } from "next-intl";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4";

function LogoMark() {
  return (
    <svg width="44" height="26" viewBox="0 0 44 26" fill="none" aria-hidden="true">
      <rect x="0" y="3" width="14" height="20" rx="3" fill="white" />
      <rect x="16" y="3" width="12" height="20" rx="3" fill="white" />
      <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
    </svg>
  );
}

export default function MicroVisualsPage() {
  const t = useTranslations("microvisuals");
  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBgRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Effect 1: Frame capture (boomerang setup) ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let capturing = true;
    let lastTime = -1;
    const MAX_WIDTH = 960;
    const frames: HTMLCanvasElement[] = [];
    let rafId: number;

    function captureFrame() {
      if (!capturing || !video) return;
      if (video.readyState < 2) return;
      if (video.currentTime === lastTime) return;
      lastTime = video.currentTime;

      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d");
      if (!ctx || !video) return;
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(offscreen);
    }

    function loop() {
      if (!capturing) return;
      captureFrame();
      if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        (video as any).requestVideoFrameCallback(loop);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    }

    const onLoaded = () => {
      video.play().catch(() => {});
      if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        (video as any).requestVideoFrameCallback(loop);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };

    const onEnded = () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      framesRef.current = frames;
      setFramesReady(true);
    };

    if (video.readyState >= 1) {
      onLoaded();
    } else {
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
    }
    video.addEventListener("ended", onEnded, { once: true });

    return () => {
      capturing = false;
      cancelAnimationFrame(rafId);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
      video.pause();
    };
  }, []);

  /* ── Effect 2: Boomerang render ── */
  useEffect(() => {
    if (!framesReady) return;
    const canvas = displayCanvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length === 0) return;

    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let index = 0;
    let direction = 1;
    let last = performance.now();
    const interval = 1000 / 30;
    let rafId: number;

    function render(now: number) {
      if (now - last >= interval) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        ctx!.drawImage(frames[index], 0, 0);
        index += direction;
        if (index >= frames.length - 1) {
          index = frames.length - 1;
          direction = -1;
        } else if (index <= 0) {
          index = 0;
          direction = 1;
        }
        last = now;
      }
      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  /* ── Effect 3: Parallax mouse tracking (GSAP) ── */
  useEffect(() => {
    const el = videoBgRef.current;
    if (!el) return;

    const strength = 20;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number;

    const onMouse = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    };

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      gsap.set(el, { x: currentX, y: currentY });
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMouse);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="bg-cream-50 dark:bg-black text-charcoal-900 dark:text-white font-body overflow-x-hidden">
      {/* ── Fixed video background ── */}
      <div
        ref={videoBgRef}
        className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center"
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ display: framesReady ? "none" : "block" }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover"
          style={{ display: framesReady ? "block" : "none" }}
        />
      </div>

      {/* ── Dark gradient overlay (fixed) ── */}
      <div className="fixed top-0 left-0 w-full h-full z-[1] bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none" />

      {/* ── Scrim at bottom of first viewport for smooth scroll transition ── */}
      <div className="fixed bottom-0 left-0 w-full h-48 z-[2] bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* ── Hero title ── */}
      <div
        className={`fixed left-0 right-0 z-20 w-full px-4 transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
        style={{ top: "126px" }}
      >
        <h1 className="hero-title select-none">{t("heroTitle")}</h1>
      </div>

      {/* ── Bottom row (hero CTA) ── */}
      <div
        className={`fixed bottom-12 left-0 right-0 px-4 sm:px-10 flex items-end justify-between z-20 transition-all duration-1000 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <p className="text-sm font-[family-name:var(--font-barlow)] font-light text-charcoal-700/75 dark:text-white/75 max-w-[220px] leading-relaxed hidden md:block">
          {t("leftBlurb")}
        </p>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col sm:flex-row items-center gap-3">
          <button className="group relative bg-white text-black text-sm font-[family-name:var(--font-barlow)] font-medium rounded-full px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03]">
            <span className="relative z-10">{t("startGenerating")}</span>
            <span className="absolute inset-0 bg-gradient-to-b from-white to-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
          <button className="liquid-glass group text-white text-sm font-[family-name:var(--font-barlow)] font-medium rounded-full px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)]">
            {t("seeTemplates")}
          </button>
        </div>

        <p className="text-sm font-[family-name:var(--font-barlow)] font-light text-charcoal-700/75 dark:text-white/75 max-w-[220px] leading-relaxed text-right hidden md:block">
          {t("rightBlurb")}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
         SCROLLABLE CONTENT (below the fold)
         ═══════════════════════════════════════════════ */}
      <section className="relative z-30 mt-screen min-h-screen bg-cream-50/95 dark:bg-black/95 backdrop-blur-sm px-4 sm:px-10 pt-32 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Section label */}
          <div className="mb-16">
            <span className="font-[family-name:var(--font-barlow)] text-[0.6rem] font-medium tracking-[0.2em] uppercase text-charcoal-600/40 dark:text-white/40">
              {t("capEyebrow")}
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-[family-name:var(--font-instrument)] italic leading-[0.95] mt-3">
              {t("capTitle1")}
              <br />
              <span className="text-charcoal-700/60 dark:text-white/60">{t("capTitle2")}</span>
            </h2>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: t("feature1Title"), desc: t("feature1Desc") },
              { icon: Layers, title: t("feature2Title"), desc: t("feature2Desc") },
              { icon: Zap, title: t("feature3Title"), desc: t("feature3Desc") },
              { icon: Palette, title: t("feature4Title"), desc: t("feature4Desc") },
              { icon: Sparkles, title: t("feature5Title"), desc: t("feature5Desc") },
              { icon: Layers, title: t("feature6Title"), desc: t("feature6Desc") },
            ].map((f, i) => (
              <div
                key={i}
                className="group border border-charcoal-200/50 dark:border-white/5 hover:border-charcoal-300/70 dark:hover:border-white/10 transition-all duration-300 p-6 rounded-2xl hover:bg-charcoal-50 dark:hover:bg-white/[0.02]"
              >
                <f.icon size={20} className="text-charcoal-600/60 dark:text-white/40 mb-4" />
                <h3 className="text-base font-[family-name:var(--font-barlow)] font-medium text-charcoal-800 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm font-[family-name:var(--font-barlow)] font-light text-charcoal-600/70 dark:text-white/50 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-24 border-t border-charcoal-200/50 dark:border-white/5" />

          {/* Process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
            {[
              { step: "01", title: t("step1Title"), desc: t("step1Desc") },
              { step: "02", title: t("step2Title"), desc: t("step2Desc") },
              { step: "03", title: t("step3Title"), desc: t("step3Desc") },
            ].map((p) => (
              <div key={p.step}>
                <div className="font-[family-name:var(--font-instrument)] italic text-5xl text-charcoal-300/50 dark:text-white/10 mb-4">
                  {p.step}
                </div>
                <h3 className="text-lg font-[family-name:var(--font-barlow)] font-medium text-charcoal-800 dark:text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-sm font-[family-name:var(--font-barlow)] font-light text-charcoal-600/70 dark:text-white/50 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center border-t border-charcoal-200/50 dark:border-white/5 pt-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-[family-name:var(--font-instrument)] italic leading-[0.95] text-charcoal-800 dark:text-white">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 text-sm font-[family-name:var(--font-barlow)] font-light text-charcoal-600/60 dark:text-white/40 max-w-md mx-auto">
              {t("ctaBody")}
            </p>
            <button className="group mt-8 inline-flex items-center gap-2 bg-white text-black text-sm font-[family-name:var(--font-barlow)] font-medium rounded-full px-8 py-4 transition-all duration-200 hover:shadow-[0_0_32px_8px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.97]">
              {t("startGenerating")}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Footer */}
          <div className="mt-24 pt-8 border-t border-charcoal-200/50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-[family-name:var(--font-barlow)] font-light text-charcoal-500/60 dark:text-white/30">
            <span>{t("copyright")}</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-charcoal-800 dark:hover:text-white/60 transition-colors">{t("privacy")}</a>
              <a href="#" className="hover:text-charcoal-800 dark:hover:text-white/60 transition-colors">{t("terms")}</a>
              <a href="#" className="hover:text-charcoal-800 dark:hover:text-white/60 transition-colors">{t("docs")}</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}