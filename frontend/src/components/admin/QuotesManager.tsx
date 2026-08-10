"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import StatusBadge, { statusKey } from "../StatusBadge";
import type { Toast } from "./ResourceManager";

const STATUSES = ["pending", "confirmed", "in_progress", "ready", "delivered", "cancelled"];

interface Quote {
  id: number;
  frameName: string;
  width: number;
  height: number;
  quantity: number;
  total: number;
  name: string | null;
  email: string | null;
  status: string;
  createdAt: string;
}

export default function QuotesManager({ onToast }: { onToast: (toast: Toast) => void }) {
  const t = useTranslations("admin");
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .list<Quote>("/api/quotes")
      .then(setItems)
      .catch((e) => onToast({ type: "err", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [onToast]);

  useEffect(load, [load]);

  const setStatus = async (id: number, status: string) => {
    setSaving(id);
    try {
      await api.patch("/api/quotes", id, { status });
      onToast({ type: "ok", msg: t("saved") });
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
        {t("noQuotes")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-charcoal-700/60 border border-charcoal-700/80">
      {items.map((q) => (
        <div key={q.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-cream-100 truncate">{q.frameName}</p>
            <p className="mt-1 text-xs text-cream-400/70">
              {q.width}″×{q.height}″ · ×{q.quantity} · NPR {Number(q.total).toLocaleString("en-US")}
            </p>
            {(q.name || q.email) && (
              <p className="mt-1 text-xs text-cream-500/60">
                {q.name} {q.email ? `· ${q.email}` : ""} — {q.createdAt}
              </p>
            )}
          </div>
          <StatusBadge status={q.status} label={t(statusKey(q.status))} />
          <select
            value={q.status}
            onChange={(e) => setStatus(q.id, e.target.value)}
            disabled={saving === q.id}
            className="px-2.5 py-1.5 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-xs text-cream-100 outline-none transition-colors disabled:opacity-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(statusKey(s))}
              </option>
            ))}
          </select>
          {saving === q.id && <Loader2 size={14} className="animate-spin text-gold-400" />}
        </div>
      ))}
    </div>
  );
}
