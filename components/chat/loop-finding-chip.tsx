"use client";

/**
 * Surfaces a provisional loop-classifier finding to the user.
 *
 * Listens for the `iris:loop-finding` CustomEvent dispatched by
 * DataStreamHandler when the classifyLoop tool returns a finding. Renders
 * a small chip above the input — amber for a NULL accountability finding
 * (no named individual identified), sage for SOVEREIGN (a named individual
 * has been identified). The accountability signal is separate from
 * whether a loop was detected — this chip never claims a finding has been
 * recorded or confirmed.
 *
 * Defensive: never blocks input, never throws into the UI tree.
 */

import { ShieldQuestionIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { LoopFinding } from "@/lib/loop";

export function LoopFindingChip() {
  const [finding, setFinding] = useState<LoopFinding | null>(null);

  // Listen for the event dispatched by DataStreamHandler.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LoopFinding>).detail;
      if (detail) {
        setFinding(detail);
      }
    };
    window.addEventListener("iris:loop-finding", handler);
    return () => window.removeEventListener("iris:loop-finding", handler);
  }, []);

  if (!finding) {
    return null;
  }

  const isSovereign = finding.accountability_finding === "SOVEREIGN";
  const colorClass = isSovereign
    ? "border-[rgba(101,163,13,0.35)] bg-[rgba(101,163,13,0.12)] text-[#a3e635]"
    : "border-[rgba(217,119,6,0.35)] bg-[rgba(217,119,6,0.12)] text-[#fbbf24]";

  return (
    <div
      aria-live="polite"
      className="mx-auto mb-1 flex w-fit flex-col items-center gap-1 rounded-2xl border px-2.5 py-1 text-[10px] font-medium text-center"
      role="status"
    >
      <div
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 uppercase tracking-[0.12em] ${colorClass}`}
      >
        <ShieldQuestionIcon aria-hidden="true" className="size-3" />
        <span>
          {finding.loop_detected
            ? `Loop detected · ${finding.loop_type?.replace(/_/g, " ")}`
            : "No loop detected"}{" "}
          · {finding.accountability_finding}
        </span>
      </div>
      <span className="normal-case tracking-normal text-muted-foreground">
        A named human must confirm this before it is recorded.
      </span>
    </div>
  );
}
