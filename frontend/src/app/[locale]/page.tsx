"use client";

import ScrollReveal from "@/components/ScrollReveal";
import HomeHero from "@/components/HomeHero";
import CategoryRail from "@/components/CategoryRail";
import AuctionStrip from "@/components/AuctionStrip";
import ArtistShowcase from "@/components/ArtistShowcase";
import StoriesTeaser from "@/components/StoriesTeaser";
import HomeFinale from "@/components/HomeFinale";
import TrendingNow from "@/components/TrendingNow";
import PickedForYou from "@/components/PickedForYou";
import MarketplacePulse from "@/components/MarketplacePulse";
import ParallaxWordBand from "@/components/ParallaxWordBand";
import Newsletter from "@/components/Newsletter";
import { MorphDivider, ScrollGradient } from "@/components/ScrollEffects";
import { useTranslations } from "next-intl";

const NEWSLETTER_GRADIENT = {
  colors: ["#09090b", "#000000", "#09090b"],
  lightColors: ["#f8fafc", "#f1f5f9", "#f8fafc"],
};

export default function Home() {
  const t = useTranslations("home");

  return (
    <>
      <HomeHero />

      <CategoryRail />

      {/* ── TRENDING NOW: live marketplace signals (views/bids/reviews) ── */}
      <TrendingNow />

      <MorphDivider />

      {/* ── THE AUCTION ROOM ── */}
      <AuctionStrip />

      <MorphDivider />

      {/* ── PICKED FOR YOU: browsing-history recommendations ── */}
      <PickedForYou />

      {/* ── MARKETPLACE PULSE: fresh arrivals + live activity feed ── */}
      <MarketplacePulse />

      <ParallaxWordBand words={t.raw("wordBand") as string[]} />

      {/* ── THE ARTISTS ── */}
      <ArtistShowcase />

      <MorphDivider />

      {/* ── STORIES ── */}
      <StoriesTeaser />

      {/* ── NEWSLETTER ── */}
      <ScrollGradient
        colors={NEWSLETTER_GRADIENT.colors}
        lightColors={NEWSLETTER_GRADIENT.lightColors}
      >
        <div className="pt-8">
          <ScrollReveal>
            <Newsletter />
          </ScrollReveal>
        </div>
      </ScrollGradient>

      {/* ── THE FINALE: three-layer depth parallax ── */}
      <HomeFinale />
    </>
  );
}
