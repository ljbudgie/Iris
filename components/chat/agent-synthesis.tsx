"use client";

import { memo } from "react";
import type { AgentSynthesisData } from "@/hooks/use-active-chat";
import { cn } from "@/lib/utils";
import { MessageContent, MessageResponse } from "../ai-elements/message";

function PureAgentSynthesis({ synthesis }: { synthesis: AgentSynthesisData }) {
  if (!synthesis.text && !synthesis.error) {
    return null;
  }

  const governanceBadge =
    synthesis.governanceStatus === "SOVEREIGN" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
        SOVEREIGN
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
        NULL — Pending Review
      </span>
    );

  return (
    <div
      className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.03] p-4"
      data-testid="agent-synthesis"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
          <AgentIcon size={11} />
        </div>
        <span className="text-[12px] font-semibold text-foreground">
          Agent Synthesis
        </span>
        <span className="text-[10px] text-muted-foreground">
          Agent + Models
        </span>
        {governanceBadge}
      </div>

      {synthesis.error ? (
        <p className="italic text-[12px] text-muted-foreground">
          {synthesis.error}
        </p>
      ) : (
        <MessageContent className="text-[13px] leading-[1.65]">
          <MessageResponse>{synthesis.text}</MessageResponse>
        </MessageContent>
      )}

      {synthesis.attributions.length > 0 && (
        <div className="mt-3 border-t border-primary/10 pt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Sources
          </p>
          <div className="flex flex-wrap gap-1.5">
            {synthesis.attributions.map((attr) => (
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] ring-1",
                  attr.sourceType === "agent"
                    ? "bg-primary/10 text-primary ring-primary/20"
                    : "bg-muted/50 text-muted-foreground ring-border/40"
                )}
                key={attr.sourceId}
              >
                {attr.sourceName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export const AgentSynthesis = memo(PureAgentSynthesis);
