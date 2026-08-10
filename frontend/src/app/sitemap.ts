import type { MetadataRoute } from "next";
import {
  SITE_URL,
  fetchAllProducts,
  fetchAllPosts,
  fetchAllSellers,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const LOCALES = ["en", "ne"] as const;

const STATIC_PATHS: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/shop", priority: 0.9, changeFrequency: "weekly" },
  { path: "/frames", priority: 0.8, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.7, changeFrequency: "weekly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/sellers", priority: 0.7, changeFrequency: "weekly" },
  { path: "/custom", priority: 0.6, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    for (const p of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${p.path}`,
        changeFrequency: p.changeFrequency,
        priority: p.priority,
      });
    }
  }

  const [products, posts, sellers] = await Promise.all([
    fetchAllProducts(),
    fetchAllPosts(),
    fetchAllSellers(),
  ]);

  for (const locale of LOCALES) {
    for (const product of products ?? []) {
      entries.push({
        url: `${SITE_URL}/${locale}/products/${product.id}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const post of posts ?? []) {
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${post.slug}`,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const seller of sellers ?? []) {
      entries.push({
        url: `${SITE_URL}/${locale}/sellers/${seller.id}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
