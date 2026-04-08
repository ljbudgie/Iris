"use client";

import { formatDistance } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ChatAuditLog } from "@/lib/db/schema";

export default function AuditLogPage() {
  const [entries, setEntries] = useState<ChatAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/audit`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch audit log");
      }
      const data = await res.json();
      setEntries(data);
    } catch {
      toast.error(
        "Failed to load audit log. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const totalTokens = entries.reduce(
    (sum, entry) => sum + (entry.totalTokens ?? 0),
    0
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Transparency trail for all AI interactions — models used, tokens
          consumed, tools invoked, and governance status.
        </p>
      </div>

      {!isLoading && entries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col rounded-lg border px-4 py-3">
            <span className="text-muted-foreground text-xs">Total entries</span>
            <span className="font-semibold tabular-nums text-lg">
              {entries.length}
            </span>
          </div>
          <div className="flex flex-col rounded-lg border px-4 py-3">
            <span className="text-muted-foreground text-xs">
              Total tokens used
            </span>
            <span className="font-semibold tabular-nums text-lg">
              {totalTokens.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Loading audit log…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground text-sm">No audit entries yet.</p>
          <p className="text-muted-foreground/60 text-xs">
            Entries are created automatically when you chat with Iris.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <AuditEntryCard entry={entry} key={entry.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditEntryCard({ entry }: { entry: ChatAuditLog }) {
  const isSovereign = entry.governanceStatus === "SOVEREIGN";
  const statusColor = isSovereign
    ? "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400"
    : "border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400";

  const tools = (entry.toolsInvoked ?? []) as string[];

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {entry.modelId && (
            <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-xs">
              {entry.modelId}
            </span>
          )}
          {entry.governanceStatus && (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor}`}
            >
              {entry.governanceStatus}
            </span>
          )}
        </div>
        <span className="shrink-0 text-muted-foreground text-xs">
          {formatDistance(new Date(entry.createdAt), new Date(), {
            addSuffix: true,
          })}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
        <span>Chat: {entry.chatId.slice(0, 8)}…</span>
        <span className="tabular-nums">
          Prompt: {(entry.promptTokens ?? 0).toLocaleString()} tokens
        </span>
        <span className="tabular-nums">
          Completion: {(entry.completionTokens ?? 0).toLocaleString()} tokens
        </span>
        <span className="tabular-nums">
          Total: {(entry.totalTokens ?? 0).toLocaleString()} tokens
        </span>
      </div>

      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tools.map((tool) => (
            <span
              className="rounded-md bg-primary/5 px-2 py-0.5 text-primary text-xs"
              key={tool}
            >
              {tool}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
