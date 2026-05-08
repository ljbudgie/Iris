/**
 * Voice-consistency guardrail.
 *
 * Protects the founder voice from drift in future PRs:
 *   - The system prompt must contain the named-author founder anchor.
 *   - Forbidden interchangeable-AI phrases must not appear.
 *   - Disability framing behaviour must be present.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  irisFounderAnchor,
  irisSystemPrompt,
} from "../../lib/ai/system-prompt";

describe("Iris founder voice", () => {
  it("system prompt contains the founder anchor", () => {
    assert.ok(
      irisSystemPrompt.includes(irisFounderAnchor),
      "irisSystemPrompt must include the founder anchor sentence."
    );
  });

  it("founder anchor names Lewis Burgess", () => {
    assert.match(irisFounderAnchor, /Lewis Burgess/);
  });

  it("founder anchor references disability lived experience", () => {
    assert.match(irisFounderAnchor, /disabled/i);
  });

  it("system prompt forbids interchangeable-AI phrases", () => {
    const forbidden = [
      "Great question",
      "That's interesting",
      "As an AI",
      "I'm just a",
    ];
    // The prompt instructs the model NOT to use these — so the prompt
    // itself must reference them only in negation form.
    for (const phrase of forbidden) {
      // The prompt may quote them, but only inside a "Never" instruction.
      const lines = irisSystemPrompt
        .split(/\n/)
        .filter((line) => line.includes(phrase));
      for (const line of lines) {
        assert.match(
          line,
          /never/i,
          `Phrase ${JSON.stringify(phrase)} appears outside a "Never …" instruction.`
        );
      }
    }
  });

  it("system prompt treats reasonable adjustments as the floor", () => {
    assert.match(irisSystemPrompt, /reasonable adjustments? as the floor/i);
  });
});
