import "server-only";
import { tool } from "ai";
import { z } from "zod";
import type { Session } from "next-auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { certificationInquiry } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL ?? "");
const db = drizzle(client);

const CERTIFICATION_URL = "https://certify.theburgessprinciple.com";

export type SubmitCertificationInquiryProps = {
  session: Session | null;
  chatId?: string;
};

export const submitCertificationInquiry = ({
  session,
  chatId,
}: SubmitCertificationInquiryProps) =>
  tool({
    description:
      "Submit a Burgess Principle certification inquiry on behalf of an institution that wants to " +
      "become certified. Use ONLY when you have collected all required fields from the institution's " +
      "representative during conversation: institution name, contact name, contact email, and tier. " +
      "Always ask about access or communication needs BEFORE submitting — this is an anticipatory duty " +
      "requirement under the Equality Act 2010. Do NOT submit if any required field is missing — " +
      "collect them conversationally first.",
    inputSchema: z.object({
      institutionName: z
        .string()
        .min(2)
        .describe("Full legal name of the institution applying for certification."),
      contactName: z
        .string()
        .min(2)
        .describe("Full name of the person making this inquiry."),
      contactEmail: z
        .string()
        .email()
        .describe("Email address for certification correspondence."),
      sector: z
        .string()
        .optional()
        .describe(
          "Sector the institution operates in (e.g. Local Government, NHS, Financial Services, Legal Services)."
        ),
      tierRequested: z
        .enum(["tier_1", "tier_2"])
        .default("tier_1")
        .describe(
          "Tier 1 = standard Burgess Principle certification. " +
            "Tier 2 = commercial/sales partner relationship."
        ),
      context: z
        .string()
        .optional()
        .describe(
          "Any additional context the institution has provided — why they want certification, " +
            "what processes they want to certify, specific concerns."
        ),
      accessNeeds: z
        .string()
        .optional()
        .describe(
          "Any access or communication needs declared by the contact person " +
            "(e.g. email-only, BSL interpretation, large print). " +
            "Always ask before submitting — anticipatory duty under EA 2010."
        ),
    }),
    execute: async ({
      institutionName,
      contactName,
      contactEmail,
      sector,
      tierRequested,
      context,
      accessNeeds,
    }) => {
      const [inquiry] = await db
        .insert(certificationInquiry)
        .values({
          userId: session?.user?.id ?? undefined,
          institutionName,
          contactName,
          contactEmail,
          sector: sector ?? null,
          tierRequested,
          context: context ?? null,
          accessNeeds: accessNeeds ?? null,
          status: "pending",
          chatId: chatId ?? undefined,
          metadata: {
            submittedVia: "iris-chat",
            submittedAt: new Date().toISOString(),
          },
        })
        .returning();

      return {
        success: true,
        inquiryId: inquiry.id,
        institutionName,
        contactName,
        contactEmail,
        tierRequested,
        accessNeedsRecorded: !!accessNeeds,
        status: "pending",
        message:
          `Certification inquiry submitted for ${institutionName}. ` +
          `Reference: ${inquiry.id}. ` +
          `Lewis will personally review this and respond in writing. ` +
          `Next step: visit ${CERTIFICATION_URL} to find out more about what certification involves.`,
        certificationUrl: CERTIFICATION_URL,
        nextSteps: [
          `Visit ${CERTIFICATION_URL} to read about the certification process and tiers.`,
          "Lewis (or a named Burgess Principle representative) will review your inquiry and make contact in writing.",
          accessNeeds
            ? `Your access need (${accessNeeds}) has been recorded and will be applied to all correspondence.`
            : "If you have any access or communication needs, please mention them and they will be recorded.",
          "Certification is not automatic — a named human reviews every application.",
        ],
      };
    },
  });
