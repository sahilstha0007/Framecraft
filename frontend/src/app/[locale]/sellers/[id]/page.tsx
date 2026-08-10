import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SellerView from "./seller-view";
import JsonLd from "@/components/JsonLd";
import { fetchSeller, sellerJsonLd, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const seller = await fetchSeller(id);
  const name = seller?.shopName || seller?.name;
  const title = name ? `${name} — Artist & Seller | FrameCraft` : t("title");
  const description = (seller?.bio ?? t("description")).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${locale}/sellers/${id}` },
    openGraph: {
      title,
      description,
      type: "profile",
      locale: locale === "ne" ? "ne_NP" : "en_US",
      images: seller?.avatar ? [{ url: seller.avatar, width: 400, height: 400 }] : undefined,
    },
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const seller = await fetchSeller(id);
  return (
    <>
      {seller && <JsonLd data={sellerJsonLd(seller, locale)} />}
      <SellerView />
    </>
  );
}
