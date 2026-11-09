"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import ScrollReveal, { DriftWatermark, ParallaxLayer } from "@/components/ScrollReveal";
import { useCollection } from "@/lib/useCollection";

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  author: { name: string; avatar: string | null; shopName: string | null };
}

/**
 * ── Stories teaser ──────────────────────────────────────────────────────────
 * The latest seller stories in an editorial layout — one lead piece and two
 * supporting rows. Links into the blog where artists publish.
 */
export default function StoriesTeaser() {
  const t = useTranslations("market");
  const { data: posts } = useCollection<Post>("posts?limit=1000", []);

  const latest = posts.slice(0, 3);
  if (latest.length === 0) return null;

  const [lead, ...rest] = latest;

  return (
    <section className="py-24 bg-cream-50 dark:bg-[#0a0a08] relative overflow-hidden">
      {/* Parallel layer: giant word drifting behind the stories */}
      <DriftWatermark text="KATHA" speed={0.26} className="absolute inset-0" />
      <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <ScrollReveal>
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gold-400/40" aria-hidden="true" />
                <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-gold-600 dark:text-gold-400">
                  {t("storiesEyebrow")}
                </span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-heading font-bold text-charcoal-900 dark:text-white">
                {t("storiesTitle")}
              </h2>
            </div>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors"
            >
              {t("storiesViewAll")}
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lead story */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <ParallaxLayer speed={0.16}>
            <Link href={`/blog/${lead.slug}`} className="group block h-full">
              <div className="relative aspect-[16/10] overflow-hidden border border-charcoal-200/60 dark:border-white/[0.07]">
                {lead.coverImage && (
                  <NextImage
                    src={lead.coverImage}
                    alt={lead.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a08]/70 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                <span className="absolute bottom-4 left-4 px-2.5 py-1 text-[0.65rem] font-mono tracking-[0.2em] uppercase text-gold-300 bg-[#0a0a08]/70 backdrop-blur">
                  {t("storiesFeatured")}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-2xl font-semibold text-charcoal-900 dark:text-white leading-snug group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors duration-300">
                {lead.title}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-xs text-charcoal-500 dark:text-white/40">
                {lead.author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lead.author.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center text-[0.55rem] font-bold">
                    {lead.author.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                {lead.author.shopName || lead.author.name}
              </p>
            </Link>
            </ParallaxLayer>
          </motion.div>

          {/* Supporting stories */}
          <div className="flex flex-col gap-6">
            {rest.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.1 }}
                className="flex-1"
              >
                <ParallaxLayer speed={0.3 - i * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex gap-5 h-full border border-charcoal-200/60 dark:border-white/[0.07] bg-white/40 dark:bg-white/[0.02] p-4 transition-[border-color] duration-300 hover:border-gold-500/50 dark:hover:border-gold-400/30"
                >
                  <div className="relative w-32 sm:w-44 shrink-0 overflow-hidden">
                    {post.coverImage ? (
                      <NextImage
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="176px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-lattice" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 py-1">
                    <h3 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white leading-snug line-clamp-2 group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors duration-300">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 text-xs sm:text-sm text-charcoal-600 dark:text-white/45 leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.65rem] tracking-[0.2em] uppercase text-gold-600 dark:text-gold-400">
                      {t("storiesReadMore")}
                      <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
                </ParallaxLayer>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
