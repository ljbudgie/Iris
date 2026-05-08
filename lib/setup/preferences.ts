/**
 * Local-first user preferences captured by the first-run wizard.
 *
 * Stored in `localStorage` under a single key so the chat shell can
 * read them synchronously without hitting the server. Nothing here
 * leaves the user's device.
 */

export type IrisRunMode = "local" | "cloud" | "hybrid";

export type IrisProvider = "ollama" | "gateway";

export type IrisPreferences = {
  /** Whether the user has finished the onboarding wizard. */
  onboarded: boolean;
  /** Local / Cloud / Hybrid — chosen at onboarding. */
  mode: IrisRunMode;
  /** Selected AI provider, if any. */
  provider?: IrisProvider;
  /** When true, render the lightweight visual mode (Calm mode). */
  calmMode: boolean;
  /** Sovereign Hub Mode — see docs/sovereign-hub.md. */
  hubMode: boolean;
};

export const PREFERENCES_KEY = "iris.preferences.v1";

export const defaultPreferences: IrisPreferences = {
  onboarded: false,
  mode: "local",
  calmMode: false,
  hubMode: false,
};

export function readPreferences(): IrisPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return defaultPreferences;
    }
    const parsed = JSON.parse(raw) as Partial<IrisPreferences>;
    return { ...defaultPreferences, ...parsed };
  } catch {
    return defaultPreferences;
  }
}

export function writePreferences(prefs: Partial<IrisPreferences>): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const next = { ...readPreferences(), ...prefs };
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  } catch {
    /* localStorage quota / privacy mode — non-fatal */
  }
}
