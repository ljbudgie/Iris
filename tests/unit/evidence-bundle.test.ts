import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEvidenceBundle,
  buildEvidenceBundleHtml,
} from "@/lib/certification/evidence-bundle";
import type {
  BinaryTestResponses,
  CertificationIntake,
  CertificationRecord,
} from "@/lib/certification/workflow";
import type { StatutoryChallengeRecord } from "@/lib/challenges/workflow";

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
  specificFactsReview: { answer: "no", evidence: "No case notes supplied" },
};

const record: CertificationRecord = {
  id: "record-1",
  intake,
  test: responses,
  classification: "NULL",
  summary: "Example Council was classified NULL.",
  assessedAt: "2026-05-21T16:00:00.000Z",
  signing: {
    commitment: "abc123",
    algorithm: "SHA-256",
    provider: "PersonGate",
    label: "Commitment hash (PersonGate)",
    createdAt: "2026-05-21T16:00:00.000Z",
  },
};

const challenge: StatutoryChallengeRecord = {
  id: "challenge-1",
  originatingCertificationId: "record-1",
  challengeType: "subject_access_request",
  challengeLabel: "Subject Access Request (UK GDPR Article 15)",
  institutionName: "Example Council",
  institutionAddress: "1 Council Street",
  decisionReference: "PCN-123",
  classification: "NULL",
  processAssessed: "Penalty charge notice review",
  evidenceNotes: ["Decision point: Notice dated 20 May"],
  submissionDate: "2026-05-22",
  statutoryDeadline: "2026-06-21",
  preferredRemedy: "compliance",
  reasonableAdjustmentEmailOnly: false,
  plainText: "Challenge letter text",
  html: "<article>Challenge letter text</article>",
  createdAt: "2026-05-22T09:00:00.000Z",
  responseLog: {
    responseDate: "2026-06-20",
    responseType: "substantive",
    updatedFinding: "SOVEREIGN",
  },
};

describe("evidence bundle builder", () => {
  it("assembles a complete local bundle with deadlines and timeline", () => {
    const bundle = buildEvidenceBundle({
      record,
      challenges: [challenge],
      producedAt: "2026-06-21T10:00:00.000Z",
      today: "2026-06-21",
    });

    assert.equal(bundle.cover_page.certification_mark, "UK00004343685");
    assert.equal(bundle.challenge_letters.length, 1);
    assert.equal(bundle.response_log[0].updated_classification, "SOVEREIGN");
    assert.equal(bundle.deadline_summary[0].status, "met");
    assert.deepEqual(
      bundle.timeline.map((event) => event.label),
      [
        "Certification completed",
        "Challenge submitted",
        "Response received",
        "Statutory deadline",
      ]
    );
    assert.match(bundle.closing_statement, /PersonGate SHA-256/);
  });

  it("renders printable Burgess HTML without external dependencies", () => {
    const bundle = buildEvidenceBundle({
      record,
      challenges: [challenge],
      producedAt: "2026-06-21T10:00:00.000Z",
      today: "2026-06-21",
    });
    const html = buildEvidenceBundleHtml(bundle);

    assert.match(html, /<!doctype html>/);
    assert.match(html, /font-family:Cinzel/);
    assert.match(html, /Challenge letter text/);
    assert.match(html, /UK Certification Mark UK00004343685/);
  });
});
