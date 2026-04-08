import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { checkBotId } from "botid/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth, type UserType } from "@/app/(auth)/auth";
import {
  type ConversationBudget,
  checkBudget,
  countAssistantTurns,
} from "@/lib/ai/conversation-budget";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import {
  allowedModelIds,
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
// Skill registry: built-in skills are registered as a side-effect import.
// This replaces the individual tool imports with a single registry lookup.
import "@/lib/ai/skills/built-in";
import { skillRegistry } from "@/lib/ai/skills";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getChatTokenUsage,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveChatAuditEntry,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { IrisError } from "@/lib/errors";
import type { GovernanceStatus } from "@/lib/federation";
import { getPermittedTools, type ToolName } from "@/lib/federation";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new IrisError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const [, session] = await Promise.all([
      checkBotId().catch(() => null),
      auth(),
    ]);

    if (!session?.user) {
      return new IrisError("unauthorized:chat").toResponse();
    }

    const chatModel = allowedModelIds.has(selectedChatModel)
      ? selectedChatModel
      : DEFAULT_CHAT_MODEL;

    await checkIpRateLimit(ipAddress(request));

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 1,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerHour) {
      return new IrisError("rate_limit:chat").toResponse();
    }

    // -----------------------------------------------------------------------
    // Conversation budget: enforce turn & token limits per chat session
    // -----------------------------------------------------------------------
    const budget: ConversationBudget = {
      maxTurns: entitlementsByUserType[userType].maxTurnsPerChat,
      maxTokens: entitlementsByUserType[userType].maxTokensPerChat,
    };

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new IrisError("forbidden:chat").toResponse();
      }
      messagesFromDb = await getMessagesByChatId({ id });

      // Budget enforcement: check turn count and token usage
      const turnCount = countAssistantTurns(messagesFromDb);
      const tokenCount = await getChatTokenUsage({ chatId: id });
      const budgetCheck = checkBudget(budget, { turnCount, tokenCount });

      if (!budgetCheck.allowed) {
        return new IrisError("rate_limit:chat").toResponse();
      }
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const modelConfig = chatModels.find((m) => m.id === chatModel);
    const modelCapabilities = await getCapabilities();
    const capabilities = modelCapabilities[chatModel];
    const isReasoningModel = capabilities?.reasoning === true;
    const supportsTools = capabilities?.tools === true;

    // -----------------------------------------------------------------------
    // Tool permission gating: filter tools by governance status
    // -----------------------------------------------------------------------
    // ⚠️  FEDERATION ACTIVATION POINT — this is the single most important
    // governance decision in Iris.
    //
    // Right now this defaults to `undefined` (treated as SOVEREIGN) because
    // the user is speaking *directly* to Iris — no federation provider is
    // involved.  Every direct user is sovereign over their own conversation.
    //
    // When federation providers are integrated, this value MUST come from
    // the provider handshake (e.g. the verified registration's governance
    // status).  A federated provider whose output has NOT been human-reviewed
    // must be assigned "NULL", which excludes sensitive tools like
    // `generateBurgessLetter` and flags the response for human review.
    //
    // Do NOT weaken this gate.  The SOVEREIGN/NULL binary is the
    // architectural core of the Burgess Principle at runtime.
    const governanceStatus: GovernanceStatus | undefined = undefined;
    const permittedTools: ToolName[] = getPermittedTools(governanceStatus);

    const activeTools: ToolName[] =
      isReasoningModel && !supportsTools ? [] : permittedTools;

    const modelMessages = await convertToModelMessages(uiMessages);

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        // Build the tools object from the skill registry, passing runtime
        // context for factory-style skills and filtering by governance.
        const skillContext = { session, dataStream, modelId: chatModel };
        const registryTools = skillRegistry.buildTools(
          skillContext,
          governanceStatus
        );

        const result = streamText({
          model: getLanguageModel(chatModel),
          system: systemPrompt({ requestHints, supportsTools }),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools: activeTools,
          providerOptions: {
            ...(modelConfig?.gatewayOrder && {
              gateway: { order: modelConfig.gatewayOrder },
            }),
            ...(modelConfig?.reasoningEffort && {
              openai: { reasoningEffort: modelConfig.reasoningEffort },
            }),
          },
          tools: registryTools,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(
          result.toUIMessageStream({ sendReasoning: isReasoningModel })
        );

        // Collect token usage and tool invocations for audit trail
        const usage = await result.usage;
        const toolCalls = await result.toolCalls;

        const toolsInvoked = toolCalls.map(
          (tc: { toolName: string }) => tc.toolName
        );

        // Audit trail: persist turn metadata (non-blocking, with retry)
        const auditEntry = {
          chatId: id,
          userId: session.user?.id ?? "",
          modelId: chatModel,
          promptTokens: usage?.inputTokens ?? 0,
          completionTokens: usage?.outputTokens ?? 0,
          totalTokens: usage?.totalTokens ?? 0,
          toolsInvoked,
          governanceStatus: (governanceStatus ?? "SOVEREIGN") as
            | "SOVEREIGN"
            | "NULL",
        };

        saveChatAuditEntry(auditEntry).catch((firstError) => {
          console.error(
            "[Iris] Audit trail write failed — retrying once:",
            firstError
          );
          saveChatAuditEntry(auditEntry).catch((retryError) => {
            console.error(
              "[Iris] Audit trail write failed after retry — budget tracking may be affected:",
              retryError
            );
          });
        });

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: (error) => {
        if (
          error instanceof Error &&
          error.message?.includes(
            "AI Gateway requires a valid credit card on file to service requests"
          )
        ) {
          return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";
        }
        return "Oops, an error occurred!";
      },
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          /* non-critical */
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof IrisError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new IrisError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new IrisError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new IrisError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new IrisError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
