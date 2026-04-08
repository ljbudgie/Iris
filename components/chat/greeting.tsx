"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { SparklesIcon } from "./icons";

type GovernanceStatus = "SOVEREIGN" | "NULL" | "NO_PROVIDERS";

export const Greeting = () => {
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
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    refreshGovernance();
  }, [refreshGovernance]);

  return (
    <div
      className="flex w-full max-w-2xl flex-col items-center gap-8 px-4"
      key="overview"
    >
      {/* Iris brand mark */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[var(--shadow-glow)]">
          <SparklesIcon size={20} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Iris
          </h1>
          <p className="mt-1 text-[12px] font-medium uppercase tracking-widest text-muted-foreground/50">
            Governance Layer
          </p>
        </div>
      </motion.div>

      {/* Federation dashboard cards */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 p-3"
          style={{ background: "var(--surface-1)" }}
        >
          <div
            className={`size-2 rounded-full ${
              governanceStatus === "SOVEREIGN"
                ? "bg-sovereign shadow-[0_0_8px_var(--sovereign)]"
                : governanceStatus === "NULL"
                  ? "bg-null-review shadow-[0_0_8px_var(--null-review)]"
                  : "bg-muted-foreground/30"
            }`}
          />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Federation
          </span>
          <span
            className={`text-[11px] font-semibold ${
              governanceStatus === "SOVEREIGN"
                ? "text-sovereign"
                : governanceStatus === "NULL"
                  ? "text-null-review"
                  : "text-muted-foreground/40"
            }`}
          >
            {governanceStatus === "SOVEREIGN"
              ? "Active"
              : governanceStatus === "NULL"
                ? "Pending"
                : "Standby"}
          </span>
        </div>

        <div
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 p-3"
          style={{ background: "var(--surface-1)" }}
        >
          <span className="text-lg font-bold tabular-nums text-foreground/80">
            {providerCount}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Providers
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground/40">
            {providerCount === 0 ? "Register first" : "Registered"}
          </span>
        </div>

        <div
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 p-3"
          style={{ background: "var(--surface-1)" }}
        >
          <span
            className={`text-[13px] font-bold ${
              governanceStatus === "SOVEREIGN"
                ? "text-sovereign"
                : governanceStatus === "NULL"
                  ? "text-null-review"
                  : "text-muted-foreground/30"
            }`}
          >
            {governanceStatus === "NO_PROVIDERS" ? "—" : governanceStatus}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Governance
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground/40">
            Mode
          </span>
        </div>
      </motion.div>

      {/* Prompt area label */}
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-[13px] leading-relaxed text-muted-foreground/50"
        initial={{ opacity: 0, y: 8 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        AI governance built on The Burgess Principle. Every response is
        accountable, every decision is auditable.
      </motion.p>
    </div>
  );
};
