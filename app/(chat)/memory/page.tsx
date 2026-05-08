"use client";

import {
  BrainIcon,
  DownloadIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type MemoryResponse = {
  configured: boolean;
  status?: unknown;
  results?: unknown;
};

export default function MemoryPalacePage() {
  const [memory, setMemory] = useState<MemoryResponse | null>(null);
  const [query, setQuery] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadMemory = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/memory${params}`
      );
      if (!res.ok) {
        throw new Error("Failed to load memory");
      }
      setMemory(await res.json());
    } catch {
      toast.error("Failed to load Memory Palace.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const remember = async () => {
    if (!content.trim()) {
      return;
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/memory`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wing: "wing_user",
          room: "user-approved",
          content,
        }),
      }
    );

    if (!res.ok) {
      toast.error("Could not store that memory.");
      return;
    }

    setContent("");
    toast.success("Saved to Memory Palace.");
    loadMemory();
  };

  const exportMemory = () => {
    try {
      const blob = new Blob([JSON.stringify(memory ?? {}, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `iris-memory-${new Date().toISOString()}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Could not export the current memory view.");
    }
  };

  const forget = async (memoryId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/memory/${encodeURIComponent(
          memoryId
        )}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        throw new Error("forget failed");
      }
      toast.success("Forgotten. Iris will exclude this from future answers.");
      loadMemory(query);
    } catch {
      toast.error("Could not forget that memory.");
    }
  };

  const sourceOfTruthLabel = memory?.configured
    ? "MemPalace (local) — authoritative"
    : "Session only — set MEMPALACE_MCP_COMMAND for persistence";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="rounded-3xl border border-[rgba(15,118,110,0.25)] bg-[linear-gradient(135deg,rgba(15,118,110,0.16),rgba(214,188,143,0.08))] p-5 shadow-[var(--shadow-float)]">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-[rgba(15,118,110,0.18)] text-[#5eead4] ring-1 ring-[rgba(94,234,212,0.25)]">
            <BrainIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-semibold text-xl">Memory Palace</h1>
            <p className="text-muted-foreground text-sm">
              User-approved memory controls for Iris. Nothing is stored here
              unless you choose to remember it.
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#5eead4]">
              <ShieldCheckIcon className="size-3" />
              {sourceOfTruthLabel}
            </p>
          </div>
        </div>
      </div>

      {!isLoading && memory?.configured === false && (
        <div className="rounded-2xl border border-dashed p-5 text-muted-foreground text-sm">
          MemPalace is not configured. Set <code>MEMPALACE_MCP_COMMAND</code> to
          enable local palace memory.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border bg-card/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-[#22c55e]" />
            <h2 className="font-medium">Remember this</h2>
          </div>
          <textarea
            className="min-h-36 w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-[rgba(15,118,110,0.45)]"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste an exact fact, preference, project note, institution detail, or reminder you want Iris to remember…"
            value={content}
          />
          <button
            className="mt-3 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm disabled:opacity-40"
            disabled={!content.trim() || memory?.configured === false}
            onClick={remember}
            type="button"
          >
            Save memory
          </button>
        </div>

        <div className="rounded-2xl border bg-card/40 p-4">
          <h2 className="mb-3 font-medium">Find memories</h2>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-[rgba(15,118,110,0.45)]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your palace…"
              value={query}
            />
            <button
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              disabled={memory?.configured === false}
              onClick={() => loadMemory(query)}
              type="button"
            >
              <SearchIcon className="size-4" />
              Search
            </button>
          </div>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground text-sm hover:bg-muted hover:text-foreground"
            onClick={exportMemory}
            type="button"
          >
            <DownloadIcon className="size-4" />
            Export current view
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4">
        <h2 className="mb-3 font-medium">Current palace view</h2>
        {(() => {
          const results =
            (memory?.results as
              | {
                  id?: string;
                  content?: string;
                  wing?: string;
                  room?: string;
                }[]
              | undefined) ?? [];
          if (isLoading) {
            return <p className="text-muted-foreground text-sm">Loading…</p>;
          }
          if (Array.isArray(results) && results.length > 0) {
            return (
              <ul className="flex flex-col gap-2">
                {results.map((row, i) => {
                  const id = row.id ?? `row-${i}`;
                  return (
                    <li
                      className="flex items-start gap-2 rounded-xl border border-border/60 bg-background p-3 text-[12px]"
                      key={id}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {[row.wing, row.room].filter(Boolean).join(" / ")}
                        </div>
                        <div className="mt-0.5 break-words text-foreground">
                          {row.content ?? JSON.stringify(row)}
                        </div>
                      </div>
                      <button
                        aria-label="Forget this memory"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(239,68,68,0.3)] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[#fca5a5] transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                        onClick={() => forget(id)}
                        type="button"
                      >
                        <Trash2Icon className="size-3" /> Forget
                      </button>
                    </li>
                  );
                })}
              </ul>
            );
          }
          return (
            <pre className="max-h-[480px] overflow-auto rounded-xl bg-background p-3 text-[11px] text-muted-foreground">
              {JSON.stringify(memory?.status ?? memory, null, 2)}
            </pre>
          );
        })()}
      </section>
    </div>
  );
}
