/**
 * /api/certify
 *
 * GET  — list pending certification inquiries (founder only)
 * POST — approve or reject an inquiry (founder only)
 *
 * "Founder only" means the authenticated user's email must match
 * FOUNDER_EMAIL env var. This is the human gate — Lewis approves
 * every certification application personally.
 */

import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  approveCertificationInquiry,
  getCertificationInquiryById,
  listPendingCertificationInquiries,
  rejectCertificationInquiry,
} from "@/lib/db/queries";
import { appendCertifiedPartnerToRegister } from "@/lib/certify/github-append";
import { publishCertifiedPartnerToFramer } from "@/lib/certify/framer-publish";
import { IrisError } from "@/lib/errors";

const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL ?? "lewisjames@theburgessprinciple.com";

async function assertFounder(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id || session.user.email !== FOUNDER_EMAIL) {
    throw new IrisError("unauthorized:certify", "Founder access required.");
  }
  return session.user.email;
}

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  inquiryId: z.string().uuid(),
  rejectionReason: z.string().max(1000).optional(),
  /** Override the certified date (defaults to today). */
  certifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sovereignScore: z.string().optional(),
  caseStudyUrl: z.string().url().optional(),
});

/**
 * GET /api/certify
 *
 * Returns all pending certification inquiries so Lewis can review them.
 */
export async function GET() {
  try {
    const founderEmail = await assertFounder();
    const inquiries = await listPendingCertificationInquiries();
    return Response.json(
      { founderEmail, count: inquiries.length, inquiries },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof IrisError) return err.toResponse();
    throw err;
  }
}

/**
 * POST /api/certify
 *
 * Approve or reject a certification inquiry.
 *
 * On approve:
 *   1. Marks the inquiry as approved in the DB (human gate — SOVEREIGN moment).
 *   2. Appends a new SOVEREIGN row to institutional_register.csv via GitHub API.
 *   3. Publishes a new item to the Framer CMS "Certified Partners" collection.
 *
 * Steps 2 and 3 are best-effort: a failure in either does NOT roll back the DB
 * approval, but the error is returned in the response so Lewis can retry manually.
 */
export async function POST(request: Request) {
  let founderEmail: string;
  try {
    founderEmail = await assertFounder();
  } catch (err) {
    if (err instanceof IrisError) return err.toResponse();
    throw err;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError("bad_request:certify", "Invalid JSON body.").toResponse();
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { code: "bad_request:certify", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action, inquiryId, rejectionReason, certifiedDate, sovereignScore, caseStudyUrl } =
    parsed.data;

  const inquiry = await getCertificationInquiryById({ id: inquiryId });
  if (!inquiry) {
    return new IrisError("not_found:certify", "Inquiry not found.").toResponse();
  }
  if (inquiry.status !== "pending") {
    return Response.json(
      { code: "conflict:certify", message: `Inquiry is already ${inquiry.status}.` },
      { status: 409 }
    );
  }

  // ── REJECT path ────────────────────────────────────────────────────────────
  if (action === "reject") {
    const updated = await rejectCertificationInquiry({
      id: inquiryId,
      approvedBy: founderEmail,
      reason: rejectionReason,
    });
    return Response.json({ action: "rejected", inquiry: updated }, { status: 200 });
  }

  // ── APPROVE path ───────────────────────────────────────────────────────────
  // Step 1: Mark approved in DB (the human gate — this is the SOVEREIGN moment).
  const approved = await approveCertificationInquiry({
    id: inquiryId,
    approvedBy: founderEmail,
  });

  const today = new Date().toISOString().slice(0, 10);
  const resolvedDate = certifiedDate ?? today;
  const tier = inquiry.tierRequested === "tier_2" ? "Tier 2" : "Tier 1";

  const partnerRow = {
    institution: inquiry.institutionName,
    sector: inquiry.sector ?? "Unknown",
    tier,
    certifiedDate: resolvedDate,
    sovereignScore: sovereignScore ?? "",
    status: `${tier} Burgess Principle certification granted ${resolvedDate}.`,
    keyReference: `Inquiry ${inquiryId}`,
  };

  // Step 2: Append to institutional_register.csv via GitHub API (best-effort).
  let githubResult: { commitSha: string; url: string } | null = null;
  let githubError: string | null = null;
  try {
    githubResult = await appendCertifiedPartnerToRegister(partnerRow, inquiryId);
  } catch (err) {
    githubError = err instanceof Error ? err.message : String(err);
  }

  // Step 3: Publish to Framer CMS (best-effort; gracefully skips if env not set).
  let framerResult: { itemId: string | null; skipped: boolean; reason?: string } | null = null;
  let framerError: string | null = null;
  try {
    framerResult = await publishCertifiedPartnerToFramer({
      name: inquiry.institutionName,
      sector: inquiry.sector ?? "Unknown",
      tier,
      certifiedDate: resolvedDate,
      sovereignScore,
      caseStudyUrl,
    });
  } catch (err) {
    framerError = err instanceof Error ? err.message : String(err);
  }

  return Response.json(
    {
      action: "approved",
      inquiry: approved,
      github: githubError
        ? { success: false, error: githubError }
        : { success: true, ...githubResult },
      framer: framerError
        ? { success: false, error: framerError }
        : { success: true, ...framerResult },
      message:
        githubError || framerError
          ? "Certification approved in database but one or more downstream steps failed — see github/framer fields for details."
          : "Certification fully approved: database updated, register committed, site updated.",
    },
    { status: 200 }
  );
}
