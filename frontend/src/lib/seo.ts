/**
 * Server-side SEO helpers: canonical URL building, tolerant API fetchers for
 * dynamic pages (metadata + JSON-LD), and structured-data builders.
 * Everything is failure-tolerant — SEO must never take down a page.
 */

// Server-side fetches prefer the internal API URL (compose service name) when
// set; NEXT_PUBLIC_API_URL is baked for the browser and may not resolve inside
// a container.
export const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://framecraft.com.np";

export interface SeoProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  auction?: boolean;
  currentBid?: number | null;
  startingBid?: number | null;
  stock?: number;
  avgRating?: number | null;
  reviewCount?: number;
  sellerName?: string | null;
}

export interface SeoPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  createdAt: string;
  authorName?: string | null;
}

export interface SeoSeller {
  id: number;
  name: string;
  bio?: string | null;
  avatar?: string | null;
  shopName?: string | null;
  location?: string | null;
  rating?: number | null;
  reviewCount?: number;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const fetchProduct = (id: string | number) =>
  fetchJson<SeoProduct>(`/api/products/${id}`);

export const fetchPost = (slug: string) =>
  fetchJson<SeoPost>(`/api/posts/${slug}`);

export const fetchSeller = (id: string | number) =>
  fetchJson<SeoSeller>(`/api/sellers/${id}`);

export const fetchAllProducts = () => fetchJson<SeoProduct[]>("/api/products");

export const fetchAllPosts = () => fetchJson<SeoPost[]>("/api/posts");

export const fetchAllSellers = () => fetchJson<SeoSeller[]>("/api/sellers");

/* ── JSON-LD builders ───────────────────────────────────────────────────── */

export function productJsonLd(p: SeoProduct, locale: string): Record<string, unknown> {
  const url = `${SITE_URL}/${locale}/products/${p.id}`;
  const effectivePrice = p.auction
    ? (p.currentBid ?? p.startingBid ?? 0)
    : p.price;
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    price: effectivePrice,
    priceCurrency: "NPR",
    url,
    availability:
      p.auction || Number(p.stock ?? 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
  };
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.image,
    description: p.description?.slice(0, 300) ?? undefined,
    offers: offer,
  };
  if (p.avgRating != null && p.reviewCount) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.avgRating,
      reviewCount: p.reviewCount,
    };
  }
  if (p.sellerName) ld.brand = { "@type": "Brand", name: p.sellerName };
  return ld;
}

export function postJsonLd(post: SeoPost, locale: string): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: `${SITE_URL}/${locale}/blog/${post.slug}`,
    datePublished: post.createdAt?.replace(" ", "T") ?? undefined,
    description: post.excerpt?.slice(0, 300) ?? undefined,
  };
  if (post.coverImage) ld.image = post.coverImage;
  if (post.authorName) ld.author = { "@type": "Person", name: post.authorName };
  return ld;
}

export function sellerJsonLd(s: SeoSeller, locale: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.shopName || s.name,
    url: `${SITE_URL}/${locale}/sellers/${s.id}`,
    description: s.bio?.slice(0, 300) ?? undefined,
    image: s.avatar ?? undefined,
    jobTitle: "Artist",
    address: s.location ? { "@type": "PostalAddress", addressLocality: s.location } : undefined,
    ...(s.rating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: s.rating,
            reviewCount: s.reviewCount ?? 0,
          },
        }
      : {}),
  };
}

export const organizationJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FrameCraft",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  foundingDate: "1999",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Patan",
    addressRegion: "Bagmati",
    addressCountry: "NP",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: `${SITE_URL}/contact`,
  },
};
