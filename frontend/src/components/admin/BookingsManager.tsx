"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import StatusBadge, { statusKey } from "../StatusBadge";
import type { Toast } from "./ResourceManager";

const STATUSES = ["pending", "confirmed", "in_progress", "ready", "delivered", "cancelled"];

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  date: string;
  time: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function BookingsManager({ onToast }: { onToast: (toast: Toast) => void }) {
  const t = useTranslations("admin");
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    api
      .list<Booking>("/api/bookings")
      .then((rows) => {
        setItems(rows);
        setNotesDraft(Object.fromEntries(rows.map((b) => [b.id, b.notes ?? ""])));
      })
      .catch((e) => onToast({ type: "err", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [onToast]);

  useEffect(load, [load]);

  const save = async (id: number, body: { status?: string; notes?: string }) => {
    setSaving(id);
    try {
      await api.patch("/api/bookings", id, body);
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
        {t("noBookings")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((b) => (
        <div key={b.id} className="border border-charcoal-700/80 bg-charcoal-900/30 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="font-medium text-cream-100">{b.name}</p>
                <StatusBadge status={b.status} label={t(statusKey(b.status))} />
              </div>
              <p className="mt-1 text-xs text-cream-400/70">
                {b.email} {b.phone ? ` · ${b.phone}` : ""}
              </p>
              <p className="mt-2 text-sm text-cream-200">{b.service}</p>
              <p className="mt-0.5 text-xs text-cream-500/60">
                {b.date} {b.time ? ` · ${b.time}` : ""} — {b.createdAt}
              </p>
              {b.message && (
                <p className="mt-2 text-xs text-cream-400/70 italic">“{b.message}”</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[0.6rem] uppercase tracking-widest text-cream-500/50 sr-only">
                {t("status")}
              </label>
              <select
                value={b.status}
                onChange={(e) => save(b.id, { status: e.target.value })}
                disabled={saving === b.id}
                className="px-2.5 py-1.5 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-xs text-cream-100 outline-none transition-colors disabled:opacity-50"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(statusKey(s))}
                  </option>
                ))}
              </select>
              {saving === b.id && <Loader2 size={14} className="animate-spin text-gold-400" />}
            </div>
          </div>

          <div className="mt-4 flex items-end gap-2">
            <label className="flex-1 block">
              <span className="flex items-center gap-1.5 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-cream-500/50 mb-1.5">
                <StickyNote size={11} /> {t("notes")}
              </span>
              <textarea
                value={notesDraft[b.id] ?? ""}
                onChange={(e) => setNotesDraft((d) => ({ ...d, [b.id]: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors resize-y"
              />
            </label>
            <button
              onClick={() => save(b.id, { notes: notesDraft[b.id] ?? "" })}
              disabled={saving === b.id}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors"
            >
              {t("saveNotes")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
