"use client";

/**
 * Tracks the user's `prefers-reduced-motion` media query.
 *
 * Returns `true` when the user has asked the OS to minimise non-essential
 * motion. Components should use this to swap Framer Motion `motion.*`
 * elements for plain DOM elements and to skip decorative animations.
 */

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mql = window.matchMedia(QUERY);
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}
