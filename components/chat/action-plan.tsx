"use client";

import type { UIMessage } from "ai";
import { motion } from "framer-motion";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { memo, useMemo } from "react";

type ActionStep = {
  id: string;
  label: string;
  completed: boolean;
};

function detectBurgessProgress(messages: UIMessage[]): ActionStep[] | null {
  const allText = messages
    .map((m) =>
      m.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text)
        .join(" ")
    )
    .join(" ")
    .toLowerCase();

  const hasToolCalls = messages.some((m) =>
    m.parts?.some((p) => p.type === "tool-generateBurgessLetter")
  );

  // Only show the plan if user is in a Burgess-related conversation
  const burgessKeywords = [
    "burgess",
    "letter",
    "dispute",
    "unfair",
    "bailiff",
    "enforcement",
    "benefits",
    "pip",
    "universal credit",
    "council tax",
    "automated decision",
    "human review",
    "dsar",
    "subject access",
    "freedom of information",
    "equality act",
  ];

  const isBurgessConversation =
    hasToolCalls || burgessKeywords.some((kw) => allText.includes(kw));

  if (!isBurgessConversation) {
    return null;
  }

  // Step 1: Described situation (user sent at least one message)
  const userMessages = messages.filter((m) => m.role === "user");
  const describedSituation = userMessages.length > 0;

  // Step 2: Letter generated (generateBurgessLetter tool was called)
  const letterGenerated = hasToolCalls;

  // Step 3: Letter reviewed (user sent a message after the letter was generated)
  const letterToolIndex = messages.findIndex((m) =>
    m.parts?.some((p) => p.type === "tool-generateBurgessLetter")
  );
  const letterReviewed =
    letterGenerated &&
    userMessages.some((m) => messages.indexOf(m) > letterToolIndex);

  // Step 4: Ready to send (user has reviewed and the conversation has progressed)
  const readyToSend =
    letterReviewed &&
    userMessages.filter((m) => messages.indexOf(m) > letterToolIndex).length >=
      2;

  return [
    {
      id: "describe",
      label: "Describe your situation",
      completed: describedSituation,
    },
    {
      id: "generate",
      label: "Generate your letter",
      completed: letterGenerated,
    },
    {
      id: "review",
      label: "Review and personalise",
      completed: letterReviewed,
    },
    { id: "send", label: "Ready to send", completed: readyToSend },
  ];
}

type ActionPlanProps = {
  messages: UIMessage[];
};

function PureActionPlan({ messages }: ActionPlanProps) {
  const steps = useMemo(() => detectBurgessProgress(messages), [messages]);

  if (!steps) {
    return null;
  }

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-2"
      initial={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold tracking-wide text-primary/80">
          Your Action Plan
        </span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {completedCount}/{totalSteps}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {steps.map((step, index) => (
          <div className="flex items-center gap-1" key={step.id}>
            {index > 0 && (
              <div
                className={`h-px w-3 transition-colors ${
                  step.completed ? "bg-primary/40" : "bg-border/40"
                }`}
              />
            )}
            <div className="group relative flex items-center">
              {step.completed ? (
                <CheckCircle2Icon className="size-3.5 text-primary" />
              ) : (
                <CircleIcon className="size-3.5 text-muted-foreground/30" />
              )}
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] text-popover-foreground opacity-0 shadow-md ring-1 ring-border/20 transition-opacity group-hover:opacity-100">
                {step.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export const ActionPlan = memo(PureActionPlan);
