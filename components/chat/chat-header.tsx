"use client";

import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { chatModels } from "@/lib/ai/models";
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

  const statusLabel =
    governanceStatus === "SOVEREIGN"
      ? "ACTIVE"
      : governanceStatus === "NULL"
        ? "PENDING"
        : "STANDBY";

  const governanceLabel =
    governanceStatus === "NO_PROVIDERS" ? "\u2014" : governanceStatus;

  return (
    <header
      className="sticky top-0 z-10 flex flex-col"
      style={{ background: "var(--surface-0)" }}
    >
      {/* Telemetry status bar — single line, flush left, monospace */}
      <div
        aria-label={
          governanceStatus === "SOVEREIGN"
            ? "Sovereign mode active"
            : governanceStatus === "NULL"
              ? "Null mode — awaiting human review"
              : "No federation providers registered"
        }
        aria-live="polite"
        className="flex h-7 items-center gap-0 border-b px-3 text-[10px] tracking-[0.12em] uppercase transition-colors duration-200"
        role="status"
        style={{
          fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
          borderColor: "#27272a",
          background: "var(--surface-0)",
          color: "#52525b",
          opacity: 0.35,
        }}
      >
        <span>{statusLabel}</span>
        <span className="mx-2">&middot;</span>
        <span>
          {providerCount} PROVIDER{providerCount === 1 ? "" : "S"}
        </span>
        <span className="mx-2">&middot;</span>
        <span>GOVERNANCE: {governanceLabel}</span>
      </div>

      {/* Main header bar */}
      <div
        className="flex h-11 items-center gap-2 border-b px-3"
        style={{
          background: "var(--surface-0)",
          borderColor: "#27272a",
        }}
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
          <span
            className="text-sm font-semibold tracking-[0.2em] uppercase text-[#e4e4e7]"
            style={{
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
            }}
          >
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
            <div
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1"
              style={{
                borderColor: "#27272a",
                background: "var(--surface-2)",
              }}
            >
              <ModelSelectorLogo
                className="size-3.5 dark:invert"
                provider={currentModel.provider}
              />
              <span
                className="hidden text-[11px] font-medium text-[#a1a1aa] sm:inline"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
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
