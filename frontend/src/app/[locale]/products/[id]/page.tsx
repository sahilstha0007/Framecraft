"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Gavel,
  Heart,
  Loader2,
  MessageSquare,
  Send,
  ShoppingBag,
  Star,
  Store,
  Timer,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import NextImage from "next/image";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useBrowsingHistory } from "@/lib/useBrowsingHistory";
import { formatNPR } from "@/lib/nepali";
import PageHeader from "@/components/PageHeader";
import StatusBadge, { statusKey } from "@/components/StatusBadge";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  auction: boolean;
  startingBid: number | null;
  minIncrement: number;
  endsAt: string | null;
  currentBid: number | null;
  bidCount: number;
  status: string;
  stock: number;
  sellerId: number | null;
  sellerName: string | null;
  sellerAvatar: string | null;
  sellerShopName: string | null;
}

interface Bid {
  id: number;
  amount: number;
  bidderName: string | null;
  createdAt: string;
}

interface Comment {
  id: number;
  content: string;
  userId: number;
  author: { name: string; avatar: string | null };
  createdAt: string;
}

interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  userId: number;
  author: { name: string; avatar: string | null };
}

interface ReviewsData {
  average: number | null;
  count: number;
  reviews: Review[];
}

export default function ProductPage() {
  const t = useTranslations("productPage");
  const ts = useTranslations("shopPage");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { add } = useCart();
  const { record } = useBrowsingHistory();

  const [product, setProduct] = useState<Product | null>(null);
  const [engagement, setEngagement] = useState<{ likeCount: number; likedByMe: boolean } | null>(null);
  const [bids, setBids] = useState<Bid[] | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [seller, setSeller] = useState<{ followedByMe: boolean; followerCount: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidBusy, setBidBusy] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidOk, setBidOk] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<ReviewsData | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewOk, setReviewOk] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyBusyId, setReplyBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const p = await api.get<Product>(`/api/products/${params.id}`);
      setProduct(p);
      setBidAmount("");
      // Record the visit — feeds the homepage trending score and the
      // "Picked for you" recommendations.
      record({ id: p.id, name: p.name, category: p.category, image: p.image, price: p.price });
      const eng = await api.get<typeof engagement>(`/api/products/${params.id}/engagement`).catch(() => null);
      setEngagement(eng);
      const b = await api.list<Bid>(`/api/products/${params.id}/bids`).catch(() => []);
      setBids(b);
      const c = await api
        .list<Comment>(`/api/comments?targetType=product&targetId=${params.id}`)
        .catch(() => []);
      setComments(c);
      const rv = await api
        .get<ReviewsData>(`/api/products/${params.id}/reviews`)
        .catch(() => null);
      setReviews(rv);
      if (p.sellerId) {
        const s = await api
          .get<{ followedByMe: boolean; followerCount: number }>(`/api/sellers/${p.sellerId}`)
          .catch(() => null);
        setSeller(s);
      } else {
        setSeller(null);
      }
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to load product");
    }
  }, [params.id, record]);

  useEffect(() => {
    load();
  }, [load]);

  // Live auction feel: refresh the bid state every 6s while an auction is open.
  useEffect(() => {
    if (!product?.auction || product.status !== "active") return;
    const id = window.setInterval(async () => {
      setNow(Date.now());
      const b = await api.list<Bid>(`/api/products/${params.id}/bids`).catch(() => null);
      if (b) setBids(b);
      const p = await api.get<Product>(`/api/products/${params.id}`).catch(() => null);
      if (p) {
        setProduct(p);
        if (p.status !== "active") window.clearInterval(id);
      }
    }, 6000);
    return () => window.clearInterval(id);
  }, [product?.auction, product?.status, params.id]);

  const timeLeft = useMemo(() => {
    if (!product?.endsAt) return null;
    const diff = new Date(product.endsAt.replace(" ", "T")).getTime() - now;
    if (diff <= 0) return { done: true, text: t("ended") };
    const d = Math.floor(diff / 86400_000);
    const h = Math.floor((diff % 86400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return { done: false, text: `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` };
  }, [product?.endsAt, now, t]);

  const floor = (product?.currentBid ?? product?.startingBid ?? 0) + (product?.minIncrement ?? 0);
  const outOfStock = !product?.auction && (product?.stock ?? 0) <= 0;

  const placeBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setBidBusy(true);
    setBidError(null);
    setBidOk(null);
    try {
      await api.create(`/api/products/${params.id}/bid`, { amount: Number(bidAmount) });
      setBidOk(t("bidPlaced"));
      setBidAmount("");
      const [b, p] = await Promise.all([
        api.list<Bid>(`/api/products/${params.id}/bids`),
        api.get<Product>(`/api/products/${params.id}`),
      ]);
      setBids(b);
      setProduct(p);
    } catch (err) {
      setBidError(err instanceof ApiError ? err.message : "Bid failed");
    } finally {
      setBidBusy(false);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    const liked = engagement?.likedByMe;
    try {
      if (liked) await api.remove(`/api/products/${params.id}/like`, "");
      else await api.create(`/api/products/${params.id}/like`, {});
      setEngagement((e) => ({
        likeCount: (e?.likeCount ?? 0) + (liked ? -1 : 1),
        likedByMe: !liked,
      }));
    } catch {
      /* ignore */
    }
  };

  const toggleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product?.sellerId) return;
    try {
      if (seller?.followedByMe) {
        await api.remove(`/api/sellers/${product.sellerId}/follow`, "");
      } else {
        await api.create(`/api/sellers/${product.sellerId}/follow`, {});
      }
      setSeller((s) => ({
        followedByMe: !s?.followedByMe,
        followerCount: (s?.followerCount ?? 0) + (s?.followedByMe ? -1 : 1),
      }));
    } catch {
      /* ignore */
    }
  };

  const addToCart = () => {
    if (!product || outOfStock) return;
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setCommentBusy(true);
    try {
      const c = await api.create<Comment>(`/api/comments`, {
        targetType: "product",
        targetId: Number(params.id),
        content: comment.trim(),
      });
      setComments((prev) => [...(prev ?? []), c]);
      setComment("");
    } catch {
      /* ignore */
    } finally {
      setCommentBusy(false);
    }
  };

  const deleteComment = async (id: number) => {
    await api.remove(`/api/comments`, id).catch(() => {});
    setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || reviewRating < 1) return;
    setReviewBusy(true);
    setReviewError(null);
    setReviewOk(false);
    try {
      await api.create(`/api/products/${params.id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        body: reviewBody.trim() || undefined,
      });
      setReviewOk(true);
      setReviewRating(0);
      setReviewTitle("");
      setReviewBody("");
      const rv = await api
        .get<ReviewsData>(`/api/products/${params.id}/reviews`)
        .catch(() => null);
      if (rv) setReviews(rv);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Review failed");
    } finally {
      setReviewBusy(false);
    }
  };

  const deleteReview = async (id: number) => {
    await api.remove(`/api/reviews`, id).catch(() => {});
    // Refetch so the aggregate average/count stay accurate after a delete.
    const rv = await api
      .get<ReviewsData>(`/api/products/${params.id}/reviews`)
      .catch(() => null);
    if (rv) setReviews(rv);
  };

  const submitReply = async (id: number) => {
    const text = (replyDrafts[id] ?? "").trim();
    if (!text) return;
    setReplyBusyId(id);
    try {
      await api.put(`/api/reviews/${id}/reply`, { reply: text });
      const rv = await api
        .get<ReviewsData>(`/api/products/${params.id}/reviews`)
        .catch(() => null);
      if (rv) setReviews(rv);
      setReplyDrafts((d) => ({ ...d, [id]: "" }));
    } catch {
      /* ignore */
    } finally {
      setReplyBusyId(null);
    }
  };

  const myReview =
    user && reviews ? reviews.reviews.find((r) => r.userId === user.id) : null;
  const canReply =
    !!user &&
    !!product?.sellerId &&
    (user.id === product.sellerId || user.role === "admin");

  const StarRow = ({ value, size = 13 }: { value: number; size?: number }) => (
    <span className="inline-flex items-center gap-0.5" aria-label={t("averageRating", { rating: value })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-gold-400 text-gold-400" : "text-charcoal-300 dark:text-white/15"}
        />
      ))}
    </span>
  );

  const label = (s: string) => t(statusKey(s));

  if (loadError) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <div className="text-center px-4">
          <p className="text-sm text-charcoal-600 dark:text-white/45">{loadError}</p>
          <Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gold-600 dark:text-gold-400 hover:underline">
            <ArrowLeft size={13} /> {ts("all")}
          </Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-cream-50 dark:bg-[#0a0a08]">
        <Loader2 size={22} className="animate-spin text-gold-400" />
      </section>
    );
  }

  const isAuction = product.auction;
  const auctionOpen = isAuction && product.status === "active";

  return (
    <>
      <section className="pt-32 pb-20 bg-cream-50 dark:bg-[#0a0a08] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-charcoal-500 dark:text-white/40 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
          >
            <ArrowLeft size={13} /> {t("backToShop")}
          </Link>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            {/* Image */}
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden bg-charcoal-900/[0.03] dark:bg-white/[0.03]">
                <NextImage
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              {isAuction && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0a08]/80 backdrop-blur text-gold-400 font-mono text-[0.6rem] tracking-[0.2em] uppercase">
                  <Gavel size={12} /> {t("auction")}
                </span>
              )}
            </div>

            {/* Details */}
            <div>
              <span className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-gold-500/70">
                {product.category}
              </span>
              <h1 className="mt-2 font-heading text-3xl sm:text-4xl font-semibold text-charcoal-900 dark:text-white leading-tight">
                {product.name}
              </h1>
              {reviews && reviews.count > 0 && (
                <div className="mt-2.5 flex items-center gap-2">
                  <StarRow value={reviews.average ?? 0} />
                  <span className="text-xs text-charcoal-500 dark:text-white/45">
                    {reviews.average} · {reviews.count}
                  </span>
                </div>
              )}
              <p className="mt-4 text-sm text-charcoal-600 dark:text-white/50 leading-relaxed">
                {product.description}
              </p>

              {/* Price / bid block */}
              <div className="mt-6 p-5 border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02]">
                {isAuction ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <div className="font-mono text-[0.55rem] tracking-[0.25em] uppercase text-charcoal-400 dark:text-white/30">
                          {t("currentBid")}
                        </div>
                        <div className="mt-1 font-heading text-3xl font-semibold text-gold-600 dark:text-gold-400">
                          {formatNPR(product.currentBid ?? product.startingBid ?? 0, locale)}
                        </div>
                        <div className="mt-1 text-xs text-charcoal-500 dark:text-white/40">
                          {product.bidCount} {product.bidCount === 1 ? t("bid") : t("bids")} ·{" "}
                          {t("minIncrement")}: {formatNPR(product.minIncrement, locale)}
                        </div>
                      </div>
                      {timeLeft && (
                        <div className="flex items-center gap-2 px-3.5 py-2 border border-gold-500/30 bg-gold-500/10">
                          <Timer size={14} className="text-gold-500" />
                          <span className={`font-mono text-sm ${timeLeft.done ? "text-charcoal-500" : "text-gold-700 dark:text-gold-300"}`}>
                            {timeLeft.text}
                          </span>
                        </div>
                      )}
                    </div>

                    {product.status === "active" ? (
                      <form onSubmit={placeBid} className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            min={floor}
                            step={product.minIncrement}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={t("bidPlaceholder", { amount: formatNPR(floor, locale) })}
                            className="w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-400/30"
                          />
                          {bidError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{bidError}</p>}
                          {bidOk && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{bidOk}</p>}
                        </div>
                        <button
                          type="submit"
                          disabled={bidBusy || !bidAmount}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-50 text-white dark:text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors cursor-pointer"
                        >
                          {bidBusy ? <Loader2 size={14} className="animate-spin" /> : <Gavel size={14} />}
                          {t("placeBid")}
                        </button>
                      </form>
                    ) : (
                      <div className="py-3">
                        {product.status === "ended" ? (
                          <p className="text-sm text-charcoal-600 dark:text-white/45">
                            {t("auctionEnded")}
                          </p>
                        ) : (
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("auctionSold")}</p>
                        )}
                        <StatusBadge status={product.status} label={label(product.status)} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="font-heading text-3xl font-semibold text-gold-600 dark:text-gold-400">
                      {formatNPR(product.price, locale)}
                    </div>
                    <button
                      onClick={addToCart}
                      disabled={outOfStock}
                      className={`inline-flex items-center gap-2 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed ${
                        added
                          ? "bg-emerald-500 text-white"
                          : outOfStock
                            ? "bg-charcoal-900/[0.05] dark:bg-white/[0.05] text-charcoal-400 dark:text-white/25"
                            : "bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900"
                      }`}
                    >
                      <ShoppingBag size={14} /> {added ? ts("added") : outOfStock ? ts("outOfStock") : tc("checkout")}
                    </button>
                  </div>
                )}
              </div>

              {/* Like */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={toggleLike}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-charcoal-200 dark:border-white/10 rounded-full text-xs text-charcoal-600 dark:text-white/60 hover:border-red-400/60 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Heart size={13} className={engagement?.likedByMe ? "fill-red-500 text-red-500" : ""} />
                  {engagement?.likeCount ?? 0}
                </button>
                <span className="inline-flex items-center gap-2 text-xs text-charcoal-500 dark:text-white/40">
                  <MessageSquare size={13} /> {comments?.length ?? 0} {t("comments")}
                </span>
              </div>

              {/* Seller card */}
              {product.sellerId && product.sellerName && (
                <div className="mt-6 p-5 border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-4">
                  <Link href={`/sellers/${product.sellerId}`} className="flex items-center gap-3 min-w-0 group">
                    {product.sellerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.sellerAvatar} alt={product.sellerName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-12 h-12 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                        <Store size={16} className="text-gold-500" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                        {product.sellerShopName || product.sellerName}
                      </p>
                      <p className="text-[0.65rem] text-charcoal-500 dark:text-white/40 truncate">
                        {product.sellerName} · {seller?.followerCount ?? 0} {t("followers")}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={toggleFollow}
                    className={`px-4 py-2 text-xs font-medium tracking-wider uppercase rounded-sm transition-colors cursor-pointer border ${
                      seller?.followedByMe
                        ? "border-gold-500/50 text-gold-600 dark:text-gold-400"
                        : "bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 border-transparent"
                    }`}
                  >
                    {seller?.followedByMe ? t("following") : t("follow")}
                  </button>
                </div>
              )}

              {/* Bid history */}
              {isAuction && bids && bids.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-heading text-lg font-semibold text-charcoal-900 dark:text-white mb-3">
                    {t("bidHistory")}
                  </h3>
                  <div className="border border-charcoal-200/60 dark:border-white/[0.07] divide-y divide-charcoal-200/60 dark:divide-white/[0.07]">
                    {bids.slice(0, 8).map((b, i) => (
                      <div key={b.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="flex items-center gap-2 text-charcoal-700 dark:text-white/70">
                          {i === 0 && <span className="text-[0.55rem] font-mono tracking-widest uppercase text-gold-500">★</span>}
                          {b.bidderName ?? "Anonymous"}
                        </span>
                        <span className="font-medium text-charcoal-900 dark:text-white">
                          {formatNPR(b.amount, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="mt-14 max-w-3xl">
            <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white mb-4">
              {t("comments")} ({comments?.length ?? 0})
            </h2>
            <form onSubmit={postComment} className="flex gap-2 mb-6">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={user ? t("commentPlaceholder") : t("signInToComment")}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60"
              />
              <button
                type="submit"
                disabled={commentBusy || !comment.trim() || !user}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-50 text-white dark:text-charcoal-900 text-xs font-medium tracking-wider uppercase rounded-sm transition-colors cursor-pointer"
              >
                {commentBusy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {t("post")}
              </button>
            </form>
            <div className="space-y-3">
              {comments?.length === 0 && (
                <p className="text-sm text-charcoal-500 dark:text-white/35">{t("noComments")}</p>
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-charcoal-800 dark:text-white/80">{c.author.name}</span>
                      <span className="text-[0.6rem] text-charcoal-400 dark:text-white/25">
                        {new Date(c.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-charcoal-700 dark:text-white/60">{c.content}</p>
                  </div>
                  {user?.id === c.userId && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="self-start text-[0.6rem] text-charcoal-400 hover:text-red-500 dark:text-white/25 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      {t("delete")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews & ratings */}
          <div className="mt-14 max-w-3xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-heading text-xl font-semibold text-charcoal-900 dark:text-white">
                {t("reviewsTitle")} ({reviews?.count ?? 0})
              </h2>
              {reviews && reviews.count > 0 && (
                <div className="flex items-center gap-2">
                  <StarRow value={reviews.average ?? 0} />
                  <span className="text-xs text-charcoal-500 dark:text-white/45">
                    {reviews.average}
                  </span>
                </div>
              )}
            </div>

            {user && !myReview && (
              <form
                onSubmit={submitReview}
                className="mb-6 p-5 border border-charcoal-200/70 dark:border-white/[0.08] bg-charcoal-900/[0.02] dark:bg-white/[0.02]"
              >
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-xs uppercase tracking-wider text-charcoal-500 dark:text-white/40 mr-2">
                    {t("yourRating")}
                  </span>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i)}
                      aria-label={`${i} star`}
                      className="cursor-pointer"
                    >
                      <Star
                        size={18}
                        className={`transition-colors ${
                          i <= reviewRating
                            ? "fill-gold-400 text-gold-400"
                            : "text-charcoal-300 dark:text-white/20 hover:text-gold-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder={t("reviewTitlePlaceholder")}
                  className="w-full px-3 py-2 mb-2 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60"
                />
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder={t("reviewBodyPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-2 mb-3 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60 resize-none"
                />
                {reviewError && (
                  <p className="mb-2 text-xs text-red-600 dark:text-red-400">{reviewError}</p>
                )}
                {reviewOk && (
                  <p className="mb-2 text-xs text-emerald-600 dark:text-emerald-400">
                    {t("reviewSubmitted")}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={reviewBusy || reviewRating < 1}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-50 text-white dark:text-charcoal-900 text-xs font-medium tracking-wider uppercase rounded-sm transition-colors cursor-pointer"
                >
                  {reviewBusy ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />}
                  {t("submitReview")}
                </button>
              </form>
            )}
            {user && myReview && (
              <p className="mb-6 text-xs text-charcoal-500 dark:text-white/35">
                {t("alreadyReviewed")}
              </p>
            )}

            <div className="space-y-4">
              {(reviews?.reviews.length ?? 0) === 0 && (
                <p className="text-sm text-charcoal-500 dark:text-white/35">
                  {t("noReviews")} {t("beFirstReview")}
                </p>
              )}
              {reviews?.reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-5 border border-charcoal-200/60 dark:border-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {r.author.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.author.avatar}
                          alt={r.author.name}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <span className="w-9 h-9 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-[0.6rem] font-mono text-gold-500 flex-shrink-0">
                          {r.author.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-charcoal-800 dark:text-white/80">
                          {r.author.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <StarRow value={r.rating} size={11} />
                          <span className="text-[0.6rem] text-charcoal-400 dark:text-white/25">
                            {new Date(r.createdAt).toLocaleDateString(locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {user?.id === r.userId && (
                      <button
                        onClick={() => deleteReview(r.id)}
                        className="text-[0.6rem] text-charcoal-400 hover:text-red-500 dark:text-white/25 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {t("delete")}
                      </button>
                    )}
                  </div>
                  {r.title && (
                    <h3 className="mt-3 font-heading text-base font-semibold text-charcoal-900 dark:text-white">
                      {r.title}
                    </h3>
                  )}
                  {r.body && (
                    <p className="mt-1.5 text-sm text-charcoal-700 dark:text-white/60 leading-relaxed">
                      {r.body}
                    </p>
                  )}
                  {r.reply && (
                    <div className="mt-3 pl-4 border-l-2 border-gold-500/40">
                      <p className="text-[0.6rem] font-mono tracking-widest uppercase text-gold-500/80">
                        {t("seller")}
                      </p>
                      <p className="mt-1 text-sm text-charcoal-700 dark:text-white/60">{r.reply}</p>
                    </div>
                  )}
                  {canReply && !r.reply && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyDrafts[r.id] ?? ""}
                        onChange={(e) =>
                          setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                        }
                        placeholder={t("replyPlaceholder")}
                        className="flex-1 px-3 py-2 bg-white dark:bg-white/[0.04] border border-charcoal-200 dark:border-white/10 text-sm text-charcoal-900 dark:text-white placeholder-charcoal-400 dark:placeholder-white/30 rounded-sm focus:outline-none focus:border-gold-500/60"
                      />
                      <button
                        onClick={() => submitReply(r.id)}
                        disabled={replyBusyId === r.id || !(replyDrafts[r.id] ?? "").trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase rounded-sm bg-walnut-600 hover:bg-walnut-700 dark:bg-gold-500 dark:hover:bg-gold-600 disabled:opacity-50 text-white dark:text-charcoal-900 transition-colors cursor-pointer"
                      >
                        {replyBusyId === r.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        {t("reply")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
