import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessScrutiny } from "../../lib/scrutiny/assess";

describe("assessScrutiny", () => {
  it("returns SOVEREIGN only when all four limbs and a named officer with a role are present", () => {
    const result = assessScrutiny({
      namedOfficer: "A. Reviewer",
      role: "Complaints officer",
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

  it("returns NULL when the named officer is missing", () => {
    const result = assessScrutiny({
      reviewedSpecificFacts: true,
      adjustmentApplied: true,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });
    assert.equal(result.classification, "NULL");
    assert.ok(result.missingLimbs.includes("d"));
    assert.match(result.nextAction, /name, role and date/);
  });

  it("returns AMBIGUOUS for vague process language without a name", () => {
    const result = assessScrutiny({
      processLanguage: "The case was reviewed in line with policy.",
      reviewedSpecificFacts: "ambiguous",
    });
    assert.equal(result.classification, "AMBIGUOUS");
    assert.ok(result.missingLimbs.length > 0);
  });

  it("treats a missing adjustment limb as NULL, not SOVEREIGN", () => {
    const result = assessScrutiny({
      namedOfficer: "A. Reviewer",
      role: "Officer",
      reviewedSpecificFacts: true,
      adjustmentApplied: false,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });
    assert.equal(result.classification, "NULL");
    assert.deepEqual(result.missingLimbs, ["b"]);
  });
});
