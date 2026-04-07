"use client";

import { ShieldCheckIcon, ShieldOffIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { FederationProvider } from "@/lib/federation/types";

export default function FederationProvidersPage() {
  const [providers, setProviders] = useState<FederationProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/federation/register`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch providers");
      }
      const data = await res.json();
      setProviders(data);
    } catch {
      toast.error("Failed to load providers.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleUpdateStatus = (
    id: string,
    governanceStatus: "SOVEREIGN" | "NULL"
  ) => {
    const res = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/federation/register`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, governanceStatus }),
      }
    );

    const label =
      governanceStatus === "SOVEREIGN"
        ? "Promoting to SOVEREIGN"
        : "Revoking to NULL";

    toast.promise(res, {
      loading: `${label}…`,
      success: () => {
        fetchProviders();
        return governanceStatus === "SOVEREIGN"
          ? "Provider marked SOVEREIGN ✓"
          : "Provider revoked to NULL";
      },
      error: "Failed to update governance status.",
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">Federation Providers</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Manage governance status for registered providers. Mark a provider as
          SOVEREIGN once a human mind has reviewed it.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Loading providers…
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No providers registered yet.
          </p>
          <p className="text-muted-foreground/60 text-xs">
            Use the federation register API to add providers.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              onUpdateStatus={handleUpdateStatus}
              provider={provider}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  onUpdateStatus,
}: {
  provider: FederationProvider;
  onUpdateStatus: (id: string, governanceStatus: "SOVEREIGN" | "NULL") => void;
}) {
  const isSovereign = provider.governanceStatus === "SOVEREIGN";

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{provider.name}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                isSovereign
                  ? "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400"
                  : "border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {isSovereign ? (
                <ShieldCheckIcon className="size-3" />
              ) : (
                <ShieldOffIcon className="size-3" />
              )}
              {provider.governanceStatus}
            </span>
          </div>
          <p className="truncate text-muted-foreground text-xs">
            {provider.endpointUrl}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {provider.capabilities.map((cap) => (
          <span
            className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs"
            key={cap}
          >
            {cap}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-muted-foreground text-xs">
          Registered {new Date(provider.registeredAt).toLocaleString()}
        </span>

        {isSovereign ? (
          <button
            className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => onUpdateStatus(provider.id, "NULL")}
            type="button"
          >
            Revoke to NULL
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
            onClick={() => onUpdateStatus(provider.id, "SOVEREIGN")}
            type="button"
          >
            <ShieldCheckIcon className="size-4" />
            Mark SOVEREIGN
          </button>
        )}
      </div>
    </div>
  );
}
