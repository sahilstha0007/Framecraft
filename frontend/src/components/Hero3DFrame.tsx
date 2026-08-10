"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const artworks = [
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80",
  "https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?w=600&q=80",
  "https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=600&q=80",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80",
  "https://images.unsplash.com/photo-1529254479751-faeedc59e78f?w=600&q=80",
  "https://images.unsplash.com/photo-1515288207449-100e125abccb?w=600&q=80",
];

const frameColors = [
  { border: "#8b663a", inner: "#6e4f2e" },  // walnut
  { border: "#d4a838", inner: "#bf9330" },  // gold
  { border: "#404040", inner: "#262626" },  // charcoal
  { border: "#5a3a22", inner: "#472d1a" },  // mahogany
];

export default function Hero3DFrame() {
  const [artIndex, setArtIndex] = useState(0);
  const [nextArt, setNextArt] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 30 });
  const autoRotate = useMotionValue(0);
  const smoothRotate = useSpring(autoRotate, { stiffness: 40, damping: 35 });
  const rafRef = useRef<number>(0);

  // Auto-rotate
  useEffect(() => {
    let start = Date.now();
    function tick() {
      const elapsed = (Date.now() - start) / 1000;
      autoRotate.set(Math.sin(elapsed * 0.15) * 12);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoRotate]);

  // Swap artwork every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      const next = (artIndex + 1) % artworks.length;
      setNextArt(artworks[next]);
      setSwapping(true);
      setTimeout(() => {
        setArtIndex(next);
        setColorIndex((prev) => (prev + 1) % frameColors.length);
        setSwapping(false);
      }, 600);
    }, 4000);
    return () => clearInterval(interval);
  }, [artIndex]);

  // Mouse tracking
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX.set(((e.clientX - cx) / cx) * 6);
      mouseY.set(((e.clientY - cy) / cy) * 6);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  const colors = frameColors[colorIndex];

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient glow */}
      <div className="absolute w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[100px]" />

      <motion.div
        style={{
          rotateX: smoothY,
          rotateY: smoothRotate,
          perspective: 1000,
        }}
        className="relative"
      >
        {/* Outer frame */}
        <div
          className="relative"
          style={{
            width: 340,
            height: 440,
            border: `10px solid ${colors.border}`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 3px ${colors.inner}`,
          }}
        >
          {/* Artwork container */}
          <div className="absolute inset-0 overflow-hidden bg-black">
            {/* Current artwork */}
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${artworks[artIndex]})` }}
              animate={{ opacity: swapping ? 0 : 1, scale: swapping ? 0.95 : 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            {/* Next artwork (crossfade in) */}
            {nextArt && (
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${nextArt})` }}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: swapping ? 1 : 0, scale: swapping ? 1 : 1.05 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            )}
          </div>

          {/* Inner shadow/glass reflection */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.15) 100%)",
          }} />

          {/* Frame corner accents */}
          <svg className="absolute top-0 left-0 w-6 h-6 text-gold-400/30" viewBox="0 0 24 24">
            <path d="M 1,23 L 1,1 L 23,1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <svg className="absolute top-0 right-0 w-6 h-6 text-gold-400/30" viewBox="0 0 24 24" style={{ transform: "rotate(90deg)" }}>
            <path d="M 1,23 L 1,1 L 23,1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-6 h-6 text-gold-400/30" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
            <path d="M 1,23 L 1,1 L 23,1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <svg className="absolute bottom-0 right-0 w-6 h-6 text-gold-400/30" viewBox="0 0 24 24" style={{ transform: "rotate(180deg)" }}>
            <path d="M 1,23 L 1,1 L 23,1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          {/* Mat/caption */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="font-mono text-[0.5rem] tracking-[0.25em] uppercase text-walnut-600 dark:text-white/30">
              Artwork &mdash; Framed
            </span>
          </div>
        </div>
      </motion.div>

      {/* Decorative orbit rings */}
      <div className="absolute w-[500px] h-[500px] border border-walnut-500/10 dark:border-white/[0.03] rounded-full" />
      <div className="absolute w-[600px] h-[600px] border border-walnut-500/8 dark:border-white/[0.02] rounded-full" />
    </div>
  );
}