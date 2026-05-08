ALTER TABLE "ChatAuditLog" ADD COLUMN IF NOT EXISTS "personGateCommitment" text;
--> statement-breakpoint
ALTER TABLE "ChatAuditLog" ADD COLUMN IF NOT EXISTS "decisionReason" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AssistantTask" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"chatId" uuid,
	"title" text NOT NULL,
	"notes" text,
	"category" varchar DEFAULT 'task' NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"dueAt" timestamp,
	"metadata" json DEFAULT '{}'::json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AssistantTask" ADD CONSTRAINT "AssistantTask_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AssistantTask" ADD CONSTRAINT "AssistantTask_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
