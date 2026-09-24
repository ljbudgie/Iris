"use client";

import { motion } from "framer-motion";
import { SparklesIcon } from "./icons";
import { useGateStatus } from "./use-gate-status";

const ACTIONS = [
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
      'They sent this. Classify it and do not change the finding:\n\n"Your claim has been processed. This is an automated message. It was reviewed in line with our policy and is subject to human oversight by a member of the team."\n\nNot legal advice.',
  },
] as const;

export const Greeting = ({
  onQuickAction,
}: {
  onQuickAction?: (text: string) => void;
}) => {
  const { modelCount, peerCount } = useGateStatus();

  return (
    <div
      className="flex w-full max-w-xl flex-col items-center gap-5 px-3 pb-2 md:gap-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="hidden flex-col items-center gap-3 md:flex"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative flex size-10 items-center justify-center text-[#5eead4]">
          <SparklesIcon size={24} />
        </div>
        <h1
          className="text-[20px] font-semibold tracking-[0.25em] uppercase text-[#e4e4e7]"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
            fontWeight: 600,
          }}
        >
          IRIS
        </h1>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2 text-center"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          className="hidden max-w-md text-[13px] leading-relaxed text-[#a1a1aa] md:block"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          }}
        >
          I am the governing layer. The model underneath me can explain a
          finding. It does not get to change one.
        </p>
        <p
          className="max-w-md text-[14px] leading-snug text-[#e4e4e7] md:text-[13px] md:leading-relaxed"
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
          Tell me what they did. We&apos;ll work out what to ask, together.
        </p>
        <p
          className="hidden max-w-md text-[11px] leading-relaxed text-[#71717a] md:block"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          }}
        >
          SOVEREIGN is a named person. NULL is nobody. AMBIGUOUS is a process.
          UK00004343685. Not legal advice.
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col gap-2"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {ACTIONS.map((action) => (
          <button
            aria-label={action.label}
            className="w-full rounded-lg border px-4 py-3 text-left text-[13px] text-[#a1a1aa] transition-all duration-200 hover:border-[rgba(15,118,110,0.45)] hover:text-[#e4e4e7] md:py-2.5 md:text-[12px]"
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
        className="flex w-full max-w-sm items-center justify-center gap-8 md:gap-16"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#52525b]"
        style={{
          fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
        }}
      >
        {label}
      </span>
      <span
        className="text-[13px] tabular-nums md:text-[14px]"
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
