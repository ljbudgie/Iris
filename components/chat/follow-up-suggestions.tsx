"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "../ai-elements/suggestion";

type FollowUpSuggestionsProps = {
  suggestions: string[];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
};

function PureFollowUpSuggestions({
  suggestions,
  sendMessage,
}: FollowUpSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2 pl-10"
        data-testid="follow-up-suggestions"
        exit={{ opacity: 0, y: 8 }}
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {suggestions.map((suggestion, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 8 }}
            key={suggestion}
            transition={{
              delay: 0.06 * index,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Suggestion
              className="h-auto rounded-xl border border-border/30 px-3.5 py-2 text-left text-[12px] leading-relaxed text-muted-foreground/70 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:text-foreground hover:shadow-[var(--shadow-card)]"
              onClick={(text) => {
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text }],
                });
              }}
              suggestion={suggestion}
            >
              {suggestion}
            </Suggestion>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export const FollowUpSuggestions = memo(PureFollowUpSuggestions);
