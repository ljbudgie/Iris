/**
 * Response Quality Loop — silently evaluates every AI response before
 * the user sees it.
 *
 * After every response, Iris checks:
 *   - Did the response actually answer the question?
 *   - Was it the right length?
 *   - Did it match the detected template?
 *   - Was the model appropriate for this query?
 *
 * If evaluation fails, Iris can automatically regenerate with a
 * different model. The user never sees the failed attempt.
 */

import type { IntentCategory } from "./smart-router";
import type { ResponseTemplate } from "./templates";

// ---- Types ----

export type QualityCheck = {
  passed: boolean;
  issues: QualityIssue[];
  score: number;
  suggestedModelId?: string;
};

export type QualityIssue =
  | "too_short"
  | "too_long"
  | "filler_opening"
  | "template_mismatch"
  | "no_answer"
  | "wrong_model";

// ---- Evaluation ----

/**
 * Evaluate a response for quality. Returns a quality check result.
 *
 * @param response - The model's response text
 * @param userMessage - The original user message
 * @param intent - The detected intent category
 * @param template - The detected response template
 * @param modelId - The model that generated the response
 */
export function evaluateResponse({
  response,
  userMessage,
  intent,
  template,
  modelId,
}: {
  response: string;
  userMessage: string;
  intent: IntentCategory;
  template: ResponseTemplate;
  modelId: string;
}): QualityCheck {
  const issues: QualityIssue[] = [];
  let score = 10; // Start at perfect

  const text = response.trim();
  const wordCount = text.split(/\s+/).length;
  const userWordCount = userMessage.split(/\s+/).length;

  // ---- Length check ----
  if (template === "quick" && wordCount > 50) {
    issues.push("too_long");
    score -= 2;
  }

  if (template !== "quick" && wordCount < 5) {
    issues.push("too_short");
    score -= 3;
  }

  // For substantive queries, very short responses are suspicious
  if (userWordCount > 20 && wordCount < 15) {
    issues.push("too_short");
    score -= 2;
  }

  // ---- Filler opening check ----
  const fillerPatterns = [
    /^great question/i,
    /^that's a really interesting/i,
    /^that's an excellent/i,
    /^what a great/i,
    /^i'd be happy to help/i,
    /^absolutely!/i,
    /^of course!/i,
  ];

  for (const pattern of fillerPatterns) {
    if (pattern.test(text)) {
      issues.push("filler_opening");
      score -= 2;
      break;
    }
  }

  // ---- Template mismatch check ----
  if (template === "code" && !text.includes("```") && wordCount > 30) {
    // Code template expected but no code blocks
    const hasInlineCode = /`[^`]+`/.test(text);
    if (!hasInlineCode) {
      issues.push("template_mismatch");
      score -= 1;
    }
  }

  if (template === "legal" && wordCount < 50) {
    // Legal letters should be substantive
    issues.push("template_mismatch");
    score -= 2;
  }

  if (template === "emotional" && /^[-*•]\s/m.test(text)) {
    // Emotional support shouldn't use bullet points
    issues.push("template_mismatch");
    score -= 1;
  }

  // ---- Empty or non-answer check ----
  if (wordCount < 3) {
    issues.push("no_answer");
    score -= 5;
  }

  // ---- Model appropriateness ----
  if (intent === "code" && !modelId.includes("codestral") && !modelId.includes("deepseek")) {
    // Code intent but non-code model was used
    issues.push("wrong_model");
    score -= 1;
  }

  const passed = score >= 6 && !issues.includes("no_answer");

  // Suggest a fallback model if quality is low
  let suggestedModelId: string | undefined;
  if (!passed) {
    suggestedModelId = getFallbackModel(modelId, intent);
  }

  return {
    passed,
    issues,
    score: Math.max(0, score),
    suggestedModelId,
  };
}

/**
 * Get a fallback model different from the current one.
 */
function getFallbackModel(
  currentModelId: string,
  intent: IntentCategory
): string {
  const fallbackMap: Record<IntentCategory, string[]> = {
    code: ["mistral/codestral", "deepseek/deepseek-v3.2"],
    creative: ["moonshotai/kimi-k2-0905", "moonshotai/kimi-k2.5"],
    fast: ["mistral/mistral-small", "xai/grok-4.1-fast-non-reasoning"],
    realtime: ["xai/grok-4.1-fast-non-reasoning", "moonshotai/kimi-k2-0905"],
    reasoning: [
      "openai/gpt-oss-120b",
      "moonshotai/kimi-k2.5",
      "deepseek/deepseek-v3.2",
    ],
    math: ["deepseek/deepseek-v3.2", "openai/gpt-oss-120b"],
    general: ["moonshotai/kimi-k2-0905", "moonshotai/kimi-k2.5"],
  };

  const candidates = fallbackMap[intent] ?? fallbackMap.general;
  return (
    candidates.find((id) => id !== currentModelId) ??
    "moonshotai/kimi-k2-0905"
  );
}
