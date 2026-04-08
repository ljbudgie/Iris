"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";
import { suggestions } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "../ai-elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = suggestions;

  const handleSkip = useCallback(() => {
    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );
    sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: "Hi \u2014 I already know the Burgess Principle. Let\u2019s get started.",
        },
      ],
    });
  }, [chatId, sendMessage]);

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className="flex w-full gap-2.5 overflow-x-auto pb-1 no-scrollbar"
        data-testid="suggested-actions"
      >
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0"
            exit={{ opacity: 0, y: 16 }}
            initial={{ opacity: 0, y: 16 }}
            key={suggestedAction}
            transition={{
              delay: 0.06 * index,
              duration: 0.4,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <Suggestion
              className="h-auto whitespace-nowrap rounded-full border px-4 py-2 text-left text-[13px] leading-relaxed transition-all duration-200 hover:border-[rgba(124,58,237,0.4)]"
              onClick={(suggestion) => {
                window.history.pushState(
                  {},
                  "",
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
                );
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: suggestion }],
                });
              }}
              style={{
                borderColor: "#27272a",
                background: "transparent",
                color: "#9ca3af",
              }}
              suggestion={suggestedAction}
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
      </div>
      <motion.div
        animate={{ opacity: 1 }}
        className="flex justify-center"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <button
          className="text-[12px] text-[#52525b] transition-colors hover:text-[#a1a1aa]"
          onClick={handleSkip}
          type="button"
        >
          I already know the principle — just chat
        </button>
      </motion.div>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
