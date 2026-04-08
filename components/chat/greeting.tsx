"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { SparklesIcon } from "./icons";

type GovernanceStatus = "SOVEREIGN" | "NULL" | "NO_PROVIDERS";

export const Greeting = ({
  onQuickAction,
}: {
  onQuickAction?: (text: string) => void;
}) => {
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
      {/* Iris brand mark — icon with barely-visible radial violet glow */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full"
            style={{
              width: 200,
              height: 200,
              background:
                "radial-gradient(circle, rgba(124, 58, 237, 0.03) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex size-10 items-center justify-center text-[#7c3aed]">
            <SparklesIcon size={24} />
          </div>
        </div>
        <div className="text-center">
          <h1
            className="text-[20px] font-semibold tracking-[0.25em] uppercase text-[#e4e4e7]"
            style={{
              fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
              fontWeight: 600,
            }}
          >
            IRIS
          </h1>
        </div>
      </motion.div>

      {/* Welcome message */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 text-center"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          className="max-w-md text-[13px] leading-relaxed text-[#a1a1aa]"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          }}
        >
          I&apos;m not like other AI assistants. I don&apos;t belong to one
          company or run on one model. I use the best AI available for whatever
          you need — and everything I do is accountable.
        </p>
        <p
          className="text-[13px] text-[#e4e4e7]"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          }}
        >
          What can I help you with?
        </p>
      </motion.div>

      {/* Quick action buttons */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col gap-2"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {[
          {
            label: "I need help with something specific",
            message: "I need help with something specific",
          },
          {
            label: "I want to explore what you can do",
            message:
              "What can you do? Show me your capabilities across different models and tools.",
          },
          {
            label: "Tell me how you're different",
            message:
              "How are you different from other AI assistants like ChatGPT or Claude?",
          },
        ].map((action) => (
          <button
            aria-label={action.label}
            className="w-full rounded-lg border px-4 py-2.5 text-left text-[12px] text-[#a1a1aa] transition-all duration-200 hover:border-[rgba(124,58,237,0.3)] hover:text-[#e4e4e7]"
            key={action.label}
            onClick={() => onQuickAction?.(action.message)}
            style={{
              fontFamily:
                "'JetBrains Mono', var(--font-geist-mono), monospace",
              borderColor: "#27272a",
              background: "var(--surface-2)",
            }}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </motion.div>

      {/* Federation status — key-value pairs in a single row, no cards */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm items-center justify-center gap-16"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#52525b]"
            style={{ fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace" }}
          >
            Federation
          </span>
          <span
            className="text-[14px] tabular-nums"
            style={{
              fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
              color:
                governanceStatus === "SOVEREIGN"
                  ? "var(--sovereign)"
                  : governanceStatus === "NULL"
                    ? "var(--null-review)"
                    : "#a1a1aa",
            }}
          >
            {federationLabel}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#52525b]"
            style={{ fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace" }}
          >
            Providers
          </span>
          <span
            className="text-[14px] tabular-nums text-[#a1a1aa]"
            style={{ fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace" }}
          >
            {providerCount}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#52525b]"
            style={{ fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace" }}
          >
            Governance
          </span>
          <span
            className="text-[14px]"
            style={{
              fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
              color:
                governanceStatus === "SOVEREIGN"
                  ? "var(--sovereign)"
                  : governanceStatus === "NULL"
                    ? "var(--null-review)"
                    : "#a1a1aa",
            }}
          >
            {governanceLabel}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
