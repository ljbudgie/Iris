import "server-only";

import { and, eq, isNull, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  accountabilityRecord,
  retentionAuditLog,
  type AccountabilityRecord,
} from "@/lib/db/schema";
import { retentionConfig } from "./config";
import { evaluateRetention } from "./policy";
import type {
  HoldType,
  RecordCategory,
  RetentionAction,
  RetentionReport,
} from "./types";

export { evaluateRetention } from "./policy";

// ---------------------------------------------------------------------------
// DB client (same pattern as lib/db/queries.ts)
// ---------------------------------------------------------------------------

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// ---------------------------------------------------------------------------
// Audit logging (all retention actions go here — immutable provenance trail)
// ---------------------------------------------------------------------------

async function writeAuditLog(params: {
  recordId: string;
  userId: string;
  action: RetentionAction;
  category: RecordCategory;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(retentionAuditLog).values({
    recordId: params.recordId,
    userId: params.userId,
    action: params.action,
    category: params.category,
    reason: params.reason ?? null,
    metadata: params.metadata ?? {},
  });
}

// ---------------------------------------------------------------------------
// Record creation
// ---------------------------------------------------------------------------

export async function createAccountabilityRecord(params: {
  userId: string;
  category: RecordCategory;
  title: string;
  content?: string;
  namedDecisionMaker?: string;
  decisionMakerRole?: string;
  institutionName?: string;
  sourceRef?: string;
  decisionDate?: Date;
  chatId?: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
}): Promise<AccountabilityRecord> {
  const policy = retentionConfig.policies[params.category];

  const retainUntil =
    policy.defaultDays !== null
      ? new Date(Date.now() + policy.defaultDays * 24 * 60 * 60 * 1000)
      : null;

  const onHold = policy.autoHoldOnCreate;
  const holdType: HoldType | null = onHold ? "accountability_hold" : null;

  const [record] = await db
    .insert(accountabilityRecord)
    .values({
      userId: params.userId,
      category: params.category,
      title: params.title,
      content: params.content ?? null,
      namedDecisionMaker: params.namedDecisionMaker ?? null,
      decisionMakerRole: params.decisionMakerRole ?? null,
      institutionName: params.institutionName ?? null,
      sourceRef: params.sourceRef ?? null,
      decisionDate: params.decisionDate ?? null,
      chatId: params.chatId ?? null,
      messageId: params.messageId ?? null,
      retainUntil,
      onHold,
      holdType,
      holdReason: onHold
        ? `Auto-hold applied at creation — category: ${params.category}`
        : null,
      holdAppliedAt: onHold ? new Date() : null,
      metadata: params.metadata ?? {},
    })
    .returning();

  await writeAuditLog({
    recordId: record.id,
    userId: params.userId,
    action: "created",
    category: params.category,
    reason: onHold
      ? `Record created with automatic accountability hold`
      : `Record created with ${policy.defaultDays}-day retention`,
    metadata: {
      namedDecisionMaker: params.namedDecisionMaker,
      institutionName: params.institutionName,
      sourceRef: params.sourceRef,
    },
  });

  return record;
}

// ---------------------------------------------------------------------------
// Hold management
// ---------------------------------------------------------------------------

export async function applyHold(params: {
  recordId: string;
  userId: string;
  holdType: HoldType;
  reason: string;
}): Promise<void> {
  const [record] = await db
    .select()
    .from(accountabilityRecord)
    .where(
      and(
        eq(accountabilityRecord.id, params.recordId),
        eq(accountabilityRecord.userId, params.userId),
      ),
    )
    .limit(1);

  if (!record) throw new Error(`Record ${params.recordId} not found`);

  await db
    .update(accountabilityRecord)
    .set({
      onHold: true,
      holdType: params.holdType,
      holdReason: params.reason,
      holdAppliedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(accountabilityRecord.id, params.recordId));

  await writeAuditLog({
    recordId: params.recordId,
    userId: params.userId,
    action: "hold_applied",
    category: record.category as RecordCategory,
    reason: params.reason,
    metadata: { holdType: params.holdType },
  });
}

export async function releaseHold(params: {
  recordId: string;
  userId: string;
  reason: string;
}): Promise<void> {
  const [record] = await db
    .select()
    .from(accountabilityRecord)
    .where(
      and(
        eq(accountabilityRecord.id, params.recordId),
        eq(accountabilityRecord.userId, params.userId),
      ),
    )
    .limit(1);

  if (!record) throw new Error(`Record ${params.recordId} not found`);

  const policy = retentionConfig.policies[record.category as RecordCategory];
  if (policy.requireHumanReviewBeforeDeletion) {
    // Releasing a hold on a high-value category still requires human approval
    // before actual deletion — the hold release is logged but does not
    // automatically permit purge.
  }

  await db
    .update(accountabilityRecord)
    .set({
      onHold: false,
      holdType: null,
      holdReason: null,
      updatedAt: new Date(),
    })
    .where(eq(accountabilityRecord.id, params.recordId));

  await writeAuditLog({
    recordId: params.recordId,
    userId: params.userId,
    action: "hold_released",
    category: record.category as RecordCategory,
    reason: params.reason,
  });
}

// ---------------------------------------------------------------------------
// Deletion gate — two-step: request then approve
// ---------------------------------------------------------------------------

/**
 * Step 1: Request deletion. For categories requiring human review this merely
 * marks the record and logs the intent — it does NOT purge anything.
 * For low-value categories (model_context, system_log) this can proceed to
 * immediate purge if no hold is active.
 */
export async function requestDeletion(params: {
  recordId: string;
  userId: string;
  reason: string;
}): Promise<{ requiresApproval: boolean; decision: RetentionDecision }> {
  const [record] = await db
    .select()
    .from(accountabilityRecord)
    .where(
      and(
        eq(accountabilityRecord.id, params.recordId),
        eq(accountabilityRecord.userId, params.userId),
      ),
    )
    .limit(1);

  if (!record) throw new Error(`Record ${params.recordId} not found`);

  const decision = evaluateRetention(record);

  if (decision.blockedBy === "legal_hold" || decision.blockedBy === "accountability_hold") {
    await writeAuditLog({
      recordId: params.recordId,
      userId: params.userId,
      action: "deletion_rejected",
      category: record.category as RecordCategory,
      reason: `Deletion blocked: ${decision.reason}`,
    });
    return { requiresApproval: true, decision };
  }

  const policy = retentionConfig.policies[record.category as RecordCategory];

  await db
    .update(accountabilityRecord)
    .set({
      markedForDeletion: true,
      deletionRequestedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(accountabilityRecord.id, params.recordId));

  await writeAuditLog({
    recordId: params.recordId,
    userId: params.userId,
    action: "deletion_requested",
    category: record.category as RecordCategory,
    reason: params.reason,
    metadata: { requiresHumanApproval: policy.requireHumanReviewBeforeDeletion },
  });

  return {
    requiresApproval: policy.requireHumanReviewBeforeDeletion,
    decision,
  };
}

/**
 * Step 2: Approve deletion. This is the human review gate — the point at which
 * a named human (the user) explicitly approves the purge. Only after this call
 * is the record eligible for physical deletion.
 */
export async function approveDeletion(params: {
  recordId: string;
  userId: string;
  approvalNote: string;
}): Promise<void> {
  const [record] = await db
    .select()
    .from(accountabilityRecord)
    .where(
      and(
        eq(accountabilityRecord.id, params.recordId),
        eq(accountabilityRecord.userId, params.userId),
      ),
    )
    .limit(1);

  if (!record) throw new Error(`Record ${params.recordId} not found`);
  if (!record.markedForDeletion) {
    throw new Error(`Record ${params.recordId} has not been requested for deletion`);
  }
  if (record.onHold) {
    throw new Error(`Record ${params.recordId} is on hold and cannot be deleted`);
  }

  await db
    .update(accountabilityRecord)
    .set({ deletionApprovedAt: new Date(), updatedAt: new Date() })
    .where(eq(accountabilityRecord.id, params.recordId));

  await writeAuditLog({
    recordId: params.recordId,
    userId: params.userId,
    action: "deletion_approved",
    category: record.category as RecordCategory,
    reason: params.approvalNote,
    metadata: {
      namedDecisionMaker: record.namedDecisionMaker,
      institutionName: record.institutionName,
      sourceRef: record.sourceRef,
    },
  });

  // Physical deletion — only reached after explicit human approval
  await db
    .delete(accountabilityRecord)
    .where(eq(accountabilityRecord.id, params.recordId));
}

// ---------------------------------------------------------------------------
// Batch policy sweep — call on a schedule to identify eligible records
// ---------------------------------------------------------------------------

/**
 * Sweeps all records for a user and returns those eligible for deletion.
 * Does NOT delete anything — produces a list for human review or auto-purge
 * of low-value categories.
 */
export async function sweepExpiredRecords(userId: string): Promise<
  Array<{
    record: AccountabilityRecord;
    decision: RetentionDecision;
  }>
> {
  const now = new Date();

  // Fetch records where retainUntil is in the past or null (indefinite checked in evaluateRetention)
  const candidates = await db
    .select()
    .from(accountabilityRecord)
    .where(
      and(
        eq(accountabilityRecord.userId, userId),
        eq(accountabilityRecord.onHold, false),
        eq(accountabilityRecord.markedForDeletion, false),
        or(
          lt(accountabilityRecord.retainUntil, now),
          isNull(accountabilityRecord.retainUntil),
        ),
      ),
    );

  return candidates
    .map((record) => ({ record, decision: evaluateRetention(record, now) }))
    .filter(({ decision }) => !decision.shouldRetain);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportRecords(params: {
  userId: string;
  category?: RecordCategory;
}): Promise<AccountabilityRecord[]> {
  const conditions = [eq(accountabilityRecord.userId, params.userId)];
  if (params.category) {
    conditions.push(eq(accountabilityRecord.category, params.category));
  }

  const records = await db
    .select()
    .from(accountabilityRecord)
    .where(and(...conditions));

  // Log the export for provenance
  await Promise.all(
    records.map((r) =>
      writeAuditLog({
        recordId: r.id,
        userId: params.userId,
        action: "exported",
        category: r.category as RecordCategory,
        reason: `Exported by user${params.category ? ` — category filter: ${params.category}` : ""}`,
      }),
    ),
  );

  return records;
}

// ---------------------------------------------------------------------------
// Retention report
// ---------------------------------------------------------------------------

export async function generateRetentionReport(
  userId: string,
): Promise<RetentionReport> {
  const now = new Date();

  const records = await db
    .select()
    .from(accountabilityRecord)
    .where(eq(accountabilityRecord.userId, userId));

  const byCategory = Object.fromEntries(
    ["institutional_decision", "accountability_evidence", "personal_sensitive", "model_context", "system_log"].map(
      (cat) => [
        cat,
        {
          total: 0,
          onHold: 0,
          pendingDeletion: 0,
          expiredRetention: 0,
        },
      ],
    ),
  ) as RetentionReport["byCategory"];

  const recordsRequiringReview: RetentionReport["recordsRequiringReview"] = [];

  for (const record of records) {
    const cat = record.category as RecordCategory;
    byCategory[cat].total++;
    if (record.onHold) byCategory[cat].onHold++;
    if (record.markedForDeletion) byCategory[cat].pendingDeletion++;

    const decision = evaluateRetention(record, now);
    if (!decision.shouldRetain || decision.requiresHumanApproval) {
      if (record.retainUntil && record.retainUntil < now) {
        byCategory[cat].expiredRetention++;
      }
      if (decision.requiresHumanApproval) {
        recordsRequiringReview.push({
          id: record.id,
          category: cat,
          title: record.title,
          createdAt: record.createdAt,
          retainUntil: record.retainUntil,
          holdType: record.holdType as HoldType | null,
        });
      }
    }
  }

  return {
    generatedAt: now,
    userId,
    totalRecords: records.length,
    byCategory,
    recordsRequiringReview,
  };
}
