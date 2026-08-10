"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/**
 * ── Request deduplication (client-swr-dedup) ─────────────────────────────
 * Multiple components on the same page may mount the same collection
 * (e.g. the home page and the Hero both load /api/gallery). A module-level
 * in-flight map shares a single network request for concurrent callers.
 *
 * We intentionally do NOT cache resolved payloads: the codebase documents
 * that content added through /admin appears live once the API is running,
 * so every fresh mount refetches. Dedup only collapses simultaneous
 * requests — freshness is preserved.
 */

// Path → shared in-flight promise (dedupes concurrent requests).
const inflight = new Map<string, Promise<unknown>>();

function fetchCollection<T>(resource: string): Promise<T[]> {
  const path = `/api/${resource}`;

  // Reuse a request that's already in flight (dedup).
  const pending = inflight.get(path);
  if (pending) return pending as Promise<T[]>;

  // Start a new request and share it with any concurrent callers. The
  // cleanup only removes the entry if it is still THIS promise — so a
  // `refresh()` that starts a fresh request mid-flight isn't clobbered
  // when the older request settles.
  const request = api.list<T>(path).finally(() => {
    if (inflight.get(path) === request) inflight.delete(path);
  });
  inflight.set(path, request);
  return request;
}

/**
 * Fetch a catalog collection from the API. While the backend is unreachable —
 * or returns an empty list — the bundled `fallback` data keeps the site fully
 * functional, so new content added through /admin appears live once the API
 * is running.
 */
export function useCollection<T>(resource: string, fallback: T[]) {
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCollection<T>(resource)
      .then((items) => {
        if (cancelled) return;
        setData(items.length ? items : fallback);
        setError(null);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, tick]);

  const refresh = useCallback(() => {
    // Drop any in-flight share for this resource so the next tick refetches
    // instead of joining a stale request.
    inflight.delete(`/api/${resource}`);
    setTick((t) => t + 1);
  }, [resource]);

  return { data, loading, error, refresh };
}
