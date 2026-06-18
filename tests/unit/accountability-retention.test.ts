/**
 * Unit tests for lib/accountability/retention.ts
 *
 * These tests exercise evaluateRetention() — the pure policy engine — without
 * any database calls. DB-dependent functions (createAccountabilityRecord, etc.)
 * require a live Postgres connection and are integration-tested separately.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateRetention } from "../../lib/accountability/policy";
import type { AccountabilityRecord } from "../../lib/db/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function makeRecord(
  overrides: Partial<AccountabilityRecord> = {},
): AccountabilityRecord {
  return {
    id: "test-id",
    userId: "user-id",
    category: "model_context",
    title: "Test record",
    content: null,
    namedDecisionMaker: null,
    decisionMakerRole: null,
    institutionName: null,
    sourceRef: null,
    decisionDate: null,
    chatId: null,
    messageId: null,
    retainUntil: null,
    onHold: false,
    holdType: null,
    holdReason: null,
    holdAppliedAt: null,
    markedForDeletion: false,
    deletionRequestedAt: null,
    deletionApprovedAt: null,
    metadata: {},
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

const FAR_FUTURE = new Date(Date.now() + 365 * DAY_MS);
const FAR_PAST = new Date("2020-01-01T00:00:00Z");

// ---------------------------------------------------------------------------
// Hold logic — holds block deletion regardless of category or retention period
// ---------------------------------------------------------------------------

describe("evaluateRetention — holds", () => {
  it("retains a record on legal_hold even if retention has expired", () => {
    const record = makeRecord({
      category: "model_context",
      retainUntil: FAR_PAST,
      onHold: true,
      holdType: "legal_hold",
      holdReason: "Active legal proceedings",
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
    assert.equal(decision.blockedBy, "legal_hold");
    assert.equal(decision.requiresHumanApproval, true);
    assert.match(decision.reason, /legal_hold/);
  });

  it("retains a record on accountability_hold", () => {
    const record = makeRecord({
      category: "model_context",
      onHold: true,
      holdType: "accountability_hold",
      holdReason: "DBC case ongoing",
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
    assert.equal(decision.blockedBy, "accountability_hold");
  });

  it("retains a record on user_hold", () => {
    const record = makeRecord({
      onHold: true,
      holdType: "user_hold",
      holdReason: "I need this",
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
    assert.equal(decision.blockedBy, "user_hold");
  });
});

// ---------------------------------------------------------------------------
// Indefinite retention categories
// ---------------------------------------------------------------------------

describe("evaluateRetention — indefinite categories", () => {
  it("always retains institutional_decision records", () => {
    const record = makeRecord({
      category: "institutional_decision",
      retainUntil: FAR_PAST, // even with expired retainUntil, policy is indefinite
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
    assert.equal(decision.blockedBy, "policy");
    assert.equal(decision.requiresHumanApproval, true);
  });

  it("always retains accountability_evidence records", () => {
    const record = makeRecord({ category: "accountability_evidence" });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
    assert.equal(decision.requiresHumanApproval, true);
  });
});

// ---------------------------------------------------------------------------
// Time-bounded categories
// ---------------------------------------------------------------------------

describe("evaluateRetention — model_context (90-day default)", () => {
  it("retains a record within its retention window", () => {
    const record = makeRecord({
      category: "model_context",
      retainUntil: FAR_FUTURE,
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
    assert.equal(decision.requiresHumanApproval, false);
  });

  it("allows deletion after retention period expires with no hold", () => {
    const record = makeRecord({
      category: "model_context",
      retainUntil: FAR_PAST,
      onHold: false,
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, false);
    assert.equal(decision.blockedBy, null);
    assert.equal(decision.requiresHumanApproval, false);
  });
});

describe("evaluateRetention — personal_sensitive (730-day default)", () => {
  it("retains within window", () => {
    const record = makeRecord({
      category: "personal_sensitive",
      retainUntil: FAR_FUTURE,
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
  });

  it("requires human approval after retention expires", () => {
    const record = makeRecord({
      category: "personal_sensitive",
      retainUntil: FAR_PAST,
      onHold: false,
    });
    const decision = evaluateRetention(record);
    // Policy: requireHumanReviewBeforeDeletion = true
    assert.equal(decision.shouldRetain, true);
    assert.equal(decision.requiresHumanApproval, true);
    assert.match(decision.reason, /human review/i);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("evaluateRetention — edge cases", () => {
  it("uses createdAt + defaultDays when retainUntil is null and category has a period", () => {
    // model_context: 90 days. Created 91 days ago → should be purgeable.
    const createdAt = new Date(Date.now() - 91 * DAY_MS);
    const record = makeRecord({
      category: "model_context",
      retainUntil: null,
      createdAt,
      onHold: false,
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, false);
  });

  it("retains when retainUntil is null and category is indefinite", () => {
    const record = makeRecord({
      category: "institutional_decision",
      retainUntil: null,
    });
    const decision = evaluateRetention(record);
    assert.equal(decision.shouldRetain, true);
  });
});
