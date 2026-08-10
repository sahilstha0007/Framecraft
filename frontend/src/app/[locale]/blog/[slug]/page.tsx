import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PostView from "./post-view";
import JsonLd from "@/components/JsonLd";
import { fetchPost, postJsonLd, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const post = await fetchPost(slug);
  const title = post ? `${post.title} | FrameCraft` : t("title");
  const description = (post?.excerpt ?? t("description")).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${locale}/blog/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      locale: locale === "ne" ? "ne_NP" : "en_US",
      images: post?.coverImage ? [{ url: post.coverImage, width: 1200, height: 630 }] : undefined,
      publishedTime: post?.createdAt?.replace(" ", "T"),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await fetchPost(slug);
  return (
    <>
      {post && <JsonLd data={postJsonLd(post, locale)} />}
      <PostView />
    </>
  );
}
