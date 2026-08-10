"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, StickyNote, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/nepali";
import StatusBadge, { statusKey } from "../StatusBadge";
import type { Toast } from "./ResourceManager";

const STATUSES = ["pending", "confirmed", "in_progress", "ready", "delivered", "cancelled"];

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customerName: string;
  email: string;
  phone: string | null;
  address: string;
  paymentMethod: string;
  items: OrderItem[];
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function SellerOrdersManager({ onToast }: { onToast: (toast: Toast) => void }) {
  const t = useTranslations("adminOrders");
  const ta = useTranslations("admin");
  const locale = useLocale();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    api
      .list<Order>("/api/seller/orders")
      .then((rows) => {
        setItems(rows);
        setNotesDraft(Object.fromEntries(rows.map((o) => [o.id, o.notes ?? ""])));
      })
      .catch((e) => onToast({ type: "err", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [onToast]);

  useEffect(load, [load]);

  const save = async (id: number, body: { status?: string; notes?: string }) => {
    setSaving(id);
    try {
      await api.patch("/api/seller/orders", id, body);
      onToast({ type: "ok", msg: t("orderUpdated") });
      load();
    } catch (e) {
      onToast({ type: "err", msg: (e as Error).message });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-cream-500/60 text-sm">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-charcoal-700 text-cream-500/60 text-sm">
        {t("noOrders")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((o) => (
        <div key={o.id} className="border border-charcoal-700/80 bg-charcoal-900/30 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-cream-500/60">#{o.id}</p>
                <StatusBadge status={o.status} label={ta(statusKey(o.status))} />
              </div>
              <p className="mt-2 font-medium text-cream-100">{o.customerName}</p>
              <p className="mt-0.5 text-xs text-cream-400/70">
                {o.email} · {o.paymentMethod} · {o.createdAt}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-cream-400/70">
                <MapPin size={11} /> {o.address}
              </p>
            </div>
            <select
              value={o.status}
              onChange={(e) => save(o.id, { status: e.target.value })}
              disabled={saving === o.id}
              className="px-2.5 py-1.5 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-xs text-cream-100 outline-none transition-colors disabled:opacity-50"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ta(statusKey(s))}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 border border-charcoal-700/50">
            {o.items.map((i, idx) => (
              <div
                key={`${o.id}-${i.productId}-${idx}`}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${idx % 2 ? "bg-charcoal-900/40" : ""}`}
              >
                <span className="text-cream-200 min-w-0 truncate">
                  {i.name} <span className="text-cream-500/60">×{i.quantity}</span>
                </span>
                <span className="text-cream-300 whitespace-nowrap">{formatNPR(i.price * i.quantity, locale)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2 border-t border-charcoal-700/50">
              <span className="text-xs uppercase tracking-widest text-cream-500/50">{t("total")}</span>
              <span className="font-heading font-semibold text-gold-300">{formatNPR(o.total, locale)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <label className="flex-1 block">
              <span className="flex items-center gap-1.5 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-cream-500/50 mb-1.5">
                <StickyNote size={11} /> {ta("notes")}
              </span>
              <textarea
                value={notesDraft[o.id] ?? ""}
                onChange={(e) => setNotesDraft((d) => ({ ...d, [o.id]: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors resize-y"
              />
            </label>
            <button
              onClick={() => save(o.id, { notes: notesDraft[o.id] ?? "" })}
              disabled={saving === o.id}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors"
            >
              {ta("saveNotes")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
