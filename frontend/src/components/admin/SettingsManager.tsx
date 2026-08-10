"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { Toast } from "./ResourceManager";

const SETTING_KEYS = [
  "phone",
  "whatsapp",
  "email",
  "address",
  "hours",
  "instagram",
  "facebook",
  "pinterest",
] as const;

const LABELS: Record<(typeof SETTING_KEYS)[number], string> = {
  phone: "Phone",
  whatsapp: "WhatsApp number (977…, no +)",
  email: "Email",
  address: "Address",
  hours: "Opening hours",
  instagram: "Instagram URL",
  facebook: "Facebook URL",
  pinterest: "Pinterest URL",
};

export default function SettingsManager({ onToast }: { onToast: (toast: Toast) => void }) {
  const t = useTranslations("admin");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Record<string, string>>("/api/settings")
      .then((settings) => {
        const flat: Record<string, string> = {};
        for (const key of SETTING_KEYS) flat[key] = String(settings[key] ?? "");
        setDraft(flat);
      })
      .catch((e) => onToast({ type: "err", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [onToast]);

  useEffect(load, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const values: Record<string, string> = {};
      for (const key of SETTING_KEYS) if (draft[key] !== undefined) values[key] = draft[key];
      await api.put("/api/settings", { values });
      onToast({ type: "ok", msg: t("settingsSaved") });
    } catch (e) {
      onToast({ type: "err", msg: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-cream-500/60 text-sm">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SETTING_KEYS.map((key) => (
          <label key={key} className="block">
            <span className="block font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70 mb-1.5">
              {LABELS[key]}
            </span>
            {key === "address" || key === "hours" ? (
              <textarea
                value={draft[key] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors resize-y"
              />
            ) : (
              <input
                type="text"
                value={draft[key] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                placeholder={LABELS[key]}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 placeholder-charcoal-600 outline-none transition-colors"
              />
            )}
          </label>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {t("saveSettings")}
      </button>
    </div>
  );
}
