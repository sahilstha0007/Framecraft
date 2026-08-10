"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AuthUser } from "./api";

/**
 * Restores the current session (httpOnly cookie) and exposes sign-out.
 * Components mount → `me()` resolves the cookie → `user` is populated.
 */
const AUTH_EVENT = "fc-auth-changed";

/**
 * Tell every mounted useAuth consumer (e.g. the Navbar, which lives in the
 * persistent layout) that the session changed — login/register/logout call
 * this because client-side navigation does not remount the layout.
 */
export function emitAuthChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.me();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-sync when the session changes anywhere (login, register, sign out).
  useEffect(() => {
    const onAuth = () => refresh();
    window.addEventListener(AUTH_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_EVENT, onAuth);
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* session already gone */
    }
    emitAuthChanged();
    setUser(null);
  }, []);

  return { user, loading, refresh, signOut };
}
