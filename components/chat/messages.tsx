import type { UseChatHelpers } from "@ai-sdk/react";
import { ArrowDownIcon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { FollowUpSuggestions } from "./follow-up-suggestions";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  isLoading?: boolean;
  onEditMessage?: (message: ChatMessage) => void;
};

function PureMessages({
  addToolApprovalResponse,
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  sendMessage,
  isReadonly,
  isArtifactVisible,
  isLoading,
  onEditMessage,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
    reset,
  } = useMessages({
    status,
  });

  useDataStream();

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      reset();
    }
  }, [chatId, reset]);

  const followUpSuggestions = useMemo(() => {
    if (status === "streaming" || status === "submitted" || isReadonly) {
      return [];
    }

    const lastMessage = messages.at(-1);
    if (lastMessage?.role !== "assistant") {
      return [];
    }

    return lastMessage.parts
      .filter(
        (part) =>
          part.type === "tool-suggestFollowUps" &&
          part.state === "output-available"
      )
      .flatMap((part) => part.output?.suggestions ?? []);
  }, [messages, status, isReadonly]);

  return (
    <div className="relative flex-1" style={{ background: "var(--surface-1)" }}>
      {messages.length === 0 && !isLoading && (
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center">
          <Greeting
            onQuickAction={(text) => {
              sendMessage({
                role: "user" as const,
                parts: [{ type: "text" as const, text }],
              });
            }}
          />
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 touch-pan-y overflow-y-auto",
          messages.length > 0 ? "" : "bg-transparent"
        )}
        ref={messagesContainerRef}
        style={isArtifactVisible ? { scrollbarWidth: "none" } : undefined}
      >
        <div className="mx-auto flex min-h-full min-w-0 max-w-4xl flex-col gap-5 px-2 py-6 md:gap-7 md:px-4">
          {messages.map((message, index) => (
            <PreviewMessage
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isLoading={
                status === "streaming" && messages.length - 1 === index
              }
              isReadonly={isReadonly}
              key={message.id}
              message={message}
              onEdit={onEditMessage}
              regenerate={regenerate}
              requiresScrollPadding={
                hasSentMessage && index === messages.length - 1
              }
              setMessages={setMessages}
              vote={
                votes
                  ? votes.find((vote) => vote.messageId === message.id)
                  : undefined
              }
            />
          ))}

          {followUpSuggestions.length > 0 && (
            <FollowUpSuggestions
              sendMessage={sendMessage}
              suggestions={followUpSuggestions}
            />
          )}

          {status === "submitted" && messages.at(-1)?.role !== "assistant" && (
            <ThinkingMessage />
          )}

          <div
            className="min-h-[24px] min-w-[24px] shrink-0"
            ref={messagesEndRef}
          />
        </div>
      </div>

      <button
        aria-label="Scroll to bottom"
        className={`absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full border px-3.5 backdrop-blur-md transition-all duration-200 h-7 text-[10px] ${
          isAtBottom
            ? "pointer-events-none scale-90 opacity-0"
            : "pointer-events-auto scale-100 opacity-100"
        }`}
        onClick={() => scrollToBottom("smooth")}
        style={{ background: "#16161e", borderColor: "#27272a" }}
        type="button"
      >
        <ArrowDownIcon className="size-3 text-[#a1a1aa]" />
      </button>
    </div>
  );
}

export const Messages = PureMessages;
