"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useCollection } from "./useCollection";
import { neContent } from "./content-ne";

/**
 * ── Localized collection hook ───────────────────────────────────────────────
 * Same API as `useCollection`, but the resolved items (API response, or the
 * bundled `fallback` when the backend is offline) are passed through the Nepali
 * content overlay when the active locale is `ne`. Items without a translation
 * keep their English text.
 *
 * Usage:
 *   const { data, loading, error, refresh } =
 *     useLocalizedCollection<Frame>("frames", frames);
 */
export function useLocalizedCollection<T extends { id: number | string }>(
  resource: keyof typeof neContent | string,
  fallback: T[]
) {
  const locale = useLocale();
  const { data, loading, error, refresh } = useCollection<T>(
    resource,
    fallback
  );

  const items = useMemo(() => {
    const resolved = data.length ? data : fallback;
    if (locale !== "ne") return resolved;

    const overlay = neContent[resource as keyof typeof neContent] as
      | Record<string | number, Partial<T>>
      | undefined;
    if (!overlay) return resolved;

    return resolved.map((item) => {
      const patch = overlay[item.id];
      return patch ? { ...item, ...patch } : item;
    });
  }, [data, fallback, resource, locale]);

  return { data: items, loading, error, refresh };
}
