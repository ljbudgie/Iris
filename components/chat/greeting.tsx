"use client";

import { motion } from "framer-motion";
import { SparklesIcon } from "./icons";
import { useGateStatus } from "./use-gate-status";

export const Greeting = ({
  onQuickAction,
}: {
  onQuickAction?: (text: string) => void;
}) => {
  const { modelCount, peerCount } = useGateStatus();

  return (
    <div
      className="flex w-full max-w-2xl flex-col items-center gap-10 px-4"
      key="overview"
    >
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
                "radial-gradient(circle, rgba(15, 118, 110, 0.16) 0%, transparent 70%)",
            }}
          />
          <div className="relative flex size-10 items-center justify-center text-[#5eead4]">
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
          I am the governing layer. The model underneath me can explain a
          finding. It does not get to change one.
        </p>
        <p
          className="max-w-md text-[13px] leading-relaxed text-[#e4e4e7]"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          }}
        >
          Was a human member of the team able to personally review the specific
          facts of my specific situation?
        </p>
        <p
          className="text-[13px] text-[#a1a1aa]"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          }}
        >
          Tell me what they did. We'll work out what to ask, together.
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col gap-2"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {[
          {
            label: "Draft the question to an institution",
            message:
              "Help me draft a calm letter that asks whether a named human reviewed the specific facts of my situation. Not legal advice.",
          },
          {
            label: "A reasonable adjustment was refused",
            message:
              "A reasonable adjustment I asked for was refused. Help me ask, calmly, whether a named person reviewed my specific circumstances. Email only if I need it. Not legal advice.",
          },
          {
            label: "Test a reply they sent me",
            message:
              "I am pasting a reply from an institution. Classify it SOVEREIGN, NULL, or AMBIGUOUS before you answer, and do not change that finding.",
          },
        ].map((action) => (
          <button
            aria-label={action.label}
            className="w-full rounded-lg border px-4 py-2.5 text-left text-[12px] text-[#a1a1aa] transition-all duration-200 hover:border-[rgba(15,118,110,0.45)] hover:text-[#e4e4e7]"
            key={action.label}
            onClick={() => onQuickAction?.(action.message)}
            style={{
              fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
              borderColor: "#27272a",
              background: "var(--surface-2)",
            }}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm items-center justify-center gap-16"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Status label="Gate" value="On" tone="on" />
        <Status label="Models" value={String(modelCount)} tone="muted" />
        <Status
          label="Peers"
          value={peerCount === 0 ? "None" : String(peerCount)}
          tone="muted"
        />
      </motion.div>
    </div>
  );
};

function Status({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "on" | "muted";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#52525b]"
        style={{
          fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
        }}
      >
        {label}
      </span>
      <span
        className="text-[14px] tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          color: tone === "on" ? "#5eead4" : "#a1a1aa",
        }}
      >
        {value}
      </span>
    </div>
  );
}
