/**
 * Memory integration — connects MemPalace to the conversation flow.
 *
 * Before each response: queries memory for relevant user context.
 * After each conversation: extracts key facts and stores them.
 *
 * Memory is local and lossless. Nothing leaves the user's instance.
 */

import { getMemPalaceClient } from "@/lib/mempalace/client";

/**
 * Query MemPalace for relevant context about the current message.
 * Returns a formatted string to inject into the system prompt,
 * or undefined if no relevant memories are found.
 */
export async function queryMemoryContext(
  userMessage: string
): Promise<string | undefined> {
  const client = getMemPalaceClient();
  if (!client) {
    return undefined;
  }

  try {
    if (!client.isConnected()) {
      await client.connect();
    }

    const results = (await client.search({
      query: userMessage,
      limit: 3,
    })) as MemorySearchResult;

    if (
      !results ||
      !Array.isArray(results.results) ||
      results.results.length === 0
    ) {
      return undefined;
    }

    // Filter by minimum relevance
    const relevant = results.results.filter(
      (r: MemoryResult) => (r.similarity ?? r.score ?? 0) >= 0.6
    );

    if (relevant.length === 0) {
      return undefined;
    }

    const contextLines = relevant.map((r: MemoryResult) => {
      const source = [r.wing, r.room].filter(Boolean).join("/");
      return `- [${source}] ${r.content ?? r.text ?? ""}`;
    });

    return `Relevant memories from previous conversations:\n${contextLines.join("\n")}`;
  } catch (error) {
    console.error("[Iris] Memory query failed:", error);
    return undefined;
  }
}

/**
 * Extract key facts from a conversation turn and store them in MemPalace.
 * Called after each assistant response (non-blocking).
 */
export async function extractAndStoreMemory(
  userMessage: string,
  assistantResponse: string,
  userId: string
): Promise<void> {
  const client = getMemPalaceClient();
  if (!client) {
    return;
  }

  try {
    if (!client.isConnected()) {
      await client.connect();
    }

    // Only store if the conversation contains meaningful content
    if (userMessage.length < 20 || assistantResponse.length < 50) {
      return;
    }

    // Extract a concise fact from the exchange
    const fact = buildMemoryFact(userMessage, assistantResponse);
    if (!fact) {
      return;
    }

    await client.addDrawer({
      wing: `wing_user_${userId.slice(0, 8)}`,
      room: "conversations",
      content: fact,
      added_by: "iris",
    });
  } catch (error) {
    console.error("[Iris] Memory store failed:", error);
    // Non-critical — don't throw
  }
}

/**
 * Build a concise memory fact from a conversation exchange.
 * Returns null if the exchange isn't worth storing.
 */
function buildMemoryFact(
  userMessage: string,
  assistantResponse: string
): string | null {
  // Skip very generic exchanges
  const genericPatterns = [
    /^(hi|hello|hey|thanks|thank you|ok|okay|bye|goodbye)/i,
    /^(what can you do|how are you|tell me about yourself)/i,
  ];

  for (const pattern of genericPatterns) {
    if (pattern.test(userMessage.trim())) {
      return null;
    }
  }

  // Truncate to reasonable size for storage
  const truncatedUser =
    userMessage.length > 200 ? `${userMessage.slice(0, 200)}...` : userMessage;
  const truncatedAssistant =
    assistantResponse.length > 300
      ? `${assistantResponse.slice(0, 300)}...`
      : assistantResponse;

  return `User asked: ${truncatedUser}\nIris responded: ${truncatedAssistant}\nTimestamp: ${new Date().toISOString()}`;
}

// ---- Types for MemPalace search results ----

type MemoryResult = {
  content?: string;
  text?: string;
  wing?: string;
  room?: string;
  similarity?: number;
  score?: number;
};

type MemorySearchResult = {
  results: MemoryResult[];
};
