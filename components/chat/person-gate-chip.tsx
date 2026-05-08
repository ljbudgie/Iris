"use client";

/**
 * Surfaces the PersonGate guardrail to the user.
 *
 * Probes the `/api/person-gate` endpoint as the user types (debounced),
 * and renders a small "PersonGate active — sovereign handling" chip when
 * the message would trigger sovereign handling. This makes the guardrail
 * visible — the user sees the gate engage before they hit send.
 *
 * Defensive: never blocks input, never throws into the UI tree.
 */

import { ShieldCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Sensitivity = "none" | "personal" | "institutional";

type Props = {
  /** The current draft message text. */
  text: string;
};

export function PersonGateChip({ text }: Props) {
  const [sensitivity, setSensitivity] = useState<Sensitivity>("none");

  useEffect(() => {
    if (!text || text.trim().length < 8) {
      setSensitivity("none");
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/person-gate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          }
        );
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as { sensitivity: Sensitivity };
        setSensitivity(data.sensitivity ?? "none");
      } catch {
        /* offline / signed-out — silently no-op */
      }
    }, 600);

    return () => clearTimeout(handle);
  }, [text]);

  if (sensitivity === "none") {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="mx-auto mb-1 flex w-fit items-center gap-1.5 rounded-full border border-[rgba(15,118,110,0.35)] bg-[rgba(15,118,110,0.12)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#5eead4]"
      role="status"
    >
      <ShieldCheckIcon aria-hidden="true" className="size-3" />
      <span>
        PersonGate active ·{" "}
        {sensitivity === "institutional" ? "institutional" : "personal"}{" "}
        handling
      </span>
    </div>
  );
}
