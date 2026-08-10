import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ProductView from "./product-view";
import JsonLd from "@/components/JsonLd";
import { fetchProduct, productJsonLd, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const product = await fetchProduct(id);
  const title = product ? `${product.name} | FrameCraft` : t("title");
  const description = (product?.description ?? t("description")).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${locale}/products/${id}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "ne" ? "ne_NP" : "en_US",
      images: product?.image ? [{ url: product.image, width: 1200, height: 900 }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const product = await fetchProduct(id);
  return (
    <>
      {product && <JsonLd data={productJsonLd(product, locale)} />}
      <ProductView />
    </>
  );
}
