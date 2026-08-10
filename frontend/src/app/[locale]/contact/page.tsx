import type { Metadata } from "next";
import AnimatedSection from "@/components/AnimatedSection";
import PageHeader from "@/components/PageHeader";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import PaymentMethods from "@/components/PaymentMethods";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");

  const contactItems = [
    {
      icon: MapPin,
      label: t("addressLabel"),
      value: t("addressValue"),
      href: "https://maps.google.com/?q=Kumaripati+Lalitpur+Nepal",
      cta: t("getDirections"),
    },
    {
      icon: Phone,
      label: t("phoneLabel"),
      value: t("phoneValue"),
      href: "tel:+97715531234",
      cta: t("callStudio"),
    },
    {
      icon: Mail,
      label: t("emailLabel"),
      value: t("emailValue"),
      href: "mailto:hello@framecraft.com.np",
      cta: t("sendEmail"),
    },
    {
      icon: Clock,
      label: t("hoursLabel"),
      value: t("hoursValue"),
      href: null,
      cta: null,
    },
  ];

  // Brand icons are inline SVGs — lucide-react no longer ships brand marks.
  const socials = [
    { label: "Instagram", href: "#", icon: InstagramIcon },
    { label: "Facebook", href: "#", icon: FacebookIcon },
    { label: "Pinterest", href: "#", icon: PinterestIcon },
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
        image="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=85"
      />

      {/* Contact Section */}
      <section className="py-20 sm:py-28 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* Contact Info */}
            <AnimatedSection variant="fade-up" className="space-y-10">
              <div>
                <h2 className="text-2xl font-heading font-bold text-charcoal-900 dark:text-white">
                  {t("visitTitle")} <span className="italic text-gold-400">{t("visitTitleAccent")}</span>
                </h2>
                <p className="mt-3 text-charcoal-600 dark:text-white/50 leading-relaxed">
                  {t("visitBody")}
                </p>
              </div>

              {/* Info rows */}
              <div className="space-y-3">
                {contactItems.map((item) => (
                  <div
                    key={item.label}
                    className="group flex items-start gap-5 p-5 border border-charcoal-200/60 dark:border-white/[0.06] hover:border-gold-500/40 dark:hover:border-gold-400/25 transition-colors duration-500"
                  >
                    <span className="flex items-center justify-center w-12 h-12 border border-gold-400/20 group-hover:border-gold-400/50 text-gold-400 flex-shrink-0 transition-colors duration-500">
                      <item.icon size={19} />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-mono text-[0.55rem] tracking-[0.25em] uppercase text-gold-400/70">
                        {item.label}
                      </span>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="mt-1.5 block text-sm text-charcoal-800 dark:text-white/70 hover:text-gold-600 dark:hover:text-gold-300 transition-colors whitespace-pre-line"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1.5 text-sm text-charcoal-800 dark:text-white/70 whitespace-pre-line leading-relaxed">
                          {item.value}
                        </p>
                      )}
                      {item.cta && (
                        <span className="mt-2 inline-flex items-center gap-1 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-400/50 group-hover:text-gold-300 transition-colors duration-500">
                          {item.cta}
                          <ArrowUpRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div>
                <h3 className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-500 dark:text-white/40 mb-4">
                  {t("followStudio")}
                </h3>
                <div className="flex gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="w-12 h-12 flex items-center justify-center border border-charcoal-200 text-charcoal-500 dark:border-white/10 dark:text-white/50 hover:border-gold-500/60 dark:hover:border-gold-400/50 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gold-400/[0.05] transition-all duration-300"
                    >
                      <s.icon className="w-[18px] h-[18px]" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Google Maps embed — the Kumaripati studio */}
              <div className="relative border border-charcoal-200/70 dark:border-white/[0.08] overflow-hidden">
                <iframe
                  title={t("mapTitle")}
                  src="https://maps.google.com/maps?q=Kumaripati%2C+Lalitpur%2C+Nepal&z=15&output=embed"
                  className="w-full h-72"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02]">
                  <p className="text-xs text-charcoal-600 dark:text-white/55">{t("mapAddress")}</p>
                  <a
                    href="https://maps.google.com/?q=Kumaripati+Lalitpur+Nepal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-400/70 hover:text-gold-300 transition-colors whitespace-nowrap"
                  >
                    {t("openInMaps")}
                    <ArrowUpRight size={11} />
                  </a>
                </div>
              </div>

              {/* Payments we accept */}
              <div className="mt-6">
                <PaymentMethods />
              </div>
            </AnimatedSection>

            {/* Contact Form */}
            <AnimatedSection variant="fade-up" delay={0.15}>
              <div className="relative p-8 sm:p-10 border border-charcoal-200/70 bg-charcoal-900/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02]">
                {/* Top gold hairline */}
                <span
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
                  aria-hidden="true"
                />
                <span className="absolute top-0 left-0 right-0 mx-auto w-16 h-16 border-t border-l border-gold-400/40" aria-hidden="true" />
                <h2 className="font-heading text-2xl font-bold text-charcoal-900 dark:text-white">
                  {t("formTitle")} <span className="italic text-gold-400">{t("formTitleAccent")}</span>
                </h2>
                <p className="mt-2 text-sm text-charcoal-600 dark:text-white/45">
                  {t("formBody")}
                </p>
                <div className="mt-8">
                  <ContactForm />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Inline brand marks (SVG, consistent stroke style) ── */

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function PinterestIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
    </svg>
  );
}
