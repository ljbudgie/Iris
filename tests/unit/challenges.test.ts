import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  BinaryTestResponses,
  CertificationIntake,
  CertificationRecord,
} from "@/lib/certification/workflow";
import {
  buildChallengeRecord,
  calculateStatutoryDeadline,
} from "@/lib/challenges/workflow";

const intake: CertificationIntake = {
  institutionName: "Example Council",
  processAssessed: "Penalty charge notice review",
  decisionReference: "PCN-123",
  decisionType: "PCN",
  decisionDate: "2026-05-20",
  namedIndividualIdentified: false,
  assessorReference: "ASSESSOR-1",
};

const responses: BinaryTestResponses = {
  decisionPoint: { answer: "yes", evidence: "Notice dated 20 May" },
  namedIndividual: { answer: "no", evidence: "No officer named" },
  specificFactsReview: {
    answer: "no",
    evidence: "No case-specific notes supplied",
  },
};

const nullRecord: CertificationRecord = {
  id: "record-1",
  intake,
  test: responses,
  classification: "NULL",
  summary:
    "Example Council was assessed for Penalty charge notice review. The assessment is classified as NULL.",
  assessedAt: "2026-05-21T16:00:00.000Z",
};

describe("statutory challenge workflow", () => {
  it("calculates SAR deadlines as 30 calendar days", () => {
    assert.equal(
      calculateStatutoryDeadline("2026-05-21", "subject_access_request"),
      "2026-06-20"
    );
  });

  it("calculates DUAA deadlines as 20 working days", () => {
    assert.equal(
      calculateStatutoryDeadline(
        "2026-05-21",
        "duaa_automated_decision_notice"
      ),
      "2026-06-18"
    );
  });

  it("builds a letter and JSON-ready challenge record from a NULL certification", () => {
    const challenge = buildChallengeRecord({
      id: "challenge-1",
      record: nullRecord,
      challengeType: "article_16_rectification",
      submissionDate: "2026-05-21",
      institutionAddress: "1 Council Street",
      preferredRemedy: "rectification",
      reasonableAdjustmentEmailOnly: true,
      createdAt: "2026-05-21T16:00:00.000Z",
    });

    assert.equal(challenge.originatingCertificationId, "record-1");
    assert.equal(challenge.classification, "NULL");
    assert.equal(challenge.statutoryDeadline, "2026-06-20");
    assert.match(challenge.plainText, /UK GDPR Article 16/);
    assert.match(challenge.plainText, /email-only communication/);
    assert.match(
      challenge.plainText,
      /This notice is issued under The Burgess Principle/
    );
    assert.match(challenge.html, /burgess-statutory-challenge/);
  });

  it("rejects SOVEREIGN certifications", () => {
    assert.throws(() =>
      buildChallengeRecord({
        id: "challenge-2",
        record: { ...nullRecord, classification: "SOVEREIGN" },
        challengeType: "subject_access_request",
        submissionDate: "2026-05-21",
        institutionAddress: "",
        preferredRemedy: "compliance",
        reasonableAdjustmentEmailOnly: false,
        createdAt: "2026-05-21T16:00:00.000Z",
      })
    );
  });
});
