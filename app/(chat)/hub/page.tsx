"use client";

/**
 * Sovereign Hub Mode page.
 *
 * Surfaces whether this Iris instance is acting as a hub, with a
 * read-only view of registered peers. Toggling hub mode is an env-flag
 * decision (`IRIS_HUB_MODE=1`) so the toggle here writes only to local
 * preferences — the server flag must be flipped by the operator.
 *
 * See docs/sovereign-hub.md for the full operating model.
 */

import { ServerIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { readPreferences, writePreferences } from "@/lib/setup/preferences";

type HubResponse = {
  hub: boolean;
  protocol: string;
  capabilities: string[];
  peers: { id: string; name: string; governanceStatus: string }[];
};

export default function HubPage() {
  const [data, setData] = useState<HubResponse | null>(null);
  const [serverEnabled, setServerEnabled] = useState(false);
  const [hubModePref, setHubModePref] = useState(false);

  useEffect(() => {
    setHubModePref(readPreferences().hubMode);
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/hub`
        );
        if (res.ok) {
          setServerEnabled(true);
          setData((await res.json()) as HubResponse);
        }
      } catch {
        /* offline — leave defaults */
      }
    })();
  }, []);

  const togglePref = () => {
    const next = !hubModePref;
    setHubModePref(next);
    writePreferences({ hubMode: next });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-[rgba(15,118,110,0.25)] bg-[linear-gradient(135deg,rgba(15,118,110,0.16),rgba(214,188,143,0.08))] p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-[rgba(15,118,110,0.18)] text-[#5eead4] ring-1 ring-[rgba(94,234,212,0.25)]">
            <ServerIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-semibold text-xl">Sovereign Hub Mode</h1>
            <p className="text-muted-foreground text-sm">
              One machine in your home or office acts as the hub. Phones and
              tablets connect to it instead of the cloud.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border bg-card/40 p-4">
        <h2 className="mb-2 flex items-center gap-2 font-medium">
          <ShieldCheckIcon className="size-4 text-[#5eead4]" />
          Status
        </h2>
        {serverEnabled ? (
          <p className="text-sm text-foreground">
            This Iris is acting as a Sovereign Hub for{" "}
            <span className="font-semibold">{data?.peers.length ?? 0}</span>{" "}
            peer{data?.peers.length === 1 ? "" : "s"}.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Hub mode is currently <span className="font-semibold">off</span>.
            Set <code>IRIS_HUB_MODE=1</code> in your environment and restart
            Iris to enable. See{" "}
            <a className="underline" href="/docs/sovereign-hub.md">
              docs/sovereign-hub.md
            </a>
            .
          </p>
        )}
        <label className="mt-4 inline-flex items-center gap-2 text-sm">
          <input checked={hubModePref} onChange={togglePref} type="checkbox" />
          Remember my preference for hub mode (UI only — server flag still
          required)
        </label>
      </section>

      <section className="rounded-2xl border bg-card/40 p-4">
        <h2 className="mb-3 flex items-center gap-2 font-medium">
          <UsersIcon className="size-4 text-[#5eead4]" />
          Registered peers
        </h2>
        {data?.peers && data.peers.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {data.peers.map((peer) => (
              <li
                className="flex items-center justify-between rounded-xl border bg-background p-3 text-sm"
                key={peer.id}
              >
                <span>{peer.name}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {peer.governanceStatus}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No peers registered yet.
          </p>
        )}
      </section>
    </div>
  );
}
