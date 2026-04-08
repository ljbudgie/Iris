"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangleIcon,
  FileTextIcon,
  GavelIcon,
  HeartIcon,
  MicIcon,
  ShieldIcon,
  XIcon,
} from "lucide-react";
import { memo, useState } from "react";
import type { ChatMessage } from "@/lib/types";

type IntakeCategory = {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  prompt: string;
};

const intakeCategories: IntakeCategory[] = [
  {
    id: "benefits",
    icon: <HeartIcon className="size-4" />,
    label: "Benefits dispute",
    description: "PIP, Universal Credit, ESA, or Council Tax Reduction",
    prompt:
      "I'm having a problem with my benefits and need a human to review my case. Can you help me put together a Burgess Principle letter?",
  },
  {
    id: "bailiffs",
    icon: <AlertTriangleIcon className="size-4" />,
    label: "Bailiff or enforcement",
    description: "Threats, visits, or forced entry attempts",
    prompt:
      "Bailiffs have contacted me and I'm not sure my case was properly reviewed. Walk me through my rights and help me respond.",
  },
  {
    id: "automated",
    icon: <ShieldIcon className="size-4" />,
    label: "Automated decision",
    description: "A system made a decision without human review",
    prompt:
      "A decision was made about me by an automated system with no human involvement. I'd like to challenge this under Article 22 and the Burgess Principle.",
  },
  {
    id: "council",
    icon: <GavelIcon className="size-4" />,
    label: "Council tax or fines",
    description: "Parking fines, council demands, or local authority issues",
    prompt:
      "I've received a council tax demand or fine that seems wrong. Help me understand how to challenge it.",
  },
  {
    id: "data",
    icon: <FileTextIcon className="size-4" />,
    label: "Access my data",
    description: "Subject Access Request or Freedom of Information",
    prompt:
      "I'd like to find out what data an organisation holds about me. Can you guide me through a Subject Access Request or FOI?",
  },
  {
    id: "other",
    icon: <MicIcon className="size-4" />,
    label: "Something else",
    description: "Any institutional unfairness or dispute",
    prompt:
      "I feel an organisation hasn't treated me fairly but I'm not sure where to start. What are my options?",
  },
];

type GuidedIntakeProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  onDismiss?: () => void;
};

function PureGuidedIntake({
  chatId,
  sendMessage,
  onDismiss,
}: GuidedIntakeProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-2xl flex-col gap-3 px-2"
        exit={{ opacity: 0, y: -8 }}
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <motion.div
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="text-sm font-medium text-foreground">
              I need help with...
            </span>
          </motion.div>
          <motion.button
            animate={{ opacity: 1 }}
            className="rounded-lg p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
            initial={{ opacity: 0 }}
            onClick={() => {
              setIsVisible(false);
              onDismiss?.();
            }}
            transition={{ delay: 0.1, duration: 0.4 }}
            type="button"
          >
            <XIcon className="size-3.5" />
          </motion.button>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {intakeCategories.map((category, index) => (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3 text-left backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card/70 hover:shadow-[var(--shadow-card)]"
              initial={{ opacity: 0, y: 8 }}
              key={category.id}
              onClick={() => {
                window.history.pushState(
                  {},
                  "",
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
                );
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: category.prompt }],
                });
                setIsVisible(false);
              }}
              transition={{
                delay: 0.06 * index,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              type="button"
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/15">
                {category.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-foreground">
                  {category.label}
                </div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/60">
                  {category.description}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const GuidedIntake = memo(PureGuidedIntake);
