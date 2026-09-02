/**
 * Tests for lib/loop/model-clause.ts — the canonical Model Clause text and
 * certification-mark status used in Burgess letter generation.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MODEL_CLAUSE_DOES_NOT_REQUIRE,
  MODEL_CLAUSE_LETTER_PROMPT,
  MODEL_CLAUSE_MARK,
  MODEL_CLAUSE_STATUS,
  MODEL_CLAUSE_TEXT,
} from "../../lib/loop";

describe("MODEL_CLAUSE_TEXT", () => {
  it("includes all four limbs (a)-(d)", () => {
    assert.match(
      MODEL_CLAUSE_TEXT,
      /\(a\) reviewed the specific facts of the specific case/
    );
    assert.match(
      MODEL_CLAUSE_TEXT,
      /\(b\) confirmed that any recorded reasonable adjustment has been applied/
    );
    assert.match(
      MODEL_CLAUSE_TEXT,
      /\(c\) confirmed that the action is not subject to an active complaint, appeal, or legal proceeding/
    );
    assert.match(
      MODEL_CLAUSE_TEXT,
      /\(d\) recorded their name, role, and the date of the review/
    );
  });

  it("states that the action is NULL and must not proceed without review", () => {
    assert.match(MODEL_CLAUSE_TEXT, /the action is NULL and must not proceed/);
  });

  it("places the burden of proof on the organisation when no officer can be identified", () => {
    assert.match(
      MODEL_CLAUSE_TEXT,
      /the organisation bears the burden of proving otherwise/
    );
  });
});

describe("MODEL_CLAUSE_DOES_NOT_REQUIRE", () => {
  it("clarifies the clause does not require slowness, senior review, or a new appeal right", () => {
    const combined = MODEL_CLAUSE_DOES_NOT_REQUIRE.join(" ");
    assert.match(combined, /does not require every decision to be made slowly/);
    assert.match(combined, /does not prohibit automation/);
    assert.match(combined, /does not require senior officer involvement/);
    assert.match(combined, /does not create a right of appeal/);
  });
});

describe("MODEL_CLAUSE_STATUS", () => {
  it("marks certification as accepted but pending publication, opposition, and registration", () => {
    assert.match(MODEL_CLAUSE_STATUS, /accepted by the UK IPO on 21 July 2026/);
    assert.match(
      MODEL_CLAUSE_STATUS,
      /Publication, opposition period, and registration are pending/
    );
    assert.doesNotMatch(MODEL_CLAUSE_STATUS, /fully registered/i);
    assert.match(MODEL_CLAUSE_STATUS, new RegExp(MODEL_CLAUSE_MARK));
  });
});

describe("MODEL_CLAUSE_LETTER_PROMPT", () => {
  it("instructs the model not to soften or paraphrase limbs (a)-(d)", () => {
    assert.match(
      MODEL_CLAUSE_LETTER_PROMPT,
      /Do not soften or paraphrase limbs \(a\), \(b\), \(c\), or \(d\)/
    );
  });

  it("includes the verbatim clause text and certification-mark status", () => {
    assert.ok(MODEL_CLAUSE_LETTER_PROMPT.includes(MODEL_CLAUSE_TEXT));
    assert.ok(MODEL_CLAUSE_LETTER_PROMPT.includes(MODEL_CLAUSE_STATUS));
  });

  it("never claims the certification mark is fully registered", () => {
    assert.doesNotMatch(MODEL_CLAUSE_LETTER_PROMPT, /fully registered/i);
  });
});
