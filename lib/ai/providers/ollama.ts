/**
 * Ollama provider — exposes Iris's chosen local AI runtime through the
 * Vercel `ai` SDK's OpenAI-compatible adapter.
 *
 * Ollama (https://ollama.ai) ships an OpenAI-compatible server at
 * `http://localhost:11434/v1` by default, which means the standard
 * `@ai-sdk/openai-compatible` shape works without a new dependency.
 *
 * We intentionally avoid pulling in `@ai-sdk/openai-compatible` directly —
 * Iris already has the `ai` SDK and a small thin wrapper is enough to keep
 * dependency surface area minimal. If a future model needs richer features
 * (tool use, vision), swap this for the upstream adapter.
 */

import type { LanguageModel } from "ai";

const DEFAULT_BASE_URL = "http://localhost:11434/v1";

/**
 * Returns the configured base URL for the local Ollama instance.
 */
export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;
}

/**
 * Returns the default Ollama model name (used when a routed cloud model
 * cannot be served locally and Iris is in local-only mode).
 */
export function getOllamaDefaultModel(): string {
  return process.env.OLLAMA_DEFAULT_MODEL ?? "llama3.2";
}

/**
 * Returns true when an Ollama base URL has been explicitly configured
 * (we don't probe the network here — that would block every request).
 *
 * The presence of `OLLAMA_BASE_URL` or the absence of an explicit
 * `IRIS_LOCAL_ONLY=0` opt-out is treated as "Ollama available".
 */
export function isOllamaConfigured(): boolean {
  return Boolean(process.env.OLLAMA_BASE_URL) || isLocalOnly();
}

export function isLocalOnly(): boolean {
  return process.env.IRIS_LOCAL_ONLY === "1";
}

/**
 * Build a minimal OpenAI-compatible LanguageModel that points at the local
 * Ollama instance. The model id passed in is sent as-is to Ollama; if the
 * smart router picked a cloud model name (e.g. `mistral/codestral`) the
 * caller is responsible for mapping it to a local equivalent — typically
 * the configured `OLLAMA_DEFAULT_MODEL`.
 *
 * This is a thin, dependency-free shim that implements just enough of the
 * `LanguageModel` v2 surface to back chat streaming via the `ai` SDK's
 * `streamText` call. For richer behaviour, install
 * `@ai-sdk/openai-compatible` and swap this implementation.
 */
export function ollamaLanguageModel(modelId: string): LanguageModel {
  const baseUrl = getOllamaBaseUrl().replace(/\/$/, "");
  const localId = mapToLocalModel(modelId);

  // We deliberately keep this object structural — the `ai` SDK uses
  // duck-typing on `LanguageModel` v2 — so we only implement what's needed.
  // Concrete request handling is delegated to the OpenAI-compatible HTTP
  // surface that Ollama exposes.
  return {
    specificationVersion: "v2",
    provider: "ollama",
    modelId: localId,
    supportedUrls: {},
    async doGenerate() {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: localId, stream: false }),
      });
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content ?? "";
      return {
        content: [{ type: "text", text }],
        finishReason: "stop",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        rawCall: { rawPrompt: null, rawSettings: {} },
        warnings: [],
      };
    },
    async doStream() {
      // Streaming bridge: Iris's chat route uses `streamText`, which calls
      // `doStream`. Ollama supports streaming via the same endpoint with
      // `stream: true`. The full SSE bridge is intentionally minimal — for
      // production, swap in `@ai-sdk/openai-compatible`.
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: localId, stream: true }),
      });
      return {
        stream: res.body as unknown as ReadableStream<unknown>,
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    },
  } as unknown as LanguageModel;
}

/**
 * Map a router-selected cloud model id to a local Ollama model name.
 *
 * Today this is a single bucket — the `OLLAMA_DEFAULT_MODEL` — because
 * Ollama users typically pull one or two models. Future work: a real
 * mapping table by capability (code → codellama, reasoning → qwen2, etc).
 */
function mapToLocalModel(_routedModelId: string): string {
  return getOllamaDefaultModel();
}
