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
  const [providerCount, setProviderCount] = useState(0);

  const refreshGovernance = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/federation/register`
      );
      if (!res.ok) {
        return;
      }
      const providers: { governanceStatus: string }[] = await res.json();
      setProviderCount(providers.length);
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
    <header
      className="sticky top-0 z-10 flex flex-col"
      style={{ background: "var(--surface-0)" }}
    >
      {/* Federation status bar */}
      <div
        aria-label={
          governanceStatus === "SOVEREIGN"
            ? "Sovereign mode active — human-reviewed path"
            : governanceStatus === "NULL"
              ? "Null mode — awaiting human review"
              : "No federation providers registered"
        }
        aria-live="polite"
        className="flex h-8 items-center justify-between gap-2 border-b border-border/30 px-3 text-[11px] font-medium tracking-wide uppercase transition-colors duration-300"
        role="status"
        style={{
          background:
            governanceStatus === "SOVEREIGN"
              ? "var(--sovereign-bg)"
              : governanceStatus === "NULL"
                ? "var(--null-review-bg)"
                : "var(--surface-1)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`size-1.5 rounded-full ${
                governanceStatus === "SOVEREIGN"
                  ? "bg-sovereign shadow-[0_0_6px_var(--sovereign)]"
                  : governanceStatus === "NULL"
                    ? "bg-null-review shadow-[0_0_6px_var(--null-review)]"
                    : "bg-muted-foreground/30"
              }`}
            />
            <span
              className={
                governanceStatus === "SOVEREIGN"
                  ? "text-sovereign"
                  : governanceStatus === "NULL"
                    ? "text-null-review"
                    : "text-muted-foreground/50"
              }
            >
              {governanceStatus === "SOVEREIGN"
                ? "Federation Active"
                : governanceStatus === "NULL"
                  ? "Awaiting Review"
                  : "Standby"}
            </span>
          </div>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-muted-foreground/50">
            {providerCount} {providerCount === 1 ? "provider" : "providers"}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span
            className={
              governanceStatus === "SOVEREIGN"
                ? "text-sovereign"
                : governanceStatus === "NULL"
                  ? "text-null-review"
                  : "text-muted-foreground/40"
            }
          >
            {governanceStatus === "NO_PROVIDERS" ? "—" : governanceStatus}
          </span>
        </div>
      </div>

      {/* Main header bar */}
      <div
        className="flex h-12 items-center gap-2 border-b border-border/20 px-3"
        style={{ background: "var(--surface-0)" }}
      >
        <Button
          className="md:hidden"
          onClick={toggleSidebar}
          size="icon-sm"
          variant="ghost"
        >
          <PanelLeftIcon className="size-4" />
        </Button>

        <Link
          className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-opacity hover:opacity-80"
          href="/"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <SparklesIcon size={13} />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            IRIS
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
            <div className="flex items-center gap-1.5 rounded-md border border-border/30 bg-[var(--surface-1)] px-2.5 py-1">
              <ModelSelectorLogo
                className="size-3.5 dark:invert"
                provider={currentModel.provider}
              />
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
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
