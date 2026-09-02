/**
 * Tests for lib/scrutiny/assess.ts — maps the Model Clause four limbs onto
 * SOVEREIGN / NULL / AMBIGUOUS.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessScrutiny } from "../../lib/scrutiny/assess";

describe("assessScrutiny", () => {
  it("is SOVEREIGN when all four limbs are satisfied with a named officer and role", () => {
    const result = assessScrutiny({
      namedOfficer: "Jane Smith",
      role: "Case Manager",
      reviewedSpecificFacts: true,
      adjustmentApplied: true,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });

    assert.equal(result.classification, "SOVEREIGN");
    assert.deepEqual(result.missingLimbs, []);
    assert.equal(result.advisory, true);
    assert.equal(result.requires_human_confirmation, true);
  });

  it("is NULL when no officer or role is recorded", () => {
    const result = assessScrutiny({});

    assert.equal(result.classification, "NULL");
    assert.deepEqual(result.missingLimbs.sort(), ["a", "b", "c", "d"]);
  });

  it("is NULL when officer and role are present but limb (d) cannot be recorded without both", () => {
    const result = assessScrutiny({
      namedOfficer: "Jane Smith",
      role: null,
      reviewedSpecificFacts: true,
      adjustmentApplied: true,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });

    assert.equal(result.classification, "NULL");
    assert.ok(result.missingLimbs.includes("d"));
  });

  it("is NULL when a single limb is missing", () => {
    const result = assessScrutiny({
      namedOfficer: "Jane Smith",
      role: "Case Manager",
      reviewedSpecificFacts: true,
      adjustmentApplied: false,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });

    assert.equal(result.classification, "NULL");
    assert.deepEqual(result.missingLimbs, ["b"]);
  });

  it("is AMBIGUOUS when a limb is marked ambiguous", () => {
    const result = assessScrutiny({
      namedOfficer: "Jane Smith",
      role: "Case Manager",
      reviewedSpecificFacts: "ambiguous",
      adjustmentApplied: true,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });

    assert.equal(result.classification, "AMBIGUOUS");
  });

  it("is AMBIGUOUS when process language is vague and no officer is named", () => {
    const result = assessScrutiny({
      processLanguage:
        "This was subject to human review as part of our standard process.",
    });

    assert.equal(result.classification, "AMBIGUOUS");
  });

  it("is NULL, not SOVEREIGN, when vague process language is used even with a named officer", () => {
    const result = assessScrutiny({
      namedOfficer: "Jane Smith",
      role: "Case Manager",
      reviewedSpecificFacts: true,
      adjustmentApplied: true,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
      processLanguage: "This was reviewed in line with policy.",
    });

    assert.notEqual(result.classification, "SOVEREIGN");
  });

  it("always suggests the next action towards named-officer accountability", () => {
    const sovereign = assessScrutiny({
      namedOfficer: "Jane Smith",
      role: "Case Manager",
      reviewedSpecificFacts: true,
      adjustmentApplied: true,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });
    const nullResult = assessScrutiny({});

    assert.match(sovereign.nextAction, /named officer/);
    assert.match(nullResult.nextAction, /name, role and date/);
  });
});
