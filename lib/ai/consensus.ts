/**
 * Multi-Model Consensus — sends the same prompt to 2-3 models simultaneously
 * and selects the best response.
 *
 * For high-stakes queries, Iris can query multiple models and present
 * the best answer with alternatives available via "See other perspectives".
 *
 * This is what no other AI does: the best answer from the best model,
 * with alternatives available.
 */

import { generateText } from "ai";
import { chatModels } from "./models";
import { getLanguageModel } from "./providers";

// ---- Types ----

export type ConsensusResponse = {
  modelId: string;
  modelName: string;
  text: string;
  finishReason: string;
};

export type ConsensusResult = {
  primary: ConsensusResponse;
  alternatives: ConsensusResponse[];
  consensusModels: string[];
};

// ---- Default consensus model set ----

const DEFAULT_CONSENSUS_MODELS = [
  "moonshotai/kimi-k2-0905",
  "deepseek/deepseek-v3.2",
  "openai/gpt-oss-120b",
];

/**
 * Run consensus by querying multiple models with the same prompt.
 * Returns the best response (longest substantive answer) as primary,
 * with others as alternatives.
 */
export async function runConsensus({
  systemPrompt,
  userMessage,
  modelIds = DEFAULT_CONSENSUS_MODELS,
}: {
  systemPrompt: string;
  userMessage: string;
  modelIds?: string[];
}): Promise<ConsensusResult> {
  const validModelIds = modelIds.filter((id) =>
    chatModels.some((m) => m.id === id)
  );

  if (validModelIds.length === 0) {
    throw new Error("No valid models provided for consensus");
  }

  // Query all models in parallel
  const results = await Promise.allSettled(
    validModelIds.map(async (modelId) => {
      const model = chatModels.find((m) => m.id === modelId);
      const modelConfig = model ? { order: model.gatewayOrder } : undefined;

      const result = await generateText({
        model: getLanguageModel(modelId),
        system: systemPrompt,
        prompt: userMessage,
        providerOptions: modelConfig ? { gateway: modelConfig } : undefined,
      });

      return {
        modelId,
        modelName: model?.name ?? modelId,
        text: result.text,
        finishReason: result.finishReason,
      } satisfies ConsensusResponse;
    })
  );

  // Collect successful responses
  const responses: ConsensusResponse[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      responses.push(result.value);
    }
  }

  if (responses.length === 0) {
    throw new Error("All consensus models failed to respond");
  }

  // Select the best response: prefer longer, substantive answers
  // that don't start with filler phrases
  const scored = responses.map((r) => ({
    response: r,
    score: scoreResponse(r.text),
  }));

  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0].response;
  const alternatives = scored.slice(1).map((s) => s.response);

  return {
    primary,
    alternatives,
    consensusModels: validModelIds,
  };
}

/**
 * Score a response for quality. Higher = better.
 */
function scoreResponse(text: string): number {
  let score = 0;

  // Length (moderate length preferred)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 30 && wordCount <= 500) {
    score += 3;
  } else if (wordCount > 500) {
    score += 2;
  } else if (wordCount >= 10) {
    score += 1;
  }

  // Penalise filler openings
  const fillerPatterns = [
    /^great question/i,
    /^that's a really/i,
    /^that's an interesting/i,
    /^i'd be happy to/i,
    /^absolutely!/i,
    /^of course!/i,
    /^sure!/i,
  ];

  for (const pattern of fillerPatterns) {
    if (pattern.test(text.trim())) {
      score -= 2;
    }
  }

  // Reward structure (headers, lists)
  if (/^#{1,3}\s/m.test(text)) {
    score += 1;
  }
  if (/^[-*]\s/m.test(text)) {
    score += 1;
  }

  // Reward completeness (ends with proper punctuation)
  if (/[.!?]$/.test(text.trim())) {
    score += 1;
  }

  return score;
}

/**
 * Determine if a query warrants consensus (high-stakes detection).
 */
export function shouldUseConsensus(message: string): boolean {
  const highStakesPatterns = [
    /\b(legal|lawsuit|court|tribunal|rights|law)\b/i,
    /\b(medical|health|diagnosis|symptom|medication)\b/i,
    /\b(financial|investment|tax|pension|mortgage)\b/i,
    /\b(safety|emergency|danger|risk)\b/i,
    /\b(important|critical|urgent|serious)\b/i,
    /\b(life-?changing|major decision|should I)\b/i,
  ];

  let matchCount = 0;
  for (const pattern of highStakesPatterns) {
    if (pattern.test(message)) {
      matchCount++;
    }
  }

  return matchCount >= 2;
}
