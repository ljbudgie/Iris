import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessPersonGateContext,
  createLocalCommitment,
} from "../../lib/person-gate/index";

describe("PersonGate context assessment", () => {
  it("detects personal institutional case details", () => {
    const assessment = assessPersonGateContext(
      "My PIP appeal was rejected by the DWP and I need a human review of my disability evidence."
    );

    assert.equal(assessment.requiresSovereignHandling, true);
    assert.equal(assessment.sensitivity, "institutional");
    assert.ok(assessment.tags.includes("personal-facts"));
    assert.ok(assessment.tags.includes("institutional-context"));
  });

  it("does not require PersonGate for generic questions", () => {
    const assessment = assessPersonGateContext(
      "What is the capital of France?"
    );

    assert.equal(assessment.requiresSovereignHandling, false);
    assert.equal(assessment.sensitivity, "none");
  });

  it("creates stable local commitments", () => {
    const first = createLocalCommitment("label", "facts");
    const second = createLocalCommitment("label", "facts");

    assert.equal(first, second);
    assert.equal(first.length, 64);
  });
});
