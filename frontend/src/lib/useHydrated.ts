"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `true` only on the client after hydration.
 *
 * Replaces the classic `useState(false)` + `useEffect(() => setMounted(true), [])`
 * hydration guard: the server render and the first client render both see
 * `false` (so SSR output and hydration match), then a re-render flips it to
 * `true` after mount. No effect, no cascading render — the React-blessed way
 * to bridge the client/server gap for things like localStorage reads.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
