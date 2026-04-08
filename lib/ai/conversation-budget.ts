/**
 * Conversation budget tracking and enforcement.
 *
 * Tracks cumulative turn count and token usage per chat session to
 * prevent cost overruns.  Aligns with the Burgess Principle's focus on
 * responsible automation by placing hard limits on automated output
 * volume before requiring human intervention.
 */

export type ConversationBudget = {
  /** Maximum number of assistant turns allowed. */
  maxTurns: number;
  /** Maximum cumulative token count allowed. */
  maxTokens: number;
};

export type BudgetUsage = {
  /** Number of assistant turns consumed so far. */
  turnCount: number;
  /** Cumulative token count consumed so far. */
  tokenCount: number;
};

export type BudgetCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "turn_limit_exceeded" | "token_limit_exceeded" };

/**
 * Check whether the current usage is within budget.
 */
export function checkBudget(
  budget: ConversationBudget,
  usage: BudgetUsage,
): BudgetCheckResult {
  if (usage.turnCount >= budget.maxTurns) {
    return { allowed: false, reason: "turn_limit_exceeded" };
  }

  if (usage.tokenCount >= budget.maxTokens) {
    return { allowed: false, reason: "token_limit_exceeded" };
  }

  return { allowed: true };
}

/**
 * Count assistant turns from a list of DB messages.
 * Each message with role "assistant" counts as one turn.
 */
export function countAssistantTurns(
  messages: { role: string }[],
): number {
  return messages.filter((m) => m.role === "assistant").length;
}
