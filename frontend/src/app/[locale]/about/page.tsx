import type { Metadata } from "next";
import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import TeamGrid from "@/components/TeamGrid";
import PageHeader from "@/components/PageHeader";
import { CardCorners } from "@/components/FrameCorner";
import { Award, Users, Leaf, Gem, ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const stats = [
    { icon: Award, value: "15,000+", label: t("stat1") },
    { icon: Users, value: "4,500+", label: t("stat2") },
    { icon: Leaf, value: "100%", label: t("stat3") },
    { icon: Gem, value: "500+", label: t("stat4") },
  ];

  const studioItems = [
    t("studioItem1"),
    t("studioItem2"),
    t("studioItem3"),
    t("studioItem4"),
  ];

  return (
    <>
      {/* Header */}
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("title1")} <br className="hidden sm:block" />
            <span className="italic text-gold-400">{t("title2")}</span>
          </>
        }
        description={t("description")}
        image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
      />

      {/* Heritage */}
      <section className="py-24 sm:py-32 bg-cream-50 dark:bg-[#0a0a08] relative overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(212,168,56,0.05) 0%, transparent 65%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection variant="fade-up">
              <div className="flex items-center gap-4">
                <span
                  className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/50"
                  aria-hidden="true"
                />
                <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold-400/70">
                  {t("heritageEyebrow")}
                </span>
              </div>
              <h2 className="mt-5 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white leading-tight">
                {t("heritageTitle")} <span className="italic text-gold-400">{t("heritageTitleAccent")}</span>
              </h2>
              <div className="mt-8 space-y-5 text-charcoal-700 dark:text-white/55 leading-relaxed">
                <p>{t("heritageP1")}</p>
                <p>{t("heritageP2")}</p>
                <p className="border-l-2 border-gold-500/40 dark:border-gold-400/40 pl-5 text-charcoal-800 dark:text-white/70 italic">
                  {t("heritageP3")}
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fade-up" delay={0.15} className="relative">
              <div className="relative">
                {/* Gold frame border echoing the studio's craft */}
                <div className="absolute -inset-3 border border-gold-400/15 pointer-events-none" />
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&q=80"
                    alt="Inside the FrameCraft Patan workshop"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/60 to-transparent" />
                  <div className="absolute inset-3 border border-white/10 pointer-events-none" />
                </div>
                <CardCorners className="opacity-60" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-gold-500 text-[#0a0a08] px-7 py-5 shadow-xl shadow-gold-500/20">
                <div className="font-heading text-4xl font-bold leading-none">25+</div>
                <div className="mt-1 font-mono text-[0.55rem] tracking-[0.2em] uppercase">
                  {t("yearsBadge1")}
                  <br />
                  {t("yearsBadge2")}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-cream-100 dark:bg-black border-y border-charcoal-200/50 dark:border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.08} className="group text-center">
                <div className="w-12 h-12 mx-auto border border-gold-400/20 flex items-center justify-center group-hover:border-gold-400/50 transition-colors duration-500">
                  <stat.icon size={20} className="text-gold-400" />
                </div>
                <div className="mt-5 font-heading text-3xl font-bold text-charcoal-900 dark:text-white">{stat.value}</div>
                <div className="mt-1.5 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/40">
                  {stat.label}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 sm:py-32 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <div className="flex items-center justify-center gap-4">
              <span className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/50" aria-hidden="true" />
              <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold-400/70">
                {t("teamEyebrow")}
              </span>
              <span className="w-10 h-px bg-gradient-to-l from-transparent to-gold-400/50" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
              {t("teamTitle")} <span className="italic text-gold-400">{t("teamTitleAccent")}</span>
            </h2>
            <p className="mt-4 text-charcoal-600 dark:text-white/50 max-w-lg mx-auto">
              {t("teamBody")}
            </p>
          </AnimatedSection>

          <TeamGrid />
        </div>
      </section>

      {/* Studio */}
      <section className="py-24 sm:py-32 bg-cream-50 dark:bg-black relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,168,56,0.04) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <AnimatedSection variant="fade-up" className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80",
                  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80",
                  "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80",
                  "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=400&q=80",
                ].map((src, i) => (
                  <div
                    key={src}
                    className={`relative h-44 sm:h-52 overflow-hidden group ${
                      i % 2 === 1 ? "mt-8" : ""
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 border border-white/10 group-hover:border-gold-400/30 transition-colors duration-500 pointer-events-none" />
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fade-up" delay={0.12} className="order-1 lg:order-2">
              <div className="flex items-center gap-4">
                <span
                  className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/50"
                  aria-hidden="true"
                />
                <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold-400/70">
                  {t("studioEyebrow")}
                </span>
              </div>
              <h2 className="mt-5 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white leading-tight">
                {t("studioTitle")} <span className="italic text-gold-400">{t("studioTitleAccent")}</span>
              </h2>
              <p className="mt-5 text-charcoal-700 dark:text-white/55 leading-relaxed">
                {t("studioBody")}
              </p>
              <ul className="mt-8 space-y-3.5">
                {studioItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-charcoal-700 dark:text-white/60">
                    <span className="w-1.5 h-1.5 bg-gold-400 rotate-45" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/booking"
                className="group mt-10 inline-flex items-center gap-2 border border-charcoal-300 text-charcoal-900 dark:border-white/20 dark:text-white rounded-full px-8 py-4 text-sm tracking-wider uppercase font-medium transition-[color,background-color,border-color] duration-300 hover:border-gold-500/60 hover:text-gold-600 dark:hover:border-gold-400/50 dark:hover:text-gold-300 hover:bg-gold-400/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-black"
              >
                {t("scheduleVisit")}
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </>
  );
}
