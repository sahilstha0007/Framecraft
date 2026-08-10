"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { api, ApiError } from "@/lib/api";
import type { Toast } from "./ResourceManager";

interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "seller" | "admin";
  createdAt: string;
  bookings: number;
  quotes: number;
}

export default function UsersManager({ onToast }: { onToast: (toast: Toast) => void }) {
  const t = useTranslations("admin");
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .list<User>("/api/users")
      .then(setItems)
      .catch((e) => onToast({ type: "err", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [onToast]);

  useEffect(load, [load]);

  const changeRole = async (u: User, role: User["role"]) => {
    setSaving(u.id);
    try {
      await api.patch("/api/users", u.id, { role });
      onToast({ type: "ok", msg: t("roleUpdated") });
      load();
    } catch (e) {
      onToast({
        type: "err",
        msg: e instanceof ApiError && e.status === 403 ? t("cannotChangeSelf") : (e as Error).message,
      });
    } finally {
      setSaving(null);
    }
  };

  const remove = async (u: User) => {
    if (!window.confirm(t("deleteConfirm", { name: u.name }))) return;
    setSaving(u.id);
    try {
      await api.remove("/api/users", u.id);
      onToast({ type: "ok", msg: t("userDeleted") });
      load();
    } catch (e) {
      onToast({
        type: "err",
        msg: e instanceof ApiError && e.status === 403 ? t("cannotDeleteSelf") : (e as Error).message,
      });
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
        {t("noUsers")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-charcoal-700/60 border border-charcoal-700/80">
      {items.map((u) => {
        const role = u.role;
        const roleLabel =
          role === "admin" ? t("roleAdmin") : role === "seller" ? t("roleSeller") : t("roleCustomer");
        const roleBadge =
          role === "admin"
            ? "bg-red-400/15 text-red-300 border-red-500/40"
            : role === "seller"
              ? "bg-gold-400/15 text-gold-300 border-gold-500/40"
              : "bg-white/[0.04] text-cream-400/70 border-white/10";
        return (
          <div key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="font-medium text-cream-100 truncate">{u.name}</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[0.6rem] font-medium tracking-wide uppercase ${roleBadge}`}
                >
                  {role === "admin" ? <ShieldCheck size={10} /> : <UserRound size={10} />}
                  {roleLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-cream-400/70">{u.email}</p>
            </div>

            {/* Request counts */}
            <div className="flex gap-4 text-xs text-cream-400/70">
              <span>
                <span className="text-cream-100 font-medium">{u.bookings}</span> {t("bookingsTitle").toLowerCase()}
              </span>
              <span>
                <span className="text-cream-100 font-medium">{u.quotes}</span> {t("quotesTitle").toLowerCase()}
              </span>
            </div>

            {/* Role control */}
            <label className="sr-only">{t("role")}</label>
            <select
              value={u.role}
              onChange={(e) => changeRole(u, e.target.value as User["role"])}
              disabled={saving === u.id}
              className="px-2.5 py-1.5 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-xs text-cream-100 outline-none transition-colors disabled:opacity-50"
            >
              <option value="customer">{t("roleCustomer")}</option>
              <option value="seller">{t("roleSeller")}</option>
              <option value="admin">{t("roleAdmin")}</option>
            </select>

            {/* Delete */}
            <button
              onClick={() => remove(u)}
              disabled={saving === u.id}
              className="p-2 text-cream-400 hover:text-red-400 disabled:opacity-40 transition-colors cursor-pointer"
              aria-label={t("deleteUser")}
            >
              {saving === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
