/**
 * Pure retention policy engine — no DB, no server-only.
 * Safe to import in both server and unit-test contexts.
 */

import { retentionConfig } from "./config";
import type { HoldType, RecordCategory, RetentionDecision } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

interface PolicyRecord {
  category: string;
  onHold: boolean;
  holdType: string | null;
  holdReason: string | null;
  retainUntil: Date | null;
  createdAt: Date;
}

/**
 * Determines whether a record should be retained, and why.
 * This is the binary gate: SOVEREIGN (must keep) or NULL (may purge).
 *
 * Pure function — no side effects, no DB access.
 */
export function evaluateRetention(
  record: PolicyRecord,
  now = new Date(),
): RetentionDecision {
  // Active hold always blocks deletion regardless of retention period
  if (record.onHold && record.holdType) {
    return {
      shouldRetain: true,
      reason: `Record is on ${record.holdType}: ${record.holdReason ?? "no reason recorded"}`,
      blockedBy: record.holdType as HoldType,
      requiresHumanApproval: true,
    };
  }

  const policy = retentionConfig.policies[record.category as RecordCategory];

  // Indefinite retention (defaultDays: null)
  if (policy.defaultDays === null) {
    return {
      shouldRetain: true,
      reason: `Category "${record.category}" is retained indefinitely by policy`,
      blockedBy: "policy",
      requiresHumanApproval: policy.requireHumanReviewBeforeDeletion,
    };
  }

  // Explicit retainUntil overrides the policy-derived period
  const expiryDate =
    record.retainUntil ??
    new Date(record.createdAt.getTime() + policy.defaultDays * DAY_MS);

  if (now < expiryDate) {
    return {
      shouldRetain: true,
      reason: `Retention period has not expired (expires ${expiryDate.toISOString()})`,
      blockedBy: "policy",
      requiresHumanApproval: false,
    };
  }

  // Retention period expired — but human approval may still be required
  if (policy.requireHumanReviewBeforeDeletion) {
    return {
      shouldRetain: true,
      reason: `Retention period expired but human review is required before deletion`,
      blockedBy: "policy",
      requiresHumanApproval: true,
    };
  }

  return {
    shouldRetain: false,
    reason: `Retention period expired and no human review required`,
    blockedBy: null,
    requiresHumanApproval: false,
  };
}
