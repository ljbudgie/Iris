/**
 * Accessibility Layer — accessibility isn't a feature, it's the foundation.
 *
 * Iris was born from the experience of a hearing-impaired person navigating
 * systems that didn't accommodate them. This module provides:
 *
 *   - Full keyboard navigation utilities
 *   - Screen reader helpers with proper ARIA labels
 *   - High contrast mode toggle
 *   - Font size controls
 *   - Reduced motion detection
 *   - Text-first status updates (never audio-only)
 *
 * All error messages and status updates are available as text.
 * Voice input and output are first-class features, not afterthoughts.
 */

"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ---- Types ----

export type FontSize = "small" | "medium" | "large" | "extra-large";
export type ContrastMode = "normal" | "high";

export type AccessibilitySettings = {
  fontSize: FontSize;
  highContrast: ContrastMode;
  reducedMotion: boolean;
  screenReaderAnnouncements: boolean;
};

type AccessibilityContextValue = AccessibilitySettings & {
  setFontSize: (size: FontSize) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  announce: (message: string, priority?: "polite" | "assertive") => void;
};

// ---- Font size CSS values ----

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
  "extra-large": "20px",
};

// ---- Storage key ----

const STORAGE_KEY = "iris-accessibility";

// ---- Context ----

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null
);

function loadSettings(): AccessibilitySettings {
  if (typeof window === "undefined") {
    return getDefaults();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...getDefaults(), ...JSON.parse(stored) };
    }
  } catch {
    // Ignore — use defaults
  }

  return getDefaults();
}

function getDefaults(): AccessibilitySettings {
  return {
    fontSize: "medium",
    highContrast: "normal",
    reducedMotion:
      typeof window === "undefined"
        ? false
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    screenReaderAnnouncements: true,
  };
}

function saveSettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore — non-critical
  }
}

/**
 * Accessibility provider — wraps the app and provides accessibility
 * settings and controls to all children.
 */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(getDefaults);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Apply font size to document
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_MAP[settings.fontSize];
  }, [settings.fontSize]);

  // Apply high contrast class
  useEffect(() => {
    if (settings.highContrast === "high") {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [settings.highContrast]);

  // Apply reduced motion
  useEffect(() => {
    if (settings.reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [settings.reducedMotion]);

  const setFontSize = useCallback((size: FontSize) => {
    setSettings((prev) => {
      const next = { ...prev, fontSize: size };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setSettings((prev) => {
      const next = {
        ...prev,
        highContrast:
          prev.highContrast === "normal"
            ? ("high" as const)
            : ("normal" as const),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, reducedMotion: !prev.reducedMotion };
      saveSettings(next);
      return next;
    });
  }, []);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (!settings.screenReaderAnnouncements) {
        return;
      }

      // Create a live region for screen reader announcements
      const el = document.createElement("div");
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", priority);
      el.setAttribute("aria-atomic", "true");
      el.className = "sr-only";
      el.textContent = message;
      document.body.appendChild(el);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(el);
      }, 1000);
    },
    [settings.screenReaderAnnouncements]
  );

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      ...settings,
      setFontSize,
      toggleHighContrast,
      toggleReducedMotion,
      announce,
    }),
    [settings, setFontSize, toggleHighContrast, toggleReducedMotion, announce]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to access accessibility settings and controls.
 */
export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider"
    );
  }
  return context;
}

/**
 * Skip-to-content link component for keyboard navigation.
 */
export function SkipToContent({
  targetId = "main-content",
}: {
  targetId?: string;
}) {
  return (
    <a
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--surface-2)] focus:px-4 focus:py-2 focus:text-[#e4e4e7] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      href={`#${targetId}`}
    >
      Skip to main content
    </a>
  );
}
