/**
 * Named-human attribution tests.
 *
 * Integration Contract v2.0, "Advisory-only" principle: no integration may
 * autonomously issue a SOVEREIGN or NULL classification — a named human must
 * attribute the finding first. These tests pin that boundary.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessScrutiny } from "../../lib/scrutiny/assess";
import {
  ATTRIBUTION_DISCLAIMER,
  attributeFinding,
  isNamedHuman,
} from "../../lib/scrutiny/attribution";

const sovereignAssessment = assessScrutiny({
  namedOfficer: "Jane Doe",
  role: "Senior Case Officer",
  reviewedSpecificFacts: true,
  adjustmentApplied: true,
  liveProceedingChecked: true,
  recordedAndDisclosable: true,
});

describe("isNamedHuman", () => {
  it("accepts a real name", () => {
    assert.equal(isNamedHuman("Jane Doe"), true);
  });

  it("rejects collective and process language", () => {
    for (const value of [
      "the team",
      "Team",
      "customer services",
      "Customer Service",
      "the department",
      "automated process",
      "AI",
      "N/A",
      "unknown",
      "",
      " ",
    ]) {
      assert.equal(isNamedHuman(value), false, `should reject "${value}"`);
    }
  });
});

describe("attributeFinding", () => {
  it("promotes an advisory assessment once a named human attributes it", () => {
    const finding = attributeFinding(sovereignAssessment, {
      name: "Jane Doe",
      role: "Senior Case Officer",
      reviewedAt: "2026-09-01",
    });

    assert.equal(finding.classification, "SOVEREIGN");
    assert.equal(finding.advisory, false);
    assert.equal(finding.requires_human_confirmation, false);
    assert.deepEqual(finding.attribution, {
      name: "Jane Doe",
      role: "Senior Case Officer",
      reviewedAt: "2026-09-01",
    });
    assert.equal(finding.disclaimer, ATTRIBUTION_DISCLAIMER);
  });

  it("defaults the review date to today when omitted", () => {
    const finding = attributeFinding(sovereignAssessment, {
      name: "Jane Doe",
      role: "Senior Case Officer",
    });
    assert.match(finding.attribution.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("refuses attribution by a team or automated process", () => {
    assert.throws(
      () =>
        attributeFinding(sovereignAssessment, {
          name: "the team",
          role: "Operations",
        }),
      /named human being/
    );
  });

  it("refuses attribution without a role", () => {
    assert.throws(
      () =>
        attributeFinding(sovereignAssessment, {
          name: "Jane Doe",
          role: "  ",
        }),
      /role/
    );
  });

  it("refuses a malformed review date", () => {
    assert.throws(
      () =>
        attributeFinding(sovereignAssessment, {
          name: "Jane Doe",
          role: "Senior Case Officer",
          reviewedAt: "01/09/2026",
        }),
      /ISO date/
    );
  });

  it("preserves NULL classifications and their missing limbs", () => {
    const nullAssessment = assessScrutiny({
      namedOfficer: "Jane Doe",
      role: "Senior Case Officer",
      reviewedSpecificFacts: false,
      adjustmentApplied: true,
      liveProceedingChecked: true,
      recordedAndDisclosable: true,
    });
    const finding = attributeFinding(nullAssessment, {
      name: "Jane Doe",
      role: "Senior Case Officer",
    });
    assert.equal(finding.classification, "NULL");
    assert.deepEqual(finding.missingLimbs, ["a"]);
  });
});
