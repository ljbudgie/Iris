"use client";

import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { chatModels } from "@/lib/ai/models";
import { SparklesIcon } from "./icons";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

type GovernanceStatus = "SOVEREIGN" | "NULL" | "NO_PROVIDERS";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  currentModelId,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  currentModelId?: string;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const [governanceStatus, setGovernanceStatus] =
    useState<GovernanceStatus>("NO_PROVIDERS");

  const refreshGovernance = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/federation/register`
      );
      if (!res.ok) return;
      const providers: { governanceStatus: string }[] = await res.json();
      if (providers.length === 0) {
        setGovernanceStatus("NO_PROVIDERS");
        return;
      }
      const allSovereign = providers.every(
        (p) => p.governanceStatus === "SOVEREIGN"
      );
      setGovernanceStatus(allSovereign ? "SOVEREIGN" : "NULL");
    } catch {
      /* governance ribbon is non-critical */
    }
  }, []);

  useEffect(() => {
    refreshGovernance();
  }, [refreshGovernance]);

  const currentModel = currentModelId
    ? chatModels.find((m) => m.id === currentModelId)
    : undefined;

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex flex-col bg-sidebar">
      {/* Governance ribbon */}
      <div
        aria-label={
          governanceStatus === "SOVEREIGN"
            ? "Sovereign mode active — human-reviewed path"
            : governanceStatus === "NULL"
              ? "Null mode — awaiting human review"
              : "No federation providers registered"
        }
        aria-live="polite"
        className={`flex h-7 items-center justify-center gap-1.5 text-[11px] font-medium transition-colors duration-300 ${
          governanceStatus === "SOVEREIGN"
            ? "bg-sovereign-bg text-sovereign"
            : governanceStatus === "NULL"
              ? "bg-null-review-bg text-null-review"
              : "bg-muted/50 text-muted-foreground/50"
        }`}
        role="status"
      >
        <div
          className={`size-1.5 rounded-full ${
            governanceStatus === "SOVEREIGN"
              ? "bg-sovereign"
              : governanceStatus === "NULL"
                ? "bg-null-review"
                : "bg-muted-foreground/30"
          }`}
        />
        <span>
          {governanceStatus === "SOVEREIGN"
            ? "SOVEREIGN — human-reviewed path active"
            : governanceStatus === "NULL"
              ? "NULL — awaiting your review"
              : "No providers registered"}
        </span>
      </div>

      {/* Main header bar */}
      <div className="flex h-14 items-center gap-2 px-3">
        <Button
          className="md:hidden"
          onClick={toggleSidebar}
          size="icon-sm"
          variant="ghost"
        >
          <PanelLeftIcon className="size-4" />
        </Button>

        <Link
          className="flex items-center gap-1.5 rounded-lg px-1.5 py-1"
          href="/"
        >
          <div className="flex size-5 items-center justify-center text-primary">
            <SparklesIcon size={12} />
          </div>
          <span className="text-sm font-semibold text-foreground">Iris</span>
          <span className="hidden text-xs text-muted-foreground md:inline">
            Human-first AI
          </span>
        </Link>

        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          {currentModel && (
            <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/50 px-2.5 py-1">
              <ModelSelectorLogo
                className="size-3.5 dark:invert"
                provider={currentModel.provider}
              />
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                {currentModel.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.currentModelId === nextProps.currentModelId
  );
});
