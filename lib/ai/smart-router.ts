/**
 * Smart Router — analyses user messages and selects the optimal model.
 *
 * The router examines intent signals in the user's message (code blocks,
 * question patterns, keywords, attachments, complexity) and routes to
 * the best-fit model. Users can still manually select a model, but the
 * default is "Auto" — Iris decides.
 *
 * Routing logic:
 *   Code generation / debugging → Codestral or DeepSeek V3.2
 *   Creative writing, conversation, general help → Kimi K2 0905
 *   Fast simple queries → Mistral Small
 *   Real-time news, current events → Grok 4.1 Fast
 *   Complex reasoning, analysis, long documents → GPT OSS 120B or Kimi K2.5
 *   Math and logic → DeepSeek V3.2
 */

import { chatModels } from "./models";

// ---- Model IDs (must match models.ts) ----

const MODEL_IDS = {
  codestral: "mistral/codestral",
  deepseekV3: "deepseek/deepseek-v3.2",
  kimiK2: "moonshotai/kimi-k2-0905",
  mistralSmall: "mistral/mistral-small",
  grokFast: "xai/grok-4.1-fast-non-reasoning",
  gptOss120b: "openai/gpt-oss-120b",
  kimiK25: "moonshotai/kimi-k2.5",
} as const;

// ---- Auto mode sentinel ----

export const AUTO_MODEL_ID = "auto";

// ---- Intent categories ----

export type IntentCategory =
  | "code"
  | "creative"
  | "fast"
  | "realtime"
  | "reasoning"
  | "math"
  | "general";

// ---- Routing result ----

export type RoutingResult = {
  modelId: string;
  modelName: string;
  intent: IntentCategory;
  reason: string;
  confidence: number;
};

// ---- Signal patterns ----

const CODE_PATTERNS = [
  /```[\s\S]*?```/, // fenced code blocks
  /\b(function|const|let|var|class|import|export|return|if|else|for|while|def|print|console\.log|async|await|try|catch|throw)\b/,
  /\b(debug|bug|error|fix|compile|build|deploy|refactor|lint|test|npm|pip|cargo|git)\b/i,
  /\b(python|javascript|typescript|rust|java|golang|c\+\+|ruby|php|swift|kotlin)\b/i,
  /\.(ts|js|py|rs|go|java|cpp|rb|php|swift|kt|css|html|json|yaml|yml|toml|sql)\b/,
  /\b(API|endpoint|route|middleware|database|query|schema|migration)\b/i,
];

const CREATIVE_PATTERNS = [
  /\b(write me|write a|draft|compose|create a story|creative|poem|essay|blog|article|script|narrative)\b/i,
  /\b(tone|voice|style|rewrite|rephrase|paraphrase)\b/i,
  /\b(fiction|novel|character|dialogue|plot)\b/i,
];

const REALTIME_PATTERNS = [
  /\b(today|yesterday|this week|this month|latest|recent|current|breaking|news|happening now|right now)\b/i,
  /\b(stock price|weather now|live|trending|score|match|election)\b/i,
  /\bwhat happened\b/i,
  /\bwho won\b/i,
];

const MATH_PATTERNS = [
  /\b(calculate|compute|solve|equation|integral|derivative|matrix|algebra|calculus|statistics|probability|theorem|proof|formula)\b/i,
  /\b(math|maths|arithmetic|geometric|trigonometry|logarithm)\b/i,
  /[=+\-*/^]{2,}/, // mathematical operators
  /\b\d+\s*[+\-*/^%]\s*\d+\b/, // basic arithmetic expressions
];

const REASONING_PATTERNS = [
  /\b(analyse|analyze|compare|contrast|evaluate|assess|review|examine|consider|implications|consequences)\b/i,
  /\b(explain why|how does|what causes|reasoning|logic|argument|hypothesis|evidence|conclusion)\b/i,
  /\b(pros and cons|advantages|disadvantages|trade-?offs|criteria)\b/i,
  /\b(long document|research|paper|report|thesis|study|analysis)\b/i,
  /\b(complex|complicated|nuanced|multi-?faceted|in-?depth)\b/i,
];

const FAST_QUERY_PATTERNS = [
  /^(what is|who is|where is|when did|how many|how much|define|meaning of)\b/i,
  /^(yes or no|true or false|is it|can you|does|do |did )\b/i,
];

const LEGAL_PATTERNS = [
  /\b(draft a letter|write to|formal complaint|respond to this email|legal|solicitor|barrister|court|tribunal)\b/i,
  /\b(burgess principle|DSAR|subject access|freedom of information|GDPR|human review)\b/i,
];

// ---- Signal scoring ----

function countMatches(text: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      count++;
    }
  }
  return count;
}

function estimateComplexity(text: string): number {
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  const avgWordsPerSentence =
    sentenceCount > 0 ? wordCount / sentenceCount : wordCount;

  if (wordCount > 200 || avgWordsPerSentence > 25) {
    return 1.0;
  }
  if (wordCount > 100 || avgWordsPerSentence > 18) {
    return 0.7;
  }
  if (wordCount > 50) {
    return 0.4;
  }
  if (wordCount <= 10) {
    return 0.1;
  }
  return 0.2;
}

/**
 * Analyse a user message and determine the optimal model.
 */
export function routeMessage(
  message: string,
  hasAttachments = false
): RoutingResult {
  const text = message.trim();

  // Score each intent category
  const scores: Record<IntentCategory, number> = {
    code: countMatches(text, CODE_PATTERNS),
    creative: countMatches(text, CREATIVE_PATTERNS),
    fast: 0,
    realtime: countMatches(text, REALTIME_PATTERNS),
    reasoning: countMatches(text, REASONING_PATTERNS),
    math: countMatches(text, MATH_PATTERNS),
    general: 0,
  };

  // Legal patterns boost creative (formal writing) and reasoning
  const legalScore = countMatches(text, LEGAL_PATTERNS);
  scores.creative += legalScore * 0.5;
  scores.reasoning += legalScore * 0.5;

  // Fast query detection — short messages with simple question patterns
  const complexity = estimateComplexity(text);
  if (complexity <= 0.2 && countMatches(text, FAST_QUERY_PATTERNS) > 0) {
    scores.fast = 3;
  }

  // Attachments boost reasoning (document analysis)
  if (hasAttachments) {
    scores.reasoning += 2;
  }

  // Long messages boost reasoning
  if (complexity >= 0.7) {
    scores.reasoning += 1;
  }

  // Find the highest scoring intent
  const entries = Object.entries(scores) as [IntentCategory, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const [topIntent, topScore] = entries[0];

  // If no strong signal, default to general
  if (topScore < 1) {
    return {
      modelId: MODEL_IDS.kimiK2,
      modelName: getModelName(MODEL_IDS.kimiK2),
      intent: "general",
      reason: "general conversation",
      confidence: 0.5,
    };
  }

  // Calculate confidence based on score gap
  const secondScore = entries[1]?.[1] ?? 0;
  const confidence = Math.min(
    0.95,
    0.5 + (topScore - secondScore) * 0.15 + topScore * 0.05
  );

  // Route based on intent
  return selectModel(topIntent, confidence);
}

function selectModel(
  intent: IntentCategory,
  confidence: number
): RoutingResult {
  switch (intent) {
    case "code":
      return {
        modelId: MODEL_IDS.codestral,
        modelName: getModelName(MODEL_IDS.codestral),
        intent,
        reason: "code detected",
        confidence,
      };

    case "creative":
      return {
        modelId: MODEL_IDS.kimiK2,
        modelName: getModelName(MODEL_IDS.kimiK2),
        intent,
        reason: "creative writing detected",
        confidence,
      };

    case "fast":
      return {
        modelId: MODEL_IDS.mistralSmall,
        modelName: getModelName(MODEL_IDS.mistralSmall),
        intent,
        reason: "simple query — fast response",
        confidence,
      };

    case "realtime":
      return {
        modelId: MODEL_IDS.grokFast,
        modelName: getModelName(MODEL_IDS.grokFast),
        intent,
        reason: "real-time information needed",
        confidence,
      };

    case "reasoning":
      return {
        modelId: MODEL_IDS.gptOss120b,
        modelName: getModelName(MODEL_IDS.gptOss120b),
        intent,
        reason: "complex reasoning detected",
        confidence,
      };

    case "math":
      return {
        modelId: MODEL_IDS.deepseekV3,
        modelName: getModelName(MODEL_IDS.deepseekV3),
        intent,
        reason: "math and logic detected",
        confidence,
      };

    default:
      return {
        modelId: MODEL_IDS.kimiK2,
        modelName: getModelName(MODEL_IDS.kimiK2),
        intent: "general",
        reason: "general conversation",
        confidence: 0.5,
      };
  }
}

function getModelName(modelId: string): string {
  return chatModels.find((m) => m.id === modelId)?.name ?? modelId;
}

/**
 * Extract the text content from a user message's parts array.
 */
export function extractTextFromParts(
  parts: Array<{ type: string; text?: string }>
): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join(" ");
}

/**
 * Check if any parts contain file attachments.
 */
export function hasFileAttachments(
  parts: Array<{ type: string }>
): boolean {
  return parts.some((p) => p.type === "file");
}
