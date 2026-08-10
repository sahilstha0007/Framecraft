"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { useLocale } from "next-intl";
import PageHeader from "@/components/PageHeader";
import { useCollection } from "@/lib/useCollection";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
  sellerId: number;
  author: { name: string; avatar: string | null; shopName: string | null };
}

export default function BlogPage() {
  const t = useTranslations("blogPage");
  const locale = useLocale();

  const { data: posts } = useCollection<Post>("posts", []);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("title")} <span className="italic text-gold-400">{t("titleAccent")}</span>
          </>
        }
        description={t("description")}
        image="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&q=85"
      />

      <section className="py-16 sm:py-20 bg-cream-50 dark:bg-[#0a0a08] min-h-[50vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-24">
              <h3 className="text-xl font-heading font-semibold text-charcoal-900 dark:text-white">
                {t("noPosts")}
              </h3>
              <p className="mt-2 text-sm text-charcoal-600 dark:text-white/40">{t("noPostsBody")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`group overflow-hidden border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02] hover:border-gold-500/40 hover:shadow-[0_0_40px_rgba(212,168,56,0.05)] transition-all duration-500 ${
                    i === 0 ? "md:col-span-2" : ""
                  }`}
                >
                  {post.coverImage && (
                    <div className={`relative overflow-hidden ${i === 0 ? "h-64" : "h-48"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      {post.author.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-[0.6rem] font-mono text-gold-500">
                          {post.author.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs text-charcoal-600 dark:text-white/50">
                        {post.author.shopName || post.author.name}
                      </span>
                      <span className="text-[0.65rem] text-charcoal-400 dark:text-white/25">
                        · {new Date(post.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <h2 className="mt-3 font-heading text-xl font-semibold text-charcoal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-charcoal-600 dark:text-white/45 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-block text-xs font-medium tracking-wider uppercase text-gold-600 dark:text-gold-400">
                      {t("readMore")} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
