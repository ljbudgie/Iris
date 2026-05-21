import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCertificationSummary,
  buildCommitmentPayload,
  buildLedgerEntry,
  classifyCertification,
  type BinaryTestResponses,
  type CertificationIntake,
  type CertificationRecord,
} from "@/lib/certification/workflow";

const intake: CertificationIntake = {
  institutionName: "Example Council",
  processAssessed: "Penalty charge notice review",
  decisionReference: "PCN-123",
  decisionType: "PCN",
  decisionDate: "2026-05-20",
  namedIndividualIdentified: true,
  assessorReference: "ASSESSOR-1",
};

const sovereignResponses: BinaryTestResponses = {
  decisionPoint: { answer: "yes", evidence: "Notice dated 20 May" },
  namedIndividual: { answer: "yes", evidence: "Officer named" },
  specificFactsReview: { answer: "yes", evidence: "Case notes reviewed" },
};

describe("institutional certification workflow", () => {
  it("classifies sovereign when all binary prompts pass", () => {
    assert.equal(classifyCertification(sovereignResponses), "SOVEREIGN");
  });

  it("classifies null when no named individual is identified", () => {
    assert.equal(
      classifyCertification({
        ...sovereignResponses,
        namedIndividual: { answer: "no", evidence: "No officer named" },
      }),
      "NULL"
    );
  });

  it("classifies ambiguous when the decision point cannot be identified", () => {
    assert.equal(
      classifyCertification({
        ...sovereignResponses,
        decisionPoint: { answer: "no", evidence: "No decision date" },
      }),
      "AMBIGUOUS"
    );
  });

  it("builds a ledger entry with the PersonGate commitment hash", () => {
    const summary = buildCertificationSummary({
      intake,
      responses: sovereignResponses,
      classification: "SOVEREIGN",
    });
    const record: CertificationRecord = {
      id: "record-1",
      intake,
      test: sovereignResponses,
      classification: "SOVEREIGN",
      summary,
      assessedAt: "2026-05-21T16:00:00.000Z",
      signing: {
        commitment: "abc123",
        algorithm: "SHA-256",
        provider: "PersonGate",
        label: "Commitment hash (PersonGate)",
        createdAt: "2026-05-21T16:00:00.000Z",
      },
    };

    assert.deepEqual(buildLedgerEntry(record), {
      entity: "Example Council",
      process: "Penalty charge notice review",
      classification: "SOVEREIGN",
      summary,
      date: "2026-05-21T16:00:00.000Z",
      signature: "abc123",
    });
  });

  it("includes stable certification facts in the commitment payload", () => {
    const payload = buildCommitmentPayload({
      intake,
      responses: sovereignResponses,
      classification: "SOVEREIGN",
      assessedAt: "2026-05-21T16:00:00.000Z",
    });

    assert.match(payload, /Example Council/);
    assert.match(payload, /Penalty charge notice review/);
    assert.match(payload, /SOVEREIGN/);
  });
});
