"use client";

/**
 * Performance mode detector.
 *
 * Returns "lite" when any of the following are true:
 *   - The user has chosen Calm mode in preferences (lib/setup/preferences).
 *   - The user prefers reduced motion (OS-level accessibility setting).
 *   - The browser reports `connection.saveData === true`.
 *   - `navigator.deviceMemory` reports 4 GB or less.
 *   - The Battery API reports a discharging device below 20%.
 *
 * Returns "full" otherwise.
 *
 * Components should hide expensive decorative layers (particles, large
 * blurs, looping motion.div animations) in "lite" mode.
 */

import { useEffect, useState } from "react";
import { readPreferences } from "@/lib/setup/preferences";
import { useReducedMotion } from "./use-reduced-motion";

export type PerfMode = "full" | "lite";

type ConnectionLike = { saveData?: boolean };

type NavigatorWithExtras = Navigator & {
  connection?: ConnectionLike;
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
};

export function usePerfMode(): PerfMode {
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<PerfMode>("full");

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      // Calm mode pref always wins.
      if (readPreferences().calmMode) {
        if (!cancelled) {
          setMode("lite");
        }
        return;
      }

      if (reducedMotion) {
        if (!cancelled) {
          setMode("lite");
        }
        return;
      }

      const nav = navigator as NavigatorWithExtras;

      if (nav.connection?.saveData) {
        if (!cancelled) {
          setMode("lite");
        }
        return;
      }

      if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
        if (!cancelled) {
          setMode("lite");
        }
        return;
      }

      if (typeof nav.getBattery === "function") {
        try {
          const battery = await nav.getBattery();
          if (battery.level < 0.2 && !battery.charging) {
            if (!cancelled) {
              setMode("lite");
            }
            return;
          }
        } catch {
          /* battery API blocked — ignore */
        }
      }

      if (!cancelled) {
        setMode("full");
      }
    };

    evaluate();

    // Re-evaluate when preferences change (e.g. Calm mode toggled in
    // the command palette) — no full page reload needed.
    const onPrefsChange = () => {
      evaluate();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("iris:preferences-changed", onPrefsChange);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("iris:preferences-changed", onPrefsChange);
      }
    };
  }, [reducedMotion]);

  return mode;
}
