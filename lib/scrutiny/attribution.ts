/**
 * Named-human attribution for advisory Burgess findings.
 *
 * Integration Contract v2.0, "Advisory-only" principle: no integration may
 * autonomously issue a SOVEREIGN or NULL classification. Every advisory
 * classification stays advisory until a named human — a specific person with
 * a role, not "the team" — attributes the finding. This module is the single
 * place where that attribution is validated and recorded.
 */

import type { ScrutinyAssessment } from "@/lib/scrutiny/assess";

export type ReviewerAttribution = {
  name: string;
  role: string;
  /** ISO date of the review. Defaults to today when omitted. */
  reviewedAt?: string;
};

export type AttributedFinding = {
  classification: ScrutinyAssessment["classification"];
  missingLimbs: ScrutinyAssessment["missingLimbs"];
  nextAction: string;
  attribution: {
    name: string;
    role: string;
    reviewedAt: string;
  };
  advisory: false;
  requires_human_confirmation: false;
  disclaimer: string;
};

export const ATTRIBUTION_DISCLAIMER =
  "This finding was attributed by the named human recorded above. It does not constitute legal advice.";

/**
 * Collective or process language that does not name a specific human being.
 * The Burgess standard requires a named person, not a team or a category.
 */
const NOT_A_NAMED_HUMAN =
  /^(the\s+)?(team|staff|department|office|panel|board|committee|system|ai|bot|automation|customer\s+servi?ces?|management|admin(istration)?|organisation|organization|n\/?a|unknown|anonymous|automated(\s+process)?)$/i;

export function isNamedHuman(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return false;
  }
  return !NOT_A_NAMED_HUMAN.test(trimmed);
}

/**
 * Converts an advisory assessment into an attributed finding.
 *
 * Throws when the attribution does not identify a named human with a role —
 * the advisory result must not be promoted without one.
 */
export function attributeFinding(
  assessment: Pick<
    ScrutinyAssessment,
    "classification" | "missingLimbs" | "nextAction"
  >,
  reviewer: ReviewerAttribution
): AttributedFinding {
  const name = reviewer.name?.trim() ?? "";
  const role = reviewer.role?.trim() ?? "";

  if (!isNamedHuman(name)) {
    throw new Error(
      "Attribution requires a named human being — not a team, department, or automated process."
    );
  }

  if (!role) {
    throw new Error(
      "Attribution requires the reviewer's role so the finding is disclosable on request."
    );
  }

  const reviewedAt =
    reviewer.reviewedAt?.trim() || new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt)) {
    throw new Error("Attribution date must be an ISO date (YYYY-MM-DD).");
  }

  return {
    classification: assessment.classification,
    missingLimbs: assessment.missingLimbs,
    nextAction: assessment.nextAction,
    attribution: { name, role, reviewedAt },
    advisory: false,
    requires_human_confirmation: false,
    disclaimer: ATTRIBUTION_DISCLAIMER,
  };
}
