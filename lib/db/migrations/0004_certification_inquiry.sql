CREATE TABLE IF NOT EXISTS "CertificationInquiry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"institutionName" text NOT NULL,
	"contactName" text NOT NULL,
	"contactEmail" text NOT NULL,
	"sector" text,
	"tierRequested" varchar DEFAULT 'tier_1' NOT NULL,
	"context" text,
	"accessNeeds" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"approvedAt" timestamp,
	"approvedBy" text,
	"paymentConfirmedAt" timestamp,
	"rejectionReason" text,
	"chatId" uuid,
	"metadata" json DEFAULT '{}'::json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CertificationInquiry" ADD CONSTRAINT "CertificationInquiry_userId_User_id_fk"
   FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CertificationInquiry" ADD CONSTRAINT "CertificationInquiry_chatId_Chat_id_fk"
   FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
