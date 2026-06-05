"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useState that persists to localStorage. SSR-safe: it renders `initial` on the
 * server and on first client render (avoiding hydration mismatch), then hydrates
 * from localStorage in an effect after mount.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const hydrated = useRef(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore malformed / unavailable storage */
    }
    hydrated.current = true;
  }, [key]);

  // Save on change (only after the initial load, so we don't clobber).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / unavailable storage */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
