"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Post {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  createdAt: string;
  sellerId: number;
  author: { name: string; avatar: string | null; shopName: string | null; bio: string | null };
}

interface Comment {
  id: number;
  content: string;
  author: { name: string; avatar: string | null };
  createdAt: string;
}

export default function BlogPostPage() {
  const t = useTranslations("blogPostPage");
  const tp = useTranslations("productPage");
  const locale = useLocale();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await api.get<Post>(`/api/posts/${params.slug}`);
      setPost(p);
      const c = await api
        .list<Comment>(`/api/comments?targetType=post&targetId=${p.id}`)
        .catch(() => []);
      setComments(c);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load post");
    }
  }, [params.slug]);

  useEffect(() => {
    load();
  }, [load]);

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const c = await api.create<Comment>("/api/comments", {
        targetType: "post",
        targetId: post!.id,
        content: comment.trim(),
      });
      setComments((prev) => [...(prev ?? []), c]);
      setComment("");
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <p className="text-sm text-charcoal-600 dark:text-white/45">{error}</p>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <Loader2 size={22} className="animate-spin text-gold-400" />
      </section>
    );
  }

  return (
    <>
      <section className="pt-32 pb-20 bg-cream-50 dark:bg-[#0a0a08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-charcoal-500 dark:text-white/40 hover:text-gold-600 dark:hover:text-gold-400 transition-colors">
            <ArrowLeft size={13} /> {t("backToBlog")}
          </Link>

          <div className="mt-8">
            <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase text-gold-500/70">
              {new Date(post.createdAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-semibold text-charcoal-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            <Link href={`/sellers/${post.sellerId}`} className="mt-6 inline-flex items-center gap-3 group">
              {post.author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author.avatar} alt={post.author.name} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <span className="w-11 h-11 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-sm font-mono text-gold-500">
                  {post.author.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>
                <span className="block text-sm font-medium text-charcoal-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                  {post.author.shopName || post.author.name}
                </span>
                <span className="block text-[0.65rem] text-charcoal-500 dark:text-white/40">{post.author.name}</span>
              </span>
            </Link>
          </div>

          {post.coverImage && (
            <div className="mt-8 relative aspect-[16/9] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <article className="mt-10 prose-sm sm:prose prose-charcoal dark:prose-invert max-w-none [&_p]:text-[0.95rem] [&_p]:leading-relaxed [&_p]:text-charcoal-700 dark:[&_p]:text-white/60 [&_p]:my-4">
            {post.content.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>

          {/* Comments */}
          <div className="mt-16 pt-10 border-t border-charcoal-200/60 dark:border-white/[0.07]">
            <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={17} className="text-gold-400" /> {t("comments")} ({comments?.length ?? 0})
            </h2>
            <form onSubmit={postComment} className="flex gap-2 mb-6">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={user ? t("commentPlaceholder") : tp("signInToComment")}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60"
              />
              <button
                type="submit"
                disabled={busy || !comment.trim() || !user}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-50 text-white dark:text-charcoal-900 text-xs font-medium tracking-wider uppercase rounded-sm transition-colors cursor-pointer"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {tp("post")}
              </button>
            </form>
            <div className="space-y-3">
              {comments?.length === 0 && (
                <p className="text-sm text-charcoal-500 dark:text-white/35">{tp("noComments")}</p>
              )}
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-3 p-4 border border-charcoal-200/60 dark:border-white/[0.07]">
                  {c.author.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.author.avatar} alt={c.author.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-[0.6rem] font-mono text-gold-500 flex-shrink-0">
                      {c.author.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <span className="text-xs font-medium text-charcoal-800 dark:text-white/80">{c.author.name}</span>
                    <p className="mt-0.5 text-sm text-charcoal-700 dark:text-white/60">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
