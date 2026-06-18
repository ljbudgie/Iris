CREATE TABLE IF NOT EXISTS "AccountabilityRecord" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"category" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"namedDecisionMaker" text,
	"decisionMakerRole" text,
	"institutionName" text,
	"sourceRef" text,
	"decisionDate" timestamp,
	"chatId" uuid,
	"messageId" uuid,
	"retainUntil" timestamp,
	"onHold" boolean DEFAULT false NOT NULL,
	"holdType" varchar,
	"holdReason" text,
	"holdAppliedAt" timestamp,
	"markedForDeletion" boolean DEFAULT false NOT NULL,
	"deletionRequestedAt" timestamp,
	"deletionApprovedAt" timestamp,
	"metadata" json DEFAULT '{}'::json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "RetentionAuditLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recordId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"action" varchar NOT NULL,
	"category" varchar NOT NULL,
	"reason" text,
	"metadata" json DEFAULT '{}'::json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AccountabilityRecord" ADD CONSTRAINT "AccountabilityRecord_userId_User_id_fk"
   FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AccountabilityRecord" ADD CONSTRAINT "AccountabilityRecord_chatId_Chat_id_fk"
   FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "RetentionAuditLog" ADD CONSTRAINT "RetentionAuditLog_userId_User_id_fk"
   FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
