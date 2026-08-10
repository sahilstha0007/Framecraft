"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageOff, Loader2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { FieldConfig, ResourceConfig } from "@/lib/adminConfig";

export type Toast = { type: "ok" | "err"; msg: string };

/* ── helpers ────────────────────────────────────────────────────────────── */

function emptyValues(resource: ResourceConfig): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const f of resource.fields) {
    if (f.type === "tags") values[f.key] = "";
    else if (f.type === "checkbox") values[f.key] = false;
    else if (f.type === "number") values[f.key] = 0;
    else if (f.type === "select") values[f.key] = f.options?.[0] ?? "";
    else values[f.key] = "";
  }
  return values;
}

function initialValues(item: Record<string, unknown>, resource: ResourceConfig): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const f of resource.fields) {
    const v = item[f.key];
    if (f.type === "tags") values[f.key] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
    else if (f.type === "checkbox") values[f.key] = Boolean(v);
    else if (f.type === "number") values[f.key] = Number(v ?? 0);
    else if (f.type === "select") values[f.key] = v == null ? "" : String(v);
    else values[f.key] = v == null ? "" : String(v);
  }
  return values;
}

function serialize(values: Record<string, unknown>, fields: FieldConfig[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (f.type === "tags") {
      out[f.key] = String(v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.type === "number") {
      out[f.key] = Number(v) || 0;
    } else {
      out[f.key] = v;
    }
  }
  return out;
}

/** Normalize a datetime-local value into the API's YYYY-MM-DDTHH:MM:SS shape. */
function serializeDatetime(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return raw.length >= 16 ? `${raw.slice(0, 16)}:00` : raw;
}

function Thumb({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-11 h-11 bg-charcoal-800 flex items-center justify-center flex-shrink-0">
        <ImageOff size={14} className="text-charcoal-600" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className="w-11 h-11 object-cover flex-shrink-0" />
  );
}

/* ── form ───────────────────────────────────────────────────────────────── */

function ResourceForm({
  resource,
  initial,
  onCancel,
  onSave,
  saving,
}: {
  resource: ResourceConfig;
  initial: Record<string, unknown> | null;
  onCancel: () => void;
  onSave: (values: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initial ? initialValues(initial, resource) : emptyValues(resource)
  );
  const set = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }));
  const noun = resource.title.replace(/s$/, "");

  return (
    <div className="border border-gold-400/25 bg-charcoal-800/60 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-lg text-cream-100">
          {initial ? `Edit ${noun}` : `Add ${noun}`}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 text-cream-400 hover:text-cream-100 transition-colors"
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {resource.fields.map((field) => (
          <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2 block" : "block"}>
            <span className="block font-mono text-[0.6rem] tracking-[0.2em] uppercase text-gold-400/70 mb-1.5">
              {field.label}
            </span>

            {field.type === "textarea" ? (
              <textarea
                value={String(values[field.key] ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors resize-y"
              />
            ) : field.type === "select" ? (
              <select
                value={String(values[field.key] ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors"
              >
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "datetime" ? (
              <input
                type="datetime-local"
                value={String(values[field.key] ?? "").replace(" ", "T")}
                onChange={(e) => set(field.key, e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 outline-none transition-colors"
              />
            ) : field.type === "checkbox" ? (
              <button
                type="button"
                onClick={() => set(field.key, !values[field.key])}
                className="flex items-center gap-3 py-2 group"
              >
                <span
                  className={`w-4 h-4 border flex items-center justify-center text-[10px] font-bold transition-colors ${
                    values[field.key] ? "bg-gold-500 border-gold-500 text-charcoal-900" : "border-charcoal-600 group-hover:border-gold-500/50"
                  }`}
                >
                  {values[field.key] ? "✓" : ""}
                </span>
                <span className="text-sm text-cream-200">{field.label}</span>
              </button>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={String(values[field.key] ?? "")}
                onChange={(e) => set(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-charcoal-900 border border-charcoal-700 focus:border-gold-500/60 text-sm text-cream-100 placeholder-charcoal-600 outline-none transition-colors"
              />
            )}

            {field.hint && <span className="block mt-1 text-[0.65rem] text-cream-500/60">{field.hint}</span>}
          </label>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => {
            const out = serialize(values, resource.fields);
            const dt = resource.fields.find((f) => f.type === "datetime");
            if (dt) out[dt.key] = serializeDatetime(values[dt.key]);
            onSave(out);
          }}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {initial ? "Save changes" : "Create"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-xs tracking-[0.15em] uppercase text-cream-400 hover:text-cream-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── manager ────────────────────────────────────────────────────────────── */

export default function ResourceManager({
  resource,
  onToast,
}: {
  resource: ResourceConfig;
  onToast: (toast: Toast) => void;
}) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | number | null>(null);

  const base = resource.apiPrefix ?? `/api/${resource.slug}`;
  const listPath = resource.listPath ?? base;

  const load = useCallback(() => {
    setLoading(true);
    api
      .list<Record<string, unknown>>(listPath)
      .then((rows) => setItems(rows))
      .catch((e) => onToast({ type: "err", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [listPath, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (editing) {
        await api.update(base, String(editing.id), values);
        onToast({ type: "ok", msg: "Changes saved" });
      } else {
        await api.create(base, values);
        onToast({ type: "ok", msg: "Added to the collection" });
      }
      setCreating(false);
      setEditing(null);
      load();
    } catch (e) {
      onToast({ type: "err", msg: (e as ApiError).message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Record<string, unknown>) => {
    const name = String(item[resource.nameKey] ?? item.id ?? "this item");
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setDeleting(String(item.id));
    try {
      await api.remove(base, String(item.id));
      onToast({ type: "ok", msg: "Deleted" });
      load();
    } catch (e) {
      onToast({ type: "err", msg: (e as ApiError).message });
    } finally {
      setDeleting(null);
    }
  };

  const renderCell = (item: Record<string, unknown>, key: string) => {
    const col = resource.columns.find((c) => c.key === key);
    const value = item[key];

    if (col?.image) return <Thumb src={value ? String(value) : undefined} alt={String(item[resource.nameKey] ?? "")} />;
    if (col?.color && value && value !== "transparent") {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="w-3.5 h-3.5 border border-white/15" style={{ backgroundColor: String(value) }} />
          <span>{String(value)}</span>
        </span>
      );
    }
    if (key === "popular") {
      return value ? <span className="text-gold-400">★ Featured</span> : <span className="text-cream-500/50">—</span>;
    }
    if (key === "auction") {
      return value ? <span className="text-gold-400">Auction</span> : <span className="text-cream-500/50">—</span>;
    }
    if (key === "price") {
      return <span>NPR {String(value ?? "0")}</span>;
    }
    return <span>{String(value ?? "—")}</span>;
  };

  const noun = resource.title.replace(/s$/, "");
  const extraColumns = resource.columns.filter((c) => !c.image && c.key !== resource.nameKey);

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl text-cream-100">{resource.title}</h2>
          <p className="text-sm text-cream-400/70 mt-1 max-w-xl">{resource.description}</p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-charcoal-900 text-xs font-medium tracking-[0.15em] uppercase transition-colors"
          >
            <Plus size={14} /> Add {noun}
          </button>
        )}
      </div>

      {/* Form — keyed so switching the edited item always resets the fields */}
      {(creating || editing) && (
        <ResourceForm
          key={editing ? `edit-${String(editing.id)}` : "create"}
          resource={resource}
          initial={editing}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={save}
          saving={saving}
        />
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-cream-500/60 text-sm">
          <Loader2 size={16} className="animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-charcoal-700 text-cream-500/60 text-sm">
          {resource.emptyText}
        </div>
      ) : (
        <div className="border border-charcoal-700/80 divide-y divide-charcoal-700/60">
          {items.map((item) => (
            <div
              key={String(item.id)}
              className="flex items-center gap-4 px-4 py-3 hover:bg-charcoal-800/40 transition-colors"
            >
              {resource.columns.filter((c) => c.image).map((c) => (
                <div key={c.key}>{renderCell(item, c.key)}</div>
              ))}

              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-cream-100">
                  {String(item[resource.nameKey] ?? "Untitled")}
                </div>
                {extraColumns.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-cream-400/70">
                    {extraColumns.map((c) => (
                      <span key={c.key} className="truncate">
                        {renderCell(item, c.key)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setCreating(false);
                    setEditing(item);
                  }}
                  className="p-2 text-cream-400 hover:text-gold-400 transition-colors"
                  aria-label={`Edit ${String(item[resource.nameKey] ?? "")}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => remove(item)}
                  disabled={deleting === String(item.id)}
                  className="p-2 text-cream-400 hover:text-red-400 disabled:opacity-40 transition-colors"
                  aria-label={`Delete ${String(item[resource.nameKey] ?? "")}`}
                >
                  {deleting === String(item.id) ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
