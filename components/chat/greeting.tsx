"use client";

const ACTIONS = [
  {
    label: "They refused a reasonable adjustment",
    message:
      "A reasonable adjustment I asked for was refused. Help me ask, calmly, whether a named person reviewed my specific circumstances. Email only if I need it. Not legal advice.",
  },
  {
    label: "I need to write to them",
    message:
      "Help me draft a calm letter that asks whether a named human reviewed the specific facts of my situation. Not legal advice.",
  },
] as const;

export const Greeting = ({
  onQuickAction,
}: {
  onQuickAction?: (text: string) => void;
}) => {
  return (
    <div
      className="flex w-full max-w-lg flex-col items-center gap-4 px-3 pt-6 pb-2 md:pt-10"
      key="overview"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <p
          className="text-[11px] tracking-[0.28em] uppercase text-[#5eead4]"
          style={{
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
          }}
        >
          Iris
        </p>
        <h1
          className="max-w-sm text-[22px] font-medium leading-snug text-[#f4f4f5]"
          style={{
            fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
          }}
        >
          Tell me what happened.
        </h1>
        <p
          className="max-w-sm text-[14px] leading-relaxed text-[#a1a1aa]"
          style={{
            fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
          }}
        >
          I will work out what to ask. You do not need to pick a model or open
          a tool first.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {ACTIONS.map((action) => (
          <button
            aria-label={action.label}
            className="w-full rounded-xl border px-4 py-3 text-left text-[14px] text-[#d4d4d8] transition-colors hover:border-[rgba(15,118,110,0.45)] hover:text-[#f4f4f5]"
            key={action.label}
            onClick={() => onQuickAction?.(action.message)}
            style={{
              fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
              borderColor: "#27272a",
              background: "var(--surface-2)",
            }}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};
