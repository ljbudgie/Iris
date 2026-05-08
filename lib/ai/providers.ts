import { customProvider, gateway } from "ai";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";
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
