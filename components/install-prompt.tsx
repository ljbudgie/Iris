"use client";

/**
 * PWA install prompt — shows a one-tap "Add Iris to home screen" sheet
 * the first time the user visits on a mobile browser that supports
 * `beforeinstallprompt`.
 *
 * Honours the master vision item: "PWA install prompt on first visit".
 * Dismissals are persisted so users only see it once.
 */

import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "iris.installPrompt.dismissed";

/**
 * Delay before showing the install sheet — gives the chat a chance to
 * render and the user to read it before we ask them to install.
 */
const INSTALL_PROMPT_DELAY_MS = 12_000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      // Delay showing the sheet until the user has had a useful interaction —
      // 12s gives the chat a chance to render and the user to read it.
      setTimeout(() => setVisible(true), INSTALL_PROMPT_DELAY_MS);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!(event && visible)) {
    return null;
  }

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — ignore */
    }
  };

  const install = async () => {
    try {
      await event.prompt();
      await event.userChoice;
    } finally {
      dismiss();
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 bottom-44 z-30 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-[rgba(15,118,110,0.3)] bg-[rgba(8,8,12,0.92)] p-3 shadow-[var(--shadow-float)] backdrop-blur-xl md:hidden"
      role="dialog"
    >
      <div className="flex-1 text-[12px] text-[#e4e4e7]">
        <div className="font-medium">Add Iris to your home screen</div>
        <div className="mt-0.5 text-[11px] text-[#a1a1aa]">
          One tap, no app store. Works offline.
        </div>
      </div>
      <button
        className="rounded-lg bg-[#0f766e] px-3 py-1.5 text-[12px] font-medium text-white"
        onClick={install}
        type="button"
      >
        Add
      </button>
      <button
        aria-label="Dismiss install prompt"
        className="rounded-lg p-1 text-[#a1a1aa] hover:text-[#e4e4e7]"
        onClick={dismiss}
        type="button"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
