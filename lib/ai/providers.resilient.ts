import { customProvider, gateway } from "ai";
import { isTestEnvironment } from "../constants";
import { chatModels, DEFAULT_CHAT_MODEL, titleModel } from "./models";
import {
  isLocalOnly,
  isOllamaConfigured,
  ollamaLanguageModel,
} from "./providers/ollama";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
        },
      });
    })()
  : null;

/**
 * Resolve a language model for the given id.
 *
 * Order of preference:
 *   1. Test environment uses the in-process mock provider.
 *   2. When `IRIS_LOCAL_ONLY=1` we route through Ollama (failing loudly
 *      with a friendly message that points at the onboarding wizard if
 *      nothing local is configured).
 *   3. Otherwise we fall back to the Vercel AI Gateway.
 */
function resolveProvider(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  if (isLocalOnly()) {
    if (!isOllamaConfigured()) {
      throw new Error(
        "Local-only mode is enabled, but no local provider is configured. Visit /onboarding to pick a provider, or set OLLAMA_BASE_URL."
      );
    }
    return ollamaLanguageModel(modelId);
  }

  return gateway.languageModel(modelId);
}

export function getLanguageModel(modelId: string) {
  return resolveProvider(modelId);
}

export function getTitleModel() {
  return resolveProvider(titleModel.id);
}

// ─────────────────────────────────────────────────────────────────────────
// Provider resilience — automatic cross-provider fallback
// ─────────────────────────────────────────────────────────────────────────
//
// If a cloud model becomes unavailable mid-session — withdrawn by its
// provider, rate-limited, or the subject of a regulatory restriction —
// Iris should not hard-fail. It should quietly try the next model in the
// resilience pool and tell the user plainly what happened.
//
// This is deliberately a *pool*, not a primary/backup pair: no single
// provider is "the main one with a fallback". Every model in chatModels
// is both a possible first choice (via the smart router) and a possible
// fallback for every other model. The pool order below is the order in
// which Iris will try alternatives — it favours providers that have shown
// the broadest availability, but any entry can become unavailable without
// the others being affected.

const RESILIENCE_POOL: string[] = [
  DEFAULT_CHAT_MODEL, // moonshotai/kimi-k2-0905 — current default
  "deepseek/deepseek-v3.2",
  "openai/gpt-oss-120b",
  "mistral/mistral-small",
  "xai/grok-4.1-fast-non-reasoning",
  "moonshotai/kimi-k2.5",
  "openai/gpt-oss-20b",
  "mistral/codestral",
];

/**
 * Returns true if an error from the gateway/provider layer looks like a
 * model- or provider-level outage (as opposed to e.g. a bad request from
 * malformed input, which retrying on a different model won't fix).
 *
 * Deliberately conservative: only treat errors as "try the next model"
 * when they look like availability problems. Anything else is surfaced
 * immediately so it doesn't masquerade as a routing decision.
 */
export function isProviderAvailabilityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Common shapes for "this model/provider is down or withdrawn" across
  // the providers the Vercel AI Gateway fronts.
  const availabilitySignals = [
    "model not found",
    "model is not available",
    "model has been withdrawn",
    "model_not_found",
    "no endpoints available",
    "no healthy upstream",
    "service unavailable",
    "503",
    "529", // Anthropic overloaded
    "rate limit",
    "429",
    "temporarily unavailable",
    "access denied", // e.g. export-control style restrictions
    "forbidden",
    "403",
  ];

  return availabilitySignals.some(
    (signal) => message.includes(signal) || name.includes(signal)
  );
}

export type ResilientModelResult = {
  /** The model id that was actually resolved and should be used. */
  modelId: string;
  /** The originally requested model id, if different from `modelId`. */
  requestedModelId: string;
  /** True if Iris had to fall back to an alternative model. */
  didFallback: boolean;
  /**
   * Human-readable explanation, suitable for showing the user, e.g.
   * "Switched to Kimi K2 0905 — Codestral was temporarily unavailable."
   * Undefined when no fallback occurred.
   */
  message?: string;
};

/**
 * Resolve a language model with automatic cross-provider fallback.
 *
 * Tries `preferredModelId` first. If resolving or a first lightweight call
 * to that model throws an availability-shaped error (see
 * `isProviderAvailabilityError`), tries each model in `RESILIENCE_POOL` in
 * turn (skipping the one that just failed and any that fail the same way),
 * until one succeeds or the pool is exhausted.
 *
 * In `IRIS_LOCAL_ONLY=1` mode this is a no-op: Ollama is the only provider,
 * and `resolveProvider` already throws a friendly, actionable error if it
 * isn't configured. We don't want to "fall back" away from local-only —
 * sovereignty must not be silently bypassed.
 *
 * Callers should use the returned `modelId` for the actual generation call,
 * and may surface `message` to the user (e.g. as a small system note in
 * the chat) when `didFallback` is true.
 */
export async function getResilientLanguageModel(
  preferredModelId: string,
  // Injected for testability; defaults to the real resolver.
  resolve: (modelId: string) => ReturnType<typeof resolveProvider> = resolveProvider
): Promise<{
  model: ReturnType<typeof resolveProvider>;
  result: ResilientModelResult;
}> {
  if (isLocalOnly() || isTestEnvironment) {
    // No cross-provider fallback in local-only / test mode. Let
    // resolveProvider's own error handling do its job.
    return {
      model: resolve(preferredModelId),
      result: {
        modelId: preferredModelId,
        requestedModelId: preferredModelId,
        didFallback: false,
      },
    };
  }

  const tried = new Set<string>();

  const candidates = [
    preferredModelId,
    ...RESILIENCE_POOL.filter((id) => id !== preferredModelId),
  ];

  let lastError: unknown;

  for (const candidateId of candidates) {
    if (tried.has(candidateId)) {
      continue;
    }
    tried.add(candidateId);

    try {
      const model = resolve(candidateId);

      if (candidateId === preferredModelId) {
        return {
          model,
          result: {
            modelId: candidateId,
            requestedModelId: preferredModelId,
            didFallback: false,
          },
        };
      }

      const fallbackName =
        chatModels.find((m) => m.id === candidateId)?.name ?? candidateId;
      const originalName =
        chatModels.find((m) => m.id === preferredModelId)?.name ??
        preferredModelId;

      return {
        model,
        result: {
          modelId: candidateId,
          requestedModelId: preferredModelId,
          didFallback: true,
          message: `Switched to ${fallbackName} — ${originalName} was temporarily unavailable.`,
        },
      };
    } catch (error) {
      lastError = error;
      if (!isProviderAvailabilityError(error)) {
        throw error;
      }
    }
  }

  throw new Error(
    "All models in the resilience pool are currently unavailable. " +
      "If you have a local model configured (Ollama), Iris can run " +
      "fully offline — see /onboarding. " +
      `(last error: ${lastError instanceof Error ? lastError.message : String(lastError)})`
  );
}
