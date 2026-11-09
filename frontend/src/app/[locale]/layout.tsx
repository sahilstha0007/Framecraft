import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  DM_Sans,
  DM_Mono,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { MotionConfig } from "framer-motion";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CartDrawer from "@/components/CartDrawer";
import LenisProvider from "@/components/LenisProvider";
import Preloader from "@/components/Preloader";
import ThemeProvider from "@/components/ThemeProvider";
import { CartProvider } from "@/lib/cart";
import { routing } from "@/i18n/routing";
import { SITE_URL, organizationJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["300", "400", "500"],
});

// Devanagari face for the Nepali locale — swapped in via globals.css when
// `html[lang="ne"]` (Latin fonts lack Devanagari glyphs).
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Statically render both locales.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Match the mobile browser chrome (status bar, overscroll) to the active
// theme — warm gallery cream in light mode, deep charcoal in dark mode.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "Nepali art",
      "Nepal art marketplace",
      "thangka",
      "paubha",
      "mithila art",
      "buy art Nepal",
      "art auction Nepal",
      "Nepali artists",
      "Kala Bazaar",
    ],
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        ne: `${SITE_URL}/ne`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale === "ne" ? "ne_NP" : "en_US",
      siteName: "Kala Bazaar",
      images: [
        {
          url: "/art/thangka.jpg",
          width: 1200,
          height: 800,
          alt: "Kala Bazaar — Nepal's art marketplace",
        },
      ],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Pass the full message set to client components (nav, forms, motion text…).
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} ${notoDevanagari.variable}`}
    >
      <head>
        {/* Preconnect to external image and font origins */}
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        {/* Preload the LCP hero image (first gallery item, largest version) */}
        <link
          rel="preload"
          href="/art/boudhanath.jpg"
          as="image"
          fetchPriority="high"
        />
      </head>
      <body className="antialiased">
        <JsonLd data={organizationJsonLd} />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {/* Branded once-per-session intro — inside the intl provider so
                it can translate, and above everything while it plays */}
            <Preloader />
            <CartProvider>
              <Navbar />
              <MotionConfig reducedMotion="user">
                <LenisProvider>
                  <main className="min-h-screen">{children}</main>
                </LenisProvider>
              </MotionConfig>
              <Footer />
              <CartDrawer />
              <WhatsAppButton />
            </CartProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
