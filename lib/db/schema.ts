import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: text("name"),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const humanReviewRequest = pgTable("HumanReviewRequest", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  messageId: uuid("messageId")
    .notNull()
    .references(() => message.id),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  reason: text("reason"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  reviewComment: text("reviewComment"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  resolvedAt: timestamp("resolvedAt"),
});

export type HumanReviewRequest = InferSelectModel<typeof humanReviewRequest>;

export const chatAuditLog = pgTable("ChatAuditLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  messageId: uuid("messageId"),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  /** The model used for this turn. */
  modelId: varchar("modelId", { length: 128 }),
  /** Number of prompt tokens consumed. */
  promptTokens: integer("promptTokens").notNull().default(0),
  /** Number of completion tokens consumed. */
  completionTokens: integer("completionTokens").notNull().default(0),
  /** Total tokens consumed in this turn. */
  totalTokens: integer("totalTokens").notNull().default(0),
  /** Tool names invoked during this turn, stored as JSON array. */
  toolsInvoked: json("toolsInvoked").$type<string[]>().default([]),
  /** Governance status at time of response. */
  governanceStatus: varchar("governanceStatus", {
    enum: ["SOVEREIGN", "NULL"],
  }),
  /** PersonGate SHA-256 commitment when personal facts were handled. */
  personGateCommitment: text("personGateCommitment"),
  /** Plain-English routing or quality note for the turn. */
  decisionReason: text("decisionReason"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type ChatAuditLog = InferSelectModel<typeof chatAuditLog>;

export const assistantTask = pgTable("AssistantTask", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  chatId: uuid("chatId").references(() => chat.id),
  title: text("title").notNull(),
  notes: text("notes"),
  category: varchar("category", {
    enum: ["task", "reminder", "case", "goal", "contact"],
  })
    .notNull()
    .default("task"),
  status: varchar("status", {
    enum: ["open", "done", "archived"],
  })
    .notNull()
    .default("open"),
  dueAt: timestamp("dueAt"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type AssistantTask = InferSelectModel<typeof assistantTask>;

// ---------------------------------------------------------------------------
// Certification Inquiries
// ---------------------------------------------------------------------------

export const certificationInquiry = pgTable("CertificationInquiry", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  /** Optional — anonymous inquiries are allowed at intake stage. */
  userId: uuid("userId").references(() => user.id),
  institutionName: text("institutionName").notNull(),
  contactName: text("contactName").notNull(),
  contactEmail: text("contactEmail").notNull(),
  sector: text("sector"),
  /** Tier 1 = standard certification. Tier 2 = sales/commercial partner. */
  tierRequested: varchar("tierRequested", { enum: ["tier_1", "tier_2"] })
    .notNull()
    .default("tier_1"),
  /** Free-text context provided by the institution during intake. */
  context: text("context"),
  /** Access/communication needs declared at intake (anticipatory duty). */
  accessNeeds: text("accessNeeds"),
  status: varchar("status", {
    enum: ["pending", "approved", "rejected", "withdrawn"],
  })
    .notNull()
    .default("pending"),
  /** Set when Lewis approves — this is the human gate. */
  approvedAt: timestamp("approvedAt"),
  approvedBy: text("approvedBy"),
  /** Set when payment confirmed. */
  paymentConfirmedAt: timestamp("paymentConfirmedAt"),
  rejectionReason: text("rejectionReason"),
  /** Optional chat link so Lewis can review the intake conversation. */
  chatId: uuid("chatId").references(() => chat.id),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type CertificationInquiry = InferSelectModel<typeof certificationInquiry>;

// ---------------------------------------------------------------------------
// Accountability & Data Retention
// ---------------------------------------------------------------------------

export const accountabilityRecord = pgTable("AccountabilityRecord", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  category: varchar("category", {
    enum: [
      "institutional_decision",
      "accountability_evidence",
      "personal_sensitive",
      "model_context",
      "system_log",
    ],
  }).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  /** Name of the specific individual who made the decision (SOVEREIGN test anchor). */
  namedDecisionMaker: text("namedDecisionMaker"),
  /** Role or title of the named decision-maker at time of decision. */
  decisionMakerRole: text("decisionMakerRole"),
  /** Institution name (e.g. Darlington Borough Council, Durham Constabulary). */
  institutionName: text("institutionName"),
  /** External reference (complaint ref, FOI ref, collar number, PCN reference, etc.). */
  sourceRef: text("sourceRef"),
  /** Date the institutional decision was made (may differ from record creation date). */
  decisionDate: timestamp("decisionDate"),
  /** Optional link to the originating chat session. */
  chatId: uuid("chatId").references(() => chat.id),
  /** Optional link to the specific message that created this record. */
  messageId: uuid("messageId"),
  /** Date after which the record may be considered for deletion. null = indefinite. */
  retainUntil: timestamp("retainUntil"),
  /** Whether any active hold is blocking deletion. */
  onHold: boolean("onHold").notNull().default(false),
  holdType: varchar("holdType", {
    enum: ["legal_hold", "accountability_hold", "user_hold"],
  }),
  holdReason: text("holdReason"),
  holdAppliedAt: timestamp("holdAppliedAt"),
  /** Whether the user has requested deletion (must be approved before purge). */
  markedForDeletion: boolean("markedForDeletion").notNull().default(false),
  deletionRequestedAt: timestamp("deletionRequestedAt"),
  /** Set only after explicit human approval gate is passed. */
  deletionApprovedAt: timestamp("deletionApprovedAt"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type AccountabilityRecord = InferSelectModel<
  typeof accountabilityRecord
>;

/**
 * Immutable audit log for all retention actions.
 * Intentionally does NOT foreign-key to AccountabilityRecord so the log
 * survives record deletion and provides a complete provenance chain.
 */
export const retentionAuditLog = pgTable("RetentionAuditLog", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  /** ID of the affected AccountabilityRecord (not FK — log outlives records). */
  recordId: uuid("recordId").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  action: varchar("action", {
    enum: [
      "created",
      "hold_applied",
      "hold_released",
      "deletion_requested",
      "deletion_approved",
      "deletion_rejected",
      "exported",
      "policy_checked",
    ],
  }).notNull(),
  category: varchar("category", {
    enum: [
      "institutional_decision",
      "accountability_evidence",
      "personal_sensitive",
      "model_context",
      "system_log",
    ],
  }).notNull(),
  reason: text("reason"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type RetentionAuditLog = InferSelectModel<typeof retentionAuditLog>;
