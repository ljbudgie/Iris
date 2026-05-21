import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRegisterEntry,
  buildRegisterExport,
  filterRegisterRecords,
} from "@/lib/certification/register-export";
import type {
  BinaryTestResponses,
  CertificationIntake,
  CertificationRecord,
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

const responses: BinaryTestResponses = {
  decisionPoint: { answer: "yes", evidence: "Notice dated 20 May" },
  namedIndividual: { answer: "yes", evidence: "Officer named" },
  specificFactsReview: { answer: "yes", evidence: "Case notes reviewed" },
};

const record: CertificationRecord = {
  id: "record-1",
  intake,
  test: responses,
  classification: "SOVEREIGN",
  summary: "",
  assessedAt: "2026-05-21T16:00:00.000Z",
  signing: {
    commitment: "abc123",
    algorithm: "SHA-256",
    provider: "PersonGate",
    label: "Commitment hash (PersonGate)",
    createdAt: "2026-05-21T16:00:00.000Z",
  },
};

describe("institutional register export", () => {
  it("builds Framer CMS-ready entries with generated summaries", () => {
    assert.deepEqual(buildRegisterEntry(record), {
      entity: "Example Council",
      process_assessed: "Penalty charge notice review",
      classification: "SOVEREIGN",
      summary:
        "Example Council was assessed under The Burgess Principle. The decision process Penalty charge notice review was classified SOVEREIGN on 2026-05-21.",
      date: "2026-05-21",
      commitment_hash: "abc123",
    });
  });

  it("filters records and includes export header metadata", () => {
    const nullRecord: CertificationRecord = {
      ...record,
      id: "record-2",
      classification: "NULL",
    };

    assert.deepEqual(filterRegisterRecords([record, nullRecord], "NULL"), [
      nullRecord,
    ]);
    assert.deepEqual(
      buildRegisterExport({
        records: [record, nullRecord],
        filter: "SOVEREIGN",
        exportedAt: "2026-05-21T17:00:00.000Z",
      }),
      {
        exported_at: "2026-05-21T17:00:00.000Z",
        total_count: 1,
        entries: [buildRegisterEntry(record)],
      }
    );
  });
});
