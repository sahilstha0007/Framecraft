import type { Metadata } from "next";
import AnimatedSection from "@/components/AnimatedSection";
import ServicesGrid from "@/components/ServicesGrid";
import PageHeader from "@/components/PageHeader";
import { CardCorners } from "@/components/FrameCorner";
import { Shield, Award, Heart, Clock, ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("servicesTitle"),
    description: t("servicesDescription"),
  };
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("servicesPage");

  const promises = [
    { icon: Award, title: t("promise1Title"), desc: t("promise1Desc") },
    { icon: Shield, title: t("promise2Title"), desc: t("promise2Desc") },
    { icon: Heart, title: t("promise3Title"), desc: t("promise3Desc") },
    { icon: Clock, title: t("promise4Title"), desc: t("promise4Desc") },
  ];

  const process = [
    { step: "01", title: t("step1Title"), desc: t("step1Desc") },
    { step: "02", title: t("step2Title"), desc: t("step2Desc") },
    { step: "03", title: t("step3Title"), desc: t("step3Desc") },
    { step: "04", title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <>
      {/* Header */}
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("title")} <span className="italic text-gold-400">{t("titleAccent")}</span>
          </>
        }
        description={t("description")}
        image="https://images.unsplash.com/photo-1527751171053-6ac5ec50000b?w=1920&q=85"
      />

      {/* Services Grid */}
      <section className="py-20 sm:py-28 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesGrid />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 sm:py-32 bg-cream-50 dark:bg-black relative overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(212,168,56,0.05) 0%, transparent 65%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <div className="flex items-center justify-center gap-4">
              <span className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/50" aria-hidden="true" />
              <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold-400/70">
                {t("whyEyebrow")}
              </span>
              <span className="w-10 h-px bg-gradient-to-l from-transparent to-gold-400/50" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
              {t("whyTitle")} <span className="italic text-gold-400">{t("whyTitleAccent")}</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {promises.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.1} className="group">
                <div className="relative h-full p-8 border border-charcoal-200/60 dark:border-white/[0.06] hover:border-gold-500/40 dark:hover:border-gold-400/25 transition-[border-color] duration-500">
                  {/* Corner brackets fade in on hover */}
                  <CardCorners className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-14 h-14 border border-gold-400/25 group-hover:border-gold-400/60 bg-gold-400/[0.04] group-hover:bg-gold-400/10 flex items-center justify-center transition-[border-color,background-color] duration-500">
                    <item.icon size={24} className="text-gold-400" />
                  </div>
                  <h3 className="mt-6 font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2.5 text-sm text-charcoal-600 dark:text-white/45 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 sm:py-32 bg-cream-100 dark:bg-[#0a0a08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <div className="flex items-center justify-center gap-4">
              <span className="w-10 h-px bg-gradient-to-r from-transparent to-gold-400/50" aria-hidden="true" />
              <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-gold-400/70">
                {t("processEyebrow")}
              </span>
              <span className="w-10 h-px bg-gradient-to-l from-transparent to-gold-400/50" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
              {t("processTitle")} <span className="italic text-gold-400">{t("processTitleAccent")}</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 relative">
            {/* Connecting hairline (desktop) */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />
            {process.map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 0.12} className="group text-center relative">
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center border border-gold-400/25 bg-cream-100 dark:bg-[#0a0a08] group-hover:border-gold-400/60 group-hover:bg-gold-400/[0.06] transition-[border-color,background-color] duration-500">
                  <span className="font-heading text-xl font-bold text-gold-400">{item.step}</span>
                </div>
                <h3 className="mt-6 font-heading text-lg font-semibold text-charcoal-900 dark:text-white">{item.title}</h3>
                <p className="mt-2.5 text-sm text-charcoal-600 dark:text-white/45 leading-relaxed max-w-[240px] mx-auto">{item.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-cream-50 dark:bg-black relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(212,168,56,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
              {t("ctaTitle")} <span className="italic text-gold-400">{t("ctaTitleAccent")}</span>
            </h2>
            <p className="mt-4 text-charcoal-600 dark:text-white/50">
              {t("ctaBody")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link
                href="/booking"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gold-500 hover:bg-gold-600 text-[#0a0a08] text-sm font-medium tracking-wider uppercase rounded-full transition-[background-color] duration-300"
              >
                {t("bookConsultation")}
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 border border-charcoal-300 text-charcoal-900 dark:border-white/20 dark:text-white text-sm font-medium tracking-wider uppercase rounded-full hover:bg-charcoal-900/10 dark:hover:bg-white/10 transition-[background-color] duration-300"
              >
                {t("contactUs")}
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
