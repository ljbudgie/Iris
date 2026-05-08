import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getAllGatewayModels, getCapabilities } from "../../lib/ai/models";
import { evaluateResponse } from "../../lib/ai/quality-loop";
import {
  AUTO_MODEL_ID,
  extractTextFromParts,
  hasFileAttachments,
  routeMessage,
} from "../../lib/ai/smart-router";
import { buildIrisSystemPrompt } from "../../lib/ai/system-prompt";
import { detectTemplate, getTemplateInstruction } from "../../lib/ai/templates";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("smart router", () => {
  it("exposes the auto model sentinel", () => {
    assert.equal(AUTO_MODEL_ID, "auto");
  });

  it("routes code requests to the code-focused model", () => {
    const result = routeMessage(
      "Please debug this TypeScript function that fails during npm build"
    );

    assert.equal(result.intent, "code");
    assert.equal(result.modelId, "mistral/codestral");
    assert.equal(result.reason, "code detected");
    assert.ok(result.confidence > 0.5);
  });

  it("routes simple factual questions to the fast model", () => {
    const result = routeMessage("What is GDPR?");

    assert.equal(result.intent, "fast");
    assert.equal(result.modelId, "mistral/mistral-small");
  });

  it("routes current-events questions to the realtime model", () => {
    const result = routeMessage("What happened in the election today?");

    assert.equal(result.intent, "realtime");
    assert.equal(result.modelId, "xai/grok-4.1-fast-non-reasoning");
  });

  it("routes attached documents to reasoning", () => {
    const result = routeMessage("Please summarise this", true);

    assert.equal(result.intent, "reasoning");
    assert.equal(result.modelId, "openai/gpt-oss-120b");
  });

  it("falls back to general conversation when no intent signal is strong", () => {
    const result = routeMessage("Hello there");

    assert.equal(result.intent, "general");
    assert.equal(result.modelId, "moonshotai/kimi-k2-0905");
    assert.equal(result.confidence, 0.5);
  });

  it("extracts only text parts in order", () => {
    const text = extractTextFromParts([
      { type: "text", text: "first" },
      { type: "file" },
      { type: "text", text: "second" },
      { type: "text" },
    ]);

    assert.equal(text, "first second");
  });

  it("detects file attachments in message parts", () => {
    assert.equal(
      hasFileAttachments([{ type: "text" }, { type: "file" }]),
      true
    );
    assert.equal(hasFileAttachments([{ type: "text" }]), false);
  });
});

describe("response templates", () => {
  it("detects quick-answer prompts before broader templates", () => {
    const result = detectTemplate("What is a DSAR?");

    assert.equal(result.template, "quick");
    assert.equal(result.confidence, 0.85);
    assert.match(result.instruction, /Quick answer/);
  });

  it("detects legal correspondence prompts", () => {
    const result = detectTemplate(
      "Draft a letter to the council about my tribunal and reasonable adjustments"
    );

    assert.equal(result.template, "legal");
    assert.match(result.instruction, /Legal correspondence/);
    assert.ok(result.confidence > 0.5);
  });

  it("detects emotional support prompts", () => {
    const result = detectTemplate(
      "I'm feeling overwhelmed and anxious, can you support me?"
    );

    assert.equal(result.template, "emotional");
    assert.match(result.instruction, /Emotional support/);
  });

  it("returns general instructions for prompts without a strong signal", () => {
    const result = detectTemplate("Tell me more");

    assert.equal(result.template, "general");
    assert.equal(result.instruction, getTemplateInstruction("general"));
    assert.equal(result.confidence, 0.5);
  });
});

describe("quality loop", () => {
  it("passes a substantive response without issues", () => {
    const result = evaluateResponse({
      response:
        "Use the appeal reference to explain the issue, state the decision you challenge, and ask for evidence of human review.",
      userMessage: "Help me plan a short appeal response",
      intent: "general",
      template: "general",
      modelId: "moonshotai/kimi-k2-0905",
    });

    assert.equal(result.passed, true);
    assert.equal(result.score, 10);
    assert.deepEqual(result.issues, []);
    assert.equal(result.suggestedModelId, undefined);
  });

  it("flags no-answer responses and suggests a fallback model", () => {
    const result = evaluateResponse({
      response: "OK",
      userMessage: "Please analyse the whole policy and explain the risks",
      intent: "reasoning",
      template: "analysis",
      modelId: "openai/gpt-oss-120b",
    });

    assert.equal(result.passed, false);
    assert.ok(result.issues.includes("no_answer"));
    assert.ok(result.issues.includes("too_short"));
    assert.equal(result.suggestedModelId, "moonshotai/kimi-k2.5");
  });

  it("flags filler openings and wrong models for code responses", () => {
    const result = evaluateResponse({
      response:
        "Great question. You can fix it by checking the stack trace and updating the function implementation.",
      userMessage: "Fix this TypeScript build error",
      intent: "code",
      template: "code",
      modelId: "moonshotai/kimi-k2-0905",
    });

    assert.equal(result.passed, true);
    assert.ok(result.issues.includes("filler_opening"));
    assert.ok(result.issues.includes("wrong_model"));
  });

  it("flags emotional support responses that use bullets", () => {
    const result = evaluateResponse({
      response: "- Breathe\n- Make a plan\n- Ask someone for support",
      userMessage: "I'm scared and overwhelmed",
      intent: "general",
      template: "emotional",
      modelId: "moonshotai/kimi-k2-0905",
    });

    assert.equal(result.issues.includes("template_mismatch"), true);
  });
});

describe("system prompt builder", () => {
  it("includes model attribution guidance without memory context", () => {
    const prompt = buildIrisSystemPrompt({ modelName: "Kimi K2" });

    assert.match(prompt, /You are Iris/);
    assert.match(prompt, /You are currently running as: Kimi K2/);
    assert.doesNotMatch(prompt, /User memory context/);
  });

  it("includes memory context when provided", () => {
    const prompt = buildIrisSystemPrompt({
      modelName: "Mistral Small",
      memoryContext: "User prefers concise summaries.",
    });

    assert.match(prompt, /User memory context \(from MemPalace\)/);
    assert.match(prompt, /User prefers concise summaries/);
    assert.match(prompt, /— Mistral Small/);
  });
});

describe("model metadata helpers", () => {
  it("returns conservative capabilities when endpoint lookups fail", async () => {
    globalThis.fetch = () => {
      throw new Error("network unavailable");
    };

    const capabilities = await getCapabilities();

    assert.equal(capabilities["mistral/codestral"].tools, false);
    assert.equal(capabilities["mistral/codestral"].vision, false);
    assert.equal(capabilities["mistral/codestral"].reasoning, false);
  });

  it("maps gateway language models into local capability metadata", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: [
            {
              id: "provider/language-model",
              name: "Language Model",
              type: "language",
              tags: ["tool-use", "vision"],
            },
            {
              id: "provider/embedder",
              name: "Embedder",
              type: "embedding",
              tags: ["tool-use"],
            },
          ],
        }),
        { status: 200 }
      );

    const models = await getAllGatewayModels();

    assert.deepEqual(models, [
      {
        id: "provider/language-model",
        name: "Language Model",
        provider: "provider",
        description: "",
        capabilities: {
          tools: true,
          vision: true,
          reasoning: false,
        },
      },
    ]);
  });

  it("returns an empty gateway model list on non-ok responses", async () => {
    globalThis.fetch = async () => new Response("{}", { status: 503 });

    assert.deepEqual(await getAllGatewayModels(), []);
  });
});
