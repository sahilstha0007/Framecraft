"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Globe, Store, Star, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNPR } from "@/lib/nepali";
import PageHeader from "@/components/PageHeader";
import ProductCard, { type ShopProduct } from "@/components/ProductCard";

interface SellerProfile {
  id: number;
  name: string;
  avatar: string | null;
  shopName: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  productCount: number;
  followerCount: number;
  postCount: number;
  followedByMe: boolean;
  rating: number | null;
  reviewCount: number;
}

interface PostCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
}

export default function SellerView() {
  const t = useTranslations("sellerProfile");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await api.get<SellerProfile>(`/api/sellers/${params.id}`);
      setSeller(s);
      const [p, posts] = await Promise.all([
        api.list<ShopProduct>(`/api/products`).catch(() => []),
        api.list<PostCard>(`/api/posts?author=${params.id}`).catch(() => []),
      ]);
      setProducts(p.filter((x) => x.sellerId === Number(params.id)));
      setPosts(posts);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      if (seller?.followedByMe) await api.remove(`/api/sellers/${params.id}/follow`, "");
      else await api.create(`/api/sellers/${params.id}/follow`, {});
      setSeller((s) =>
        s
          ? {
              ...s,
              followedByMe: !s.followedByMe,
              followerCount: s.followerCount + (s.followedByMe ? -1 : 1),
            }
          : s
      );
    } catch {
      /* ignore */
    }
  };

  if (error) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <p className="text-sm text-charcoal-600 dark:text-white/45">{error}</p>
      </section>
    );
  }

  if (!seller) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <Loader2 size={22} className="animate-spin text-gold-400" />
      </section>
    );
  }

  return (
    <>
      <section className="pt-32 pb-10 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/sellers" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-charcoal-500 dark:text-white/40 hover:text-gold-600 dark:hover:text-gold-400 transition-colors">
            <ArrowLeft size={13} /> {t("backToSellers")}
          </Link>

          {/* Profile card */}
          <div className="mt-6 relative p-6 sm:p-10 border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02]">
            <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" aria-hidden="true" />
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {seller.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={seller.avatar} alt={seller.name} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <span className="w-24 h-24 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
                  <Store size={28} className="text-gold-500" />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-heading text-3xl font-semibold text-charcoal-900 dark:text-white">
                  {seller.shopName || seller.name}
                </h1>
                <p className="mt-1 text-sm text-charcoal-600 dark:text-white/45">
                  {seller.name}
                  {seller.location && (
                    <span className="inline-flex items-center gap-1 ml-3">
                      <MapPin size={11} /> {seller.location}
                    </span>
                  )}
                  {seller.website && (
                    <a href={seller.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 ml-3 text-gold-600 dark:text-gold-400 hover:underline">
                      <Globe size={11} /> {seller.website}
                    </a>
                  )}
                </p>
                {seller.bio && (
                  <p className="mt-4 text-sm text-charcoal-700 dark:text-white/55 leading-relaxed max-w-2xl">
                    {seller.bio}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-[0.6rem] tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/35">
                  {seller.rating != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Star size={12} className="fill-gold-400 text-gold-400" />
                      {t("rating")}: {seller.rating} ({seller.reviewCount})
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={12} className="text-gold-400/70" />
                    {seller.followerCount} {seller.followerCount === 1 ? t("follower") : t("followers")}
                  </span>
                  <span>
                    {seller.productCount} {seller.productCount === 1 ? t("product") : t("products")}
                  </span>
                  <span>
                    {seller.postCount} {seller.postCount === 1 ? t("post") : t("posts")}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleFollow}
                className={`px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors cursor-pointer border ${
                  seller.followedByMe
                    ? "border-gold-500/50 text-gold-600 dark:text-gold-400"
                    : "bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 border-transparent"
                }`}
              >
                {seller.followedByMe ? t("following") : t("follow")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white mb-6">
            {t("shopTitle")}
          </h2>
          {products.length === 0 ? (
            <p className="text-sm text-charcoal-500 dark:text-white/35 py-10 text-center border border-dashed border-charcoal-200 dark:border-white/10">
              {t("noProducts")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Posts */}
      {posts.length > 0 && (
        <section className="py-12 pb-20 bg-cream-50 dark:bg-[#0a0a08]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white mb-6">
              {t("storiesTitle")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02] hover:border-gold-500/40 transition-all duration-500"
                >
                  {post.coverImage && (
                    <div className="relative h-40 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-gold-500/70">
                      {new Date(post.createdAt).toLocaleDateString(locale)}
                    </p>
                    <h3 className="mt-2 font-heading text-base font-semibold text-charcoal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 text-xs text-charcoal-600 dark:text-white/45 line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
