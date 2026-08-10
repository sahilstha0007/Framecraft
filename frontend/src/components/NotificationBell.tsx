"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Gavel, MessageSquare, ShoppingBag, Star, Timer, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  outbid: Gavel,
  auction_won: Gavel,
  order_status: ShoppingBag,
  new_order: ShoppingBag,
  new_follower: Users,
  new_comment: MessageSquare,
  review_received: Star,
  ending_soon: Timer,
};

export default function NotificationBell() {
  const t = useTranslations("account");
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) {
      setUnread(0);
      setItems(null);
      return;
    }
    const res = await api
      .get<{ notifications: AppNotification[]; unreadCount: number }>("/api/me/notifications")
      .catch(() => null);
    if (res) {
      setItems(res.notifications);
      setUnread(res.unreadCount);
    }
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const markAll = async () => {
    await api.put("/api/me/notifications/read-all", {}).catch(() => {});
    setUnread(0);
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
  };

  const openItem = async (n: AppNotification) => {
    if (!n.read) {
      await api.patch("/api/me/notifications", n.id, {}).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-charcoal-600/70 dark:text-white/60 hover:text-gold-600 dark:hover:text-gold-400 transition-colors cursor-pointer"
        aria-label={t("notifications")}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[0.6rem] font-bold rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-80 sm:w-96 glass-nav rounded-2xl overflow-hidden shadow-xl shadow-black/10 z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-[0.6rem] font-mono tracking-[0.2em] uppercase text-charcoal-500 dark:text-white/50">
                {t("notifications")}
              </p>
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="inline-flex items-center gap-1.5 text-[0.6rem] font-mono tracking-wider uppercase text-gold-600 dark:text-gold-400 hover:underline cursor-pointer"
                >
                  <CheckCheck size={12} /> {t("markAllRead")}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items?.length === 0 && (
                <p className="px-4 py-10 text-center text-xs text-charcoal-500 dark:text-white/35">
                  {t("noNotifications")}
                </p>
              )}
              {items?.map((n) => {
                const NIcon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-white/[0.06] transition-colors cursor-pointer ${
                      n.read
                        ? "bg-transparent hover:bg-white/20 dark:hover:bg-white/[0.05]"
                        : "bg-gold-500/[0.06] hover:bg-gold-500/[0.12]"
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      <NIcon size={15} className="text-gold-500" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-charcoal-800 dark:text-white/85 leading-snug">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="block mt-0.5 text-[0.7rem] text-charcoal-500 dark:text-white/45 line-clamp-2">
                          {n.body}
                        </span>
                      )}
                      <span className="block mt-1 text-[0.6rem] text-charcoal-400 dark:text-white/25">
                        {new Date(n.createdAt.replace(" ", "T")).toLocaleString()}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
