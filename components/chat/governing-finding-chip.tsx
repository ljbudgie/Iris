"use client";

/**
 * Shows the finding Iris computed before the model answered.
 * The model may explain this. It does not get to replace it.
 */

import { ShieldCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { GoverningStamp } from "@/lib/ai/governing-layer";

const tone: Record<GoverningStamp["classification"], string> = {
  SOVEREIGN: "border-[rgba(15,118,110,0.45)] bg-[rgba(15,118,110,0.14)] text-[#5eead4]",
  NULL: "border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.1)] text-[#fda4af]",
  AMBIGUOUS: "border-[rgba(217,119,6,0.4)] bg-[rgba(217,119,6,0.12)] text-[#fcd34d]",
};

export function GoverningFindingChip() {
  const [stamp, setStamp] = useState<GoverningStamp | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<GoverningStamp>).detail;
      if (detail?.classification) {
        setStamp(detail);
      }
    };
    window.addEventListener("iris:governing-finding", handler);
    return () => window.removeEventListener("iris:governing-finding", handler);
  }, []);

  if (!stamp) {
    return null;
  }

  const noticed =
    stamp.noticed.length > 0 ? stamp.noticed.join(" · ") : "No named reviewer";

  return (
    <div
      aria-live="polite"
      className={`mx-auto mb-1 flex w-fit max-w-full flex-col items-center gap-0.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${tone[stamp.classification]}`}
      role="status"
    >
      <span className="flex items-center gap-1.5">
        <ShieldCheckIcon aria-hidden="true" className="size-3" />
        <span>Finding · {stamp.classification} · advisory</span>
      </span>
      <span className="max-w-md truncate normal-case tracking-normal opacity-80">
        {noticed}
      </span>
    </div>
  );
}
