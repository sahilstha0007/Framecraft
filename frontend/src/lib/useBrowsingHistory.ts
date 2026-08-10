"use client";

import { useCallback, useState } from "react";
import { api } from "./api";

export interface HistoryItem {
  id: number;
  name: string;
  category: string;
  image: string;
  price: number;
  at: number;
}

const KEY = "fc_browsing_history";
const MAX = 8;

function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return parsed
      .filter((h) => h && typeof h.id === "number" && typeof h.name === "string")
      .slice(0, MAX);
  } catch {
    return [];
  }
}

/**
 * ── Browsing history hook ──────────────────────────────────────────────────
 * Tracks which products the visitor has opened (persisted in localStorage so
 * it survives page loads and sign-in), and pings the backend with each view so
 * the trending score updates. The history is the input for the "Picked for
 * you" recommendations on the homepage.
 */
export function useBrowsingHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(readHistory);

  const record = useCallback((item: Omit<HistoryItem, "at">) => {
    setHistory((prev) => {
      const next = [
        { ...item, at: Date.now() },
        ...prev.filter((h) => h.id !== item.id),
      ].slice(0, MAX);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage full or unavailable — history is best-effort */
      }
      return next;
    });
    // Fire-and-forget view signal to the backend (drives trending).
    api
      .create<{ ok: boolean }>(`/api/products/${item.id}/view`, {})
      .catch(() => {});
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { history, record, clear };
}
