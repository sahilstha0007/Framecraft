"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { frames, galleryItems, services } from "@/lib/data";
import type { Frame, GalleryItem, Service } from "@/lib/types";
import { useLocalizedCollection } from "@/lib/useLocalizedCollection";
import { useTranslations } from "next-intl";
import Hero from "@/components/Hero";
import FrameCard from "@/components/FrameCard";
import ServiceCard from "@/components/ServiceCard";
import ImageZoom from "@/components/ImageZoom";
import PathMarqueeSection from "@/components/PathMarqueeSection";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import ContactForm from "@/components/ContactForm";
import ScrollReveal from "@/components/ScrollReveal";
import TrendingNow from "@/components/TrendingNow";
import PickedForYou from "@/components/PickedForYou";
import dynamic from "next/dynamic";

// Shared placeholder for the assembly section — shown both while the chunk
// downloads AND until the section approaches the viewport (see below).
function FrameAssemblyFallback() {
  const t = useTranslations("assembly");
  return (
    <section className="relative min-h-screen w-full bg-cream-50 dark:bg-[#0a0a08] flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center gap-6">
        {/* Gold ring spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border border-gold-400/20 rounded-full" />
          <motion.div
            className="absolute inset-0 border-t border-gold-400/60 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-charcoal-500 dark:text-white/30">
            {t("preparing")}
          </span>
          {/* Dots animation */}
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-gold-400/40"
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const FrameAssemblySection = dynamic(
  () => import("@/components/FrameAssemblySection"),
  {
    ssr: false,
    loading: FrameAssemblyFallback,
  }
);

/* ── Viewport-deferred heavy section (bundle-conditional) ────────────────
   The 3D assembly scene pulls in three.js + react-three-fiber + drei — by
   far the largest client bundle in the app (~26 MB in dev). `next/dynamic`
   alone still downloads it right after hydration, even though the section
   sits several viewports below the fold. This wrapper only mounts it once
   the section is ~1 viewport away, keeping it out of the initial critical
   path entirely. */
function LazyFrameAssemblySection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      // Start loading a full viewport before the section scrolls into view,
      // so the 3D scene is ready (and cached) by the time the user arrives.
      { rootMargin: "900px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {ready ? <FrameAssemblySection /> : <FrameAssemblyFallback />}
    </div>
  );
}
import {
  HorizontalScroll,
  HScrollItem,
  HoverSwapCard,
  Marquee,
  DepthParallax,
  ScrollCounter,
} from "@/components/ScrollSections";
import FrameCorner, { CardCorners } from "@/components/FrameCorner";
import {
  MagneticCard,
  ScrollWave,
  PerspectiveReveal,
  BlurReveal,
  KineticHeadline,
  MorphDivider,
  ScrollGradient,
  SplitDrift,
} from "@/components/ScrollEffects";
import { ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";

const trustLogos = [
  { label: "Siddhartha Art Gallery" }, { label: "Nepal Art Council" }, { label: "NAFA" },
  { label: "Park Gallery" }, { label: "Taragaon Museum" }, { label: "Kathmandu Art Gallery" },
  { label: "National Museum of Nepal" }, { label: "Dwarika's Hotel" },
];

// Shared pill CTA — consistent hover / focus affordance across home sections.
// Transition list is explicit (no `transition-all`) so only color, border,
// background and shadow animate — never layout properties.
const ctaPill =
  "group inline-flex items-center gap-2 border border-charcoal-300 text-charcoal-900 dark:border-white/20 dark:text-white rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium transition-[color,background-color,border-color,box-shadow] duration-300 " +
  "hover:border-gold-500/60 hover:text-gold-600 dark:hover:border-gold-400/50 dark:hover:text-gold-300 hover:bg-gold-400/[0.06] hover:shadow-[0_0_24px_rgba(212,168,56,0.15)] " +
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-black";

export default function Home() {
  const t = useTranslations("home");
  const [zoomIndex, setZoomIndex] = useState(-1);

  // Live collections from the API — fall back to the bundled catalog.
  const { data: liveFrames } = useLocalizedCollection<Frame>("frames", frames);
  const { data: liveGallery } = useLocalizedCollection<GalleryItem>("gallery", galleryItems);
  const { data: liveServices } = useLocalizedCollection<Service>("services", services);

  const statItems = [
    { target: 25, suffix: "+", label: t("stat1") },
    { target: 15000, suffix: "+", label: t("stat2") },
    { target: 500, suffix: "+", label: t("stat3") },
    { target: 98, suffix: "%", label: t("stat4") },
  ];

  const craftFeatures = [
    { label: t("craftFeature1Title"), desc: t("craftFeature1Desc") },
    { label: t("craftFeature2Title"), desc: t("craftFeature2Desc") },
    { label: t("craftFeature3Title"), desc: t("craftFeature3Desc") },
  ];

  const featuredFrames = liveFrames.filter((f) => f.popular);
  const galleryPreview = liveGallery.slice(0, 6);
  const zoomImages = galleryPreview.map((g) => ({ image: g.image, title: g.title }));

  // Surface the most Nepal-relevant services on the home page (custom framing,
  // thangka & paubha framing, dubo mala preservation). Falls back to the first
  // three services if a stale backend hasn't seeded the new Nepal services yet.
  const NEPAL_SERVICE_IDS = [1, 8, 9];
  const homeServices = NEPAL_SERVICE_IDS.every((id) =>
    liveServices.some((s) => s.id === id)
  )
    ? liveServices.filter((s) => NEPAL_SERVICE_IDS.includes(s.id))
    : liveServices.slice(0, 3);

  return (
    <>
      <Hero />

      {/* ── SCROLL-DRIVEN FRAME ASSEMBLY (viewport-deferred, see above) ── */}
      <LazyFrameAssemblySection />

      {/* ── TRUST BAR ── */}
      <section className="relative py-9 bg-cream-100 dark:bg-black border-y border-charcoal-200/50 dark:border-white/[0.03] overflow-hidden">
        <span className="sr-only">{t("trustedBy")}</span>
        {/* Edge fades so logos melt out of frame */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-cream-100 dark:from-black to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-cream-100 dark:from-black to-transparent z-10" />
        <Marquee items={trustLogos} speed={22} />
      </section>

      {/* ── AS SEEN IN / PRESS ── */}
      <section className="py-24 bg-cream-50 dark:bg-black relative overflow-hidden">
        {/* Faint gold bloom behind the masthead */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px]"
          style={{ background: "radial-gradient(ellipse at top, rgba(212,168,56,0.05) 0%, transparent 65%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <ScrollReveal>
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/40" aria-hidden="true" />
                <FrameCorner size={14} className="text-gold-400/40" />
                <span className="w-10 h-px bg-gradient-to-l from-transparent to-gold-400/40" aria-hidden="true" />
              </div>
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-gold-400/60">
                {t("asFeaturedIn")}
              </span>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-x-8 gap-y-10 items-center justify-items-center">
            {[
              "The Kathmandu Post",
              "Kantipur",
              "The Himalayan Times",
              "Annapurna Post",
              "Nepal Traveller",
            ].map((pub, i) => (
              <motion.div
                key={pub}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative"
              >
                <span className="block font-heading italic text-lg sm:text-xl md:text-2xl text-charcoal-400 dark:text-white/15 group-hover:text-gold-600 dark:group-hover:text-gold-300/80 transition-colors duration-500 tracking-tight select-none whitespace-nowrap">
                  {pub}
                </span>
                <span
                  className="absolute -bottom-2 left-0 right-0 mx-auto w-full max-w-[80%] h-px bg-gold-400/40 scale-x-0 group-hover:scale-x-100 transition-[transform] duration-500 origin-center"
                  aria-hidden="true"
                />
              </motion.div>
            ))}
          </div>
          <ScrollReveal delay={0.2}>
            <div className="text-center mt-14">
              <span className="font-mono text-[0.5rem] tracking-[0.35em] uppercase text-charcoal-400/60 dark:text-white/10">
                {t("andOthers")}
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Section accent divider ── */}
      <div className="bg-cream-100 dark:bg-black flex justify-center">
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
      </div>

      {/* ── CRAFT: SplitDrift + BlurReveal + PerspectiveReveal ── */}
      <SplitDrift
        leftSpeed={0.15}
        rightSpeed={0.35}
        className="min-h-screen bg-cream-50 dark:bg-black px-4 sm:px-8 lg:px-16 py-32 items-center"
        left={
          <PerspectiveReveal startAngle={60}>
            <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
              {t("craftEyebrow")}
            </span>
            <KineticHeadline
              text={t("craftTitle")}
              className="mt-4 text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-charcoal-900 dark:text-white leading-[1.05]"
              stagger={0.025}
            />
            <p className="mt-6 text-charcoal-600 dark:text-white/50 leading-relaxed max-w-md text-base">
              {t("craftBody")}
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {craftFeatures.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="group relative p-5 border border-charcoal-200/60 dark:border-white/[0.06] hover:border-gold-500/40 dark:hover:border-gold-400/25 transition-[border-color] duration-500"
                >
                  <CardCorners className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[0.55rem] tracking-[0.2em] text-gold-400/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px w-6 bg-gold-400/20 group-hover:bg-gold-400/50 transition-colors duration-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-heading font-semibold text-charcoal-900 dark:text-white">{item.label}</h3>
                  <p className="mt-1.5 text-xs text-charcoal-600 dark:text-white/40 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </PerspectiveReveal>
        }
        right={
          <div className="relative h-[50vh] sm:h-[65vh] w-full">
            <BlurReveal
              src="https://images.unsplash.com/photo-1582053628662-c65b0e0544e9?w=800&q=80"
              className="absolute inset-0"
            />
            {/* Fine frame border echoing the studio's craft */}
            <div className="absolute inset-4 border border-gold-400/15 pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-4 pointer-events-none" aria-hidden="true">
              <FrameCorner size={18} className="absolute top-0 left-0 text-gold-400/60" />
              <FrameCorner size={18} position="top-right" className="absolute top-0 right-0 text-gold-400/60" />
              <FrameCorner size={18} position="bottom-left" className="absolute bottom-0 left-0 text-gold-400/60" />
              <FrameCorner size={18} position="bottom-right" className="absolute bottom-0 right-0 text-gold-400/60" />
            </div>
            <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-gold-500 text-black font-mono text-[0.55rem] tracking-wider uppercase shadow-lg shadow-gold-500/20">
              {t("estBadge")}
            </div>
          </div>
        }
      />

      <MorphDivider />

      {/* ── STATS: ScrollGradient + ScrollWave ── */}
      <ScrollGradient
        colors={["#09090b", "#111", "#09090b"]}
        lightColors={["#fdfbf7", "#f5efe3", "#fdfbf7"]}
        className="py-28"
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <ScrollReveal>
              <span className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-gold-400/60">
                {t("statsEyebrow")}
              </span>
            </ScrollReveal>
          </div>
          <ScrollWave columns={4}>
            {statItems.map((s) => (
              <ScrollCounter key={s.label} target={s.target} suffix={s.suffix} label={s.label} />
            ))}
          </ScrollWave>
        </div>
      </ScrollGradient>

      <MorphDivider />

      {/* ── FEATURED FRAMES: HorizontalScroll + MagneticCard ── */}
      <section className="bg-cream-50 dark:bg-black pt-20 pb-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <PerspectiveReveal startAngle={50}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
                    {t("featuredEyebrow")}
                  </span>
                  <span className="h-px w-8 bg-gold-400/30" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                  {t("featuredTitle")}
                </h2>
                <p className="mt-3 text-charcoal-600 dark:text-white/50 max-w-md">
                  {t("featuredBody")}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/30">
                <span className="text-gold-400/60">No. {String(featuredFrames.length).padStart(2, "0")}</span>
                <span>{t("inTheCatalogue")}</span>
              </div>
            </div>
          </PerspectiveReveal>
        </div>
        <HorizontalScroll>
          {featuredFrames.map((frame, i) => (
            <HScrollItem key={frame.id}>
              <div className="flex items-center justify-between mb-4 px-1 font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/30">
                <span className="text-gold-400/60">No. {String(i + 1).padStart(2, "0")}</span>
                <span>{frame.category}</span>
              </div>
              <MagneticCard strength={6} scrollTilt={3}>
                <FrameCard frame={frame} index={i} />
              </MagneticCard>
            </HScrollItem>
          ))}
        </HorizontalScroll>
        <div className="text-center pb-10 pt-4">
          <Link href="/frames" className={ctaPill}>
            {t("viewAllFrames")} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── TRENDING NOW: live marketplace signals (views/bids/reviews) ── */}
      <TrendingNow />

      {/* ── PICKED FOR YOU: browsing-history recommendations ── */}
      <PickedForYou />

      <MorphDivider />

      {/* ── BEFORE/AFTER: ScrollWave + KineticHeadline ── */}
      <section className="py-32 bg-cream-100 dark:bg-zinc-950 relative overflow-hidden">
        {/* Soft gold ambience */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,168,56,0.04) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-gold-400/30" aria-hidden="true" />
              <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
                {t("transformEyebrow")}
              </span>
              <span className="w-8 h-px bg-gold-400/30" aria-hidden="true" />
            </div>
            <KineticHeadline
              text={t("transformTitle")}
              className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white justify-center"
              stagger={0.02}
            />
            <p className="mt-3 text-charcoal-600 dark:text-white/50 max-w-lg mx-auto">
              {t("transformBody")}
            </p>
          </div>
          <ScrollWave columns={3}>
            {galleryPreview.slice(0, 6).map((item, i) => (
              <MagneticCard key={item.id} strength={5} scrollTilt={2}>
                <HoverSwapCard
                  primaryImage={item.image}
                  hoverImage={liveGallery[(i + 3) % liveGallery.length].image}
                  title={item.title}
                  subtitle={item.category}
                  onClick={() => setZoomIndex(i)}
                />
              </MagneticCard>
            ))}
          </ScrollWave>
          <div className="text-center mt-12">
            <Link href="/gallery" className={ctaPill}>
              {t("viewFullGallery")} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <MorphDivider />

      {/* ── GALLERY WALK: framed works travelling an SVG path (draggable) ── */}
      <PathMarqueeSection images={galleryPreview.map((g) => g.image)} />

      <MorphDivider />

      {/* ── SERVICES: MagneticCard + PerspectiveReveal ── */}
      <section className="py-32 bg-cream-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PerspectiveReveal startAngle={55}>
            <div className="text-center mb-14">
              <div className="flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-gold-400/30" aria-hidden="true" />
                <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
                  {t("servicesEyebrow")}
                </span>
                <span className="w-8 h-px bg-gold-400/30" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                {t("servicesTitle")}
              </h2>
              <p className="mt-3 text-charcoal-600 dark:text-white/50 max-w-lg mx-auto">
                {t("servicesBody")}
              </p>
            </div>
          </PerspectiveReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeServices.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <MagneticCard strength={5} scrollTilt={2}>
                  <PerspectiveReveal startAngle={40}>
                    <ServiceCard service={s} index={i} />
                  </PerspectiveReveal>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/services" className={ctaPill}>
              {t("allServices")} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS: wrapped in perspective ── */}
      <PerspectiveReveal startAngle={45}>
        <Testimonials />
      </PerspectiveReveal>

      {/* ── NEWSLETTER: wrapped in ScrollGradient ── */}
      <ScrollGradient colors={["#09090b", "#000000", "#09090b"]} lightColors={["#fdfbf7", "#f5efe3", "#fdfbf7"]}>
        <div className="pt-8">
          <ScrollReveal>
            <Newsletter />
          </ScrollReveal>
        </div>
      </ScrollGradient>

      {/* ── CONTACT: SplitDrift ── */}
      <section className="py-32 bg-cream-100 dark:bg-zinc-950 relative">
        {/* Subtle gold top accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <SplitDrift
              left={
                <PerspectiveReveal startAngle={50}>
                  <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70">
                    {t("contactEyebrow")}
                  </span>
                  <KineticHeadline
                    text={t("contactTitle")}
                    className="mt-4 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white"
                    stagger={0.025}
                  />
                  <p className="mt-4 text-charcoal-600 dark:text-white/50 leading-relaxed max-w-md">
                    {t("contactBody")}
                  </p>
                  <div className="mt-10 space-y-4">
                    {[
                      { label: t("contactStudio"), value: t("contactStudioValue"), icon: "map" },
                      { label: t("contactPhone"), value: t("contactPhoneValue"), icon: "phone" },
                      { label: t("contactEmail"), value: t("contactEmailValue"), icon: "mail" },
                      { label: t("contactHours"), value: t("contactHoursValue"), icon: "clock" },
                    ].map((item) => (
                      <div key={item.label} className="group flex items-start gap-4">
                        <span className="flex items-center justify-center w-9 h-9 border border-gold-400/20 group-hover:border-gold-400/50 text-gold-400/70 group-hover:text-gold-400 transition-colors duration-300 flex-shrink-0">
                          {item.icon === "map" && <MapPin size={15} />}
                          {item.icon === "phone" && <Phone size={15} />}
                          {item.icon === "mail" && <Mail size={15} />}
                          {item.icon === "clock" && <Clock size={15} />}
                        </span>
                        <div>
                          <span className="block font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-400/70">
                            {item.label}
                          </span>
                          <span className="block mt-1 text-sm text-charcoal-700 dark:text-white/60 leading-relaxed">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </PerspectiveReveal>
              }
              right={
                <div className="relative p-8 border border-charcoal-200/60 dark:border-white/[0.06] bg-charcoal-900/[0.02] dark:bg-white/[0.02]">
                  <CardCorners />
                  <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
                  <ContactForm />
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (depth parallax with bg image) ── */}
      <DepthParallax
        bgImage="https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=1920&q=80"
        bgSpeed={0.1}
        midSpeed={0.25}
        fgSpeed={0.4}
        height="min-h-screen"
        className="bg-cream-100 dark:bg-black"
        midChildren={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-3xl" />
          </div>
        }
        fgChildren={
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="text-center max-w-2xl">
              <ScrollReveal>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white leading-tight">
                  {t("finalTitle1")}
                  <br />
                  <span className="text-gold-400">{t("finalTitle2")}</span>
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="mt-6 text-white/50">{t("finalBody")}</p>
                <div className="mt-10 flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/booking"
                    className="inline-flex items-center gap-2 bg-white text-black rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium transition-[transform,box-shadow] duration-300 hover:shadow-[0_0_32px_8px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.97]"
                  >
                    {t("startYourProject")} <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 border border-white/20 text-white rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium hover:bg-white/10 transition-[background-color] duration-300"
                  >
                    {t("getQuote")}
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        }
      />

      {/* Image Zoom */}
      <ImageZoom
        images={zoomImages}
        currentIndex={zoomIndex}
        isOpen={zoomIndex >= 0}
        onClose={() => setZoomIndex(-1)}
        onPrev={() => setZoomIndex((p) => (p > 0 ? p - 1 : zoomImages.length - 1))}
        onNext={() => setZoomIndex((p) => (p < zoomImages.length - 1 ? p + 1 : 0))}
      />
    </>
  );
}
