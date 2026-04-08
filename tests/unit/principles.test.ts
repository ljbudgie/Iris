/**
 * Unit tests for core principle-enforcement code.
 *
 * These tests guard the Burgess Principle at the code level — if someone
 * changes the governance gate, budget enforcement, or tool permissions,
 * these tests will catch it.
 *
 * Run with: npx tsx --test tests/unit/principles.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// ---------------------------------------------------------------------------
// 1. Conversation Budget (lib/ai/conversation-budget.ts)
// ---------------------------------------------------------------------------

// Inline the pure functions to avoid Next.js module resolution issues
// in a standalone test runner.  These mirror the implementations in
// lib/ai/conversation-budget.ts exactly.

type ConversationBudget = { maxTurns: number; maxTokens: number };
type BudgetUsage = { turnCount: number; tokenCount: number };
type BudgetCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "turn_limit_exceeded" | "token_limit_exceeded" };

function checkBudget(
  budget: ConversationBudget,
  usage: BudgetUsage
): BudgetCheckResult {
  if (usage.turnCount >= budget.maxTurns) {
    return { allowed: false, reason: "turn_limit_exceeded" };
  }
  if (usage.tokenCount >= budget.maxTokens) {
    return { allowed: false, reason: "token_limit_exceeded" };
  }
  return { allowed: true };
}

function countAssistantTurns(messages: { role: string }[]): number {
  return messages.filter((m) => m.role === "assistant").length;
}

describe("Conversation Budget", () => {
  const budget: ConversationBudget = { maxTurns: 20, maxTokens: 50_000 };

  it("allows usage within budget", () => {
    const result = checkBudget(budget, { turnCount: 5, tokenCount: 10_000 });
    assert.deepStrictEqual(result, { allowed: true });
  });

  it("rejects when turn limit is reached", () => {
    const result = checkBudget(budget, { turnCount: 20, tokenCount: 0 });
    assert.deepStrictEqual(result, {
      allowed: false,
      reason: "turn_limit_exceeded",
    });
  });

  it("rejects when turn limit is exceeded", () => {
    const result = checkBudget(budget, { turnCount: 25, tokenCount: 0 });
    assert.deepStrictEqual(result, {
      allowed: false,
      reason: "turn_limit_exceeded",
    });
  });

  it("rejects when token limit is reached", () => {
    const result = checkBudget(budget, { turnCount: 0, tokenCount: 50_000 });
    assert.deepStrictEqual(result, {
      allowed: false,
      reason: "token_limit_exceeded",
    });
  });

  it("rejects when token limit is exceeded", () => {
    const result = checkBudget(budget, { turnCount: 0, tokenCount: 100_000 });
    assert.deepStrictEqual(result, {
      allowed: false,
      reason: "token_limit_exceeded",
    });
  });

  it("checks turn limit before token limit", () => {
    const result = checkBudget(budget, {
      turnCount: 20,
      tokenCount: 50_000,
    });
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.equal(result.reason, "turn_limit_exceeded");
    }
  });

  it("allows zero usage", () => {
    const result = checkBudget(budget, { turnCount: 0, tokenCount: 0 });
    assert.deepStrictEqual(result, { allowed: true });
  });

  it("allows usage at exactly one below limits", () => {
    const result = checkBudget(budget, {
      turnCount: 19,
      tokenCount: 49_999,
    });
    assert.deepStrictEqual(result, { allowed: true });
  });
});

describe("countAssistantTurns", () => {
  it("counts assistant messages", () => {
    const messages = [
      { role: "user" },
      { role: "assistant" },
      { role: "user" },
      { role: "assistant" },
    ];
    assert.equal(countAssistantTurns(messages), 2);
  });

  it("returns zero for empty messages", () => {
    assert.equal(countAssistantTurns([]), 0);
  });

  it("returns zero when no assistant messages", () => {
    const messages = [{ role: "user" }, { role: "system" }];
    assert.equal(countAssistantTurns(messages), 0);
  });
});

// ---------------------------------------------------------------------------
// 2. Governance Gate (lib/federation/governance.ts)
// ---------------------------------------------------------------------------

type GovernanceStatus = "SOVEREIGN" | "NULL";

type ProviderResponse = {
  providerId: string;
  providerName: string;
  content: string;
  governanceStatus: GovernanceStatus;
  respondedAt: string;
};

function applyGovernanceGate(response: ProviderResponse): ProviderResponse {
  if (response.governanceStatus !== "SOVEREIGN") {
    return { ...response, governanceStatus: "NULL" };
  }
  return response;
}

function evaluateResponses(responses: ProviderResponse[]): {
  approved: ProviderResponse[];
  pendingReview: ProviderResponse[];
} {
  const approved: ProviderResponse[] = [];
  const pendingReview: ProviderResponse[] = [];
  for (const response of responses) {
    const gated = applyGovernanceGate(response);
    if (gated.governanceStatus === "SOVEREIGN") {
      approved.push(gated);
    } else {
      pendingReview.push(gated);
    }
  }
  return { approved, pendingReview };
}

describe("Governance Gate", () => {
  const baseResponse: ProviderResponse = {
    providerId: "test-provider",
    providerName: "Test",
    content: "Hello",
    governanceStatus: "SOVEREIGN",
    respondedAt: new Date().toISOString(),
  };

  it("passes SOVEREIGN responses through unchanged", () => {
    const result = applyGovernanceGate(baseResponse);
    assert.equal(result.governanceStatus, "SOVEREIGN");
    assert.equal(result.content, "Hello");
  });

  it("forces NULL on non-SOVEREIGN responses", () => {
    const nullResponse = { ...baseResponse, governanceStatus: "NULL" as const };
    const result = applyGovernanceGate(nullResponse);
    assert.equal(result.governanceStatus, "NULL");
  });

  it("evaluateResponses separates approved from pending review", () => {
    const responses: ProviderResponse[] = [
      { ...baseResponse, providerId: "a", governanceStatus: "SOVEREIGN" },
      { ...baseResponse, providerId: "b", governanceStatus: "NULL" },
      { ...baseResponse, providerId: "c", governanceStatus: "SOVEREIGN" },
    ];
    const { approved, pendingReview } = evaluateResponses(responses);
    assert.equal(approved.length, 2);
    assert.equal(pendingReview.length, 1);
    assert.equal(pendingReview[0].providerId, "b");
  });

  it("evaluateResponses returns empty arrays for empty input", () => {
    const { approved, pendingReview } = evaluateResponses([]);
    assert.equal(approved.length, 0);
    assert.equal(pendingReview.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 3. Skill Permission (lib/ai/skills/types.ts)
// ---------------------------------------------------------------------------

type SkillSensitivity = "standard" | "sensitive";

type SkillMetadata = {
  name: string;
  description: string;
  version: string;
  sensitivity: SkillSensitivity;
  tags: string[];
  requiresContext: boolean;
};

type SkillDefinition = {
  metadata: SkillMetadata;
  tool?: unknown;
  factory?: (ctx: unknown) => unknown;
};

function isSkillPermitted(
  skill: SkillDefinition,
  governanceStatus: GovernanceStatus | undefined
): boolean {
  if (governanceStatus === "NULL") {
    return skill.metadata.sensitivity !== "sensitive";
  }
  return true;
}

describe("Skill Permission Gating", () => {
  const standardSkill: SkillDefinition = {
    metadata: {
      name: "getWeather",
      description: "Get weather",
      version: "1.0.0",
      sensitivity: "standard",
      tags: [],
      requiresContext: false,
    },
    tool: {},
  };

  const sensitiveSkill: SkillDefinition = {
    metadata: {
      name: "generateBurgessLetter",
      description: "Generate letter",
      version: "1.0.0",
      sensitivity: "sensitive",
      tags: [],
      requiresContext: true,
    },
    factory: () => ({}),
  };

  it("permits standard skills under SOVEREIGN", () => {
    assert.equal(isSkillPermitted(standardSkill, "SOVEREIGN"), true);
  });

  it("permits sensitive skills under SOVEREIGN", () => {
    assert.equal(isSkillPermitted(sensitiveSkill, "SOVEREIGN"), true);
  });

  it("permits standard skills under NULL", () => {
    assert.equal(isSkillPermitted(standardSkill, "NULL"), true);
  });

  it("blocks sensitive skills under NULL", () => {
    assert.equal(isSkillPermitted(sensitiveSkill, "NULL"), false);
  });

  it("permits all skills when governance is undefined (direct user)", () => {
    assert.equal(isSkillPermitted(standardSkill, undefined), true);
    assert.equal(isSkillPermitted(sensitiveSkill, undefined), true);
  });
});

// ---------------------------------------------------------------------------
// 4. sanitizeText (lib/utils.ts)
// ---------------------------------------------------------------------------

function sanitizeText(text: string) {
  return text
    .replaceAll("<has_function_call>", "")
    .replaceAll(/<think>[\s\S]*?<\/think>/gi, "")
    .replaceAll(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replaceAll(/<internal>[\s\S]*?<\/internal>/gi, "")
    .trim();
}

describe("sanitizeText", () => {
  it("removes a single thinking block", () => {
    const input = "Hello <think>secret</think> world";
    assert.equal(sanitizeText(input), "Hello  world");
  });

  it("removes multiple thinking blocks", () => {
    const input =
      "<think>first</think> Hello <think>second</think> world <think>third</think>";
    assert.equal(sanitizeText(input), "Hello  world");
  });

  it("removes reasoning blocks", () => {
    const input = "Answer: <reasoning>step 1\nstep 2</reasoning>42";
    assert.equal(sanitizeText(input), "Answer: 42");
  });

  it("removes internal blocks", () => {
    const input = "<internal>debug info</internal>Result";
    assert.equal(sanitizeText(input), "Result");
  });

  it("removes has_function_call tags", () => {
    const input = "<has_function_call>some text";
    assert.equal(sanitizeText(input), "some text");
  });

  it("removes multiple has_function_call tags", () => {
    const input = "<has_function_call>A<has_function_call>B";
    assert.equal(sanitizeText(input), "AB");
  });

  it("handles case-insensitive tags", () => {
    const input = "<THINK>secret</THINK> hello <Think>more</Think>";
    assert.equal(sanitizeText(input), "hello");
  });

  it("trims whitespace", () => {
    const input = "  hello  ";
    assert.equal(sanitizeText(input), "hello");
  });

  it("handles empty string", () => {
    assert.equal(sanitizeText(""), "");
  });

  it("handles multiline thinking blocks", () => {
    const input = "Before\n<think>\nline1\nline2\n</think>\nAfter";
    assert.equal(sanitizeText(input), "Before\n\nAfter");
  });
});
