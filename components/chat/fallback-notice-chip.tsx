"use client";

/**
 * Surfaces a provider-fallback event to the user.
 *
 * Listens for the `iris:fallback-notice` CustomEvent dispatched by
 * DataStreamHandler when the server falls back to an alternative model
 * mid-session (e.g. because the originally requested model was withdrawn or
 * rate-limited). Renders a small calm chip above the input — same visual
 * style as PersonGateChip — and auto-dismisses after 8 seconds.
 *
 * Defensive: never blocks input, never throws into the UI tree.
 */

import { ShieldAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function FallbackNoticeChip() {
  const [message, setMessage] = useState<string | null>(null);

  // Listen for the event dispatched by DataStreamHandler.
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      if (msg) setMessage(msg);
    };
    window.addEventListener("iris:fallback-notice", handler);
    return () => window.removeEventListener("iris:fallback-notice", handler);
  }, []);

  // Auto-dismiss after 8 seconds.
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 8000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      aria-live="polite"
      className="mx-auto mb-1 flex w-fit items-center gap-1.5 rounded-full border border-[rgba(15,118,110,0.35)] bg-[rgba(15,118,110,0.12)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#5eead4]"
      role="status"
    >
      <ShieldAlertIcon aria-hidden="true" className="size-3" />
      <span>{message}</span>
    </div>
  );
}
