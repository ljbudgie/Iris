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

  const federationLabel =
    governanceStatus === "SOVEREIGN"
      ? "Active"
      : governanceStatus === "NULL"
        ? "Pending"
        : "Standby";

  const governanceLabel =
    governanceStatus === "NO_PROVIDERS" ? "\u2014" : governanceStatus;

  return (
    <div
      className="flex w-full max-w-2xl flex-col items-center gap-10 px-4"
      key="overview"
    >
      {/* Iris brand mark — icon with radial violet glow */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative flex items-center justify-center">
          <div
            className="absolute size-20 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex size-10 items-center justify-center text-[#7c3aed]">
            <SparklesIcon size={24} />
          </div>
        </div>
        <div className="text-center">
          <h1
            className="text-lg font-semibold tracking-[0.2em] uppercase text-[#e4e4e7]"
            style={{
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
            }}
          >
            IRIS
          </h1>
          <p
            className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#52525b]"
            style={{
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
            }}
          >
            Governance Layer
          </p>
        </div>
      </motion.div>

      {/* Federation status — key-value pairs in a single row, no cards */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col items-center justify-center gap-6 sm:flex-row sm:gap-16"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#52525b]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Federation
          </span>
          <span
            className="text-[11px] font-semibold"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color:
                governanceStatus === "SOVEREIGN"
                  ? "var(--sovereign)"
                  : governanceStatus === "NULL"
                    ? "var(--null-review)"
                    : "#52525b",
            }}
          >
            {federationLabel}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#52525b]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Providers
          </span>
          <span
            className="text-[11px] font-semibold tabular-nums text-[#e4e4e7]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {providerCount}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#52525b]"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            Governance
          </span>
          <span
            className="text-[11px] font-semibold"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color:
                governanceStatus === "SOVEREIGN"
                  ? "var(--sovereign)"
                  : governanceStatus === "NULL"
                    ? "var(--null-review)"
                    : "#52525b",
            }}
          >
            {governanceLabel}
          </span>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-sm italic text-[#71717a]"
        initial={{ opacity: 0, y: 8 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        Every response is accountable. Every decision is auditable.
      </motion.p>
    </div>
  );
};
