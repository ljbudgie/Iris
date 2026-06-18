export const RECORD_CATEGORIES = [
  "institutional_decision",
  "accountability_evidence",
  "personal_sensitive",
  "model_context",
  "system_log",
] as const;

export type RecordCategory = (typeof RECORD_CATEGORIES)[number];

export const HOLD_TYPES = [
  "legal_hold",
  "accountability_hold",
  "user_hold",
] as const;

export type HoldType = (typeof HOLD_TYPES)[number];

export const RETENTION_ACTIONS = [
  "created",
  "hold_applied",
  "hold_released",
  "deletion_requested",
  "deletion_approved",
  "deletion_rejected",
  "exported",
  "policy_checked",
] as const;

export type RetentionAction = (typeof RETENTION_ACTIONS)[number];

export interface CategoryPolicy {
  /** Retention period in days. null = indefinite. */
  defaultDays: number | null;
  /** Whether a human must approve before deletion can proceed. */
  requireHumanReviewBeforeDeletion: boolean;
  /** Whether records in this category are placed on hold automatically at creation. */
  autoHoldOnCreate: boolean;
  /** Human-readable description for audit logs and reports. */
  description: string;
}

export interface RetentionConfig {
  policies: Record<RecordCategory, CategoryPolicy>;
}

export interface RetentionDecision {
  shouldRetain: boolean;
  reason: string;
  blockedBy: "legal_hold" | "accountability_hold" | "user_hold" | "policy" | null;
  requiresHumanApproval: boolean;
}

export interface RetentionReport {
  generatedAt: Date;
  userId: string;
  totalRecords: number;
  byCategory: Record<
    RecordCategory,
    {
      total: number;
      onHold: number;
      pendingDeletion: number;
      expiredRetention: number;
    }
  >;
  recordsRequiringReview: Array<{
    id: string;
    category: RecordCategory;
    title: string;
    createdAt: Date;
    retainUntil: Date | null;
    holdType: HoldType | null;
  }>;
}
