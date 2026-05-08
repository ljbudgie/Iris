/**
 * PersonGate enforcement tests.
 *
 * The pattern-match assessment runs on every chat turn (see
 * lib/person-gate/index.ts). These tests pin the four cases that grok's
 * feedback called out: personal-only, institutional-only, mixed, and
 * benign messages.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessPersonGateContext,
  buildPersonGatePromptContext,
  createLocalCommitment,
} from "../../lib/person-gate/index";

describe("PersonGate assessment", () => {
  it("flags personal-only messages as 'personal'", () => {
    const result = assessPersonGateContext(
      "I am disabled and need help understanding my situation."
    );
    assert.equal(result.sensitivity, "personal");
    assert.equal(result.requiresSovereignHandling, true);
    assert.ok(result.tags.includes("personal-facts"));
  });

  it("flags institutional-only messages as 'none' (no personal facts)", () => {
    const result = assessPersonGateContext(
      "How does the council tax appeal process work in general?"
    );
    // Institution words alone, with no personal context, do not require
    // sovereign handling — only personal facts trigger the gate.
    assert.equal(result.sensitivity, "none");
    assert.equal(result.requiresSovereignHandling, false);
  });

  it("flags mixed personal + institutional context as 'institutional'", () => {
    const result = assessPersonGateContext(
      "My PIP was refused and I want to appeal to the tribunal."
    );
    assert.equal(result.sensitivity, "institutional");
    assert.equal(result.requiresSovereignHandling, true);
    assert.ok(result.tags.includes("personal-facts"));
    assert.ok(result.tags.includes("institutional-context"));
  });

  it("treats benign messages as 'none'", () => {
    const result = assessPersonGateContext("What's the weather like today?");
    assert.equal(result.sensitivity, "none");
    assert.equal(result.requiresSovereignHandling, false);
    assert.equal(result.tags.length, 0);
  });
});

describe("PersonGate prompt context", () => {
  it("returns empty string for benign assessments", () => {
    const result = buildPersonGatePromptContext({
      sensitivity: "none",
      requiresSovereignHandling: false,
      tags: [],
    });
    assert.equal(result, "");
  });

  it("includes a sovereignty instruction for sensitive assessments", () => {
    const result = buildPersonGatePromptContext({
      sensitivity: "institutional",
      requiresSovereignHandling: true,
      tags: ["personal-facts", "institutional-context"],
      commitment: "abc123",
    });
    assert.match(result, /sovereign handling is active/i);
    assert.match(result, /abc123/);
  });
});

describe("PersonGate local commitment", () => {
  it("produces deterministic SHA-256 hex commitments", () => {
    const a = createLocalCommitment("label", "facts");
    const b = createLocalCommitment("label", "facts");
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it("changes the commitment when facts change", () => {
    const a = createLocalCommitment("label", "facts1");
    const b = createLocalCommitment("label", "facts2");
    assert.notEqual(a, b);
  });
});
