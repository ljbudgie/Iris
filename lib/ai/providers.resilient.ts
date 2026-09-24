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

const RESILIENCE_POOL: string[] = [
  DEFAULT_CHAT_MODEL,
  "deepseek/deepseek-v3.2",
  "openai/gpt-oss-120b",
  "mistral/mistral-small",
  "xai/grok-4.1-fast-non-reasoning",
  "moonshotai/kimi-k2.5",
  "openai/gpt-oss-20b",
  "mistral/codestral",
];

export function isProviderAvailabilityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  const availabilitySignals = [
    "model not found",
    "model is not available",
    "model has been withdrawn",
    "model_not_found",
    "no endpoints available",
    "no healthy upstream",
    "service unavailable",
    "503",
    "529",
    "rate limit",
    "429",
    "temporarily unavailable",
    "access denied",
    "forbidden",
    "403",
    "free tier",
    "paid credits",
    "unrestricted access",
  ];

  return availabilitySignals.some(
    (signal) => message.includes(signal) || name.includes(signal)
  );
}

export type ResilientModelResult = {
  modelId: string;
  requestedModelId: string;
  didFallback: boolean;
  message?: string;
};

export async function getResilientLanguageModel(
  preferredModelId: string,
  resolve: (modelId: string) => ReturnType<typeof resolveProvider> = resolveProvider
): Promise<{
  model: ReturnType<typeof resolveProvider>;
  result: ResilientModelResult;
}> {
  if (isLocalOnly() || isTestEnvironment) {
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
