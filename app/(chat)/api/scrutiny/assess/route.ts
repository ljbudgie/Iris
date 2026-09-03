/**
 * POST /api/scrutiny/assess
 *
 * Integration Contract v2.0 core verification endpoint. Runs the
 * pre-decision Burgess gate before a system acts on an identified
 * individual; returns SOVEREIGN, NULL, or AMBIGUOUS with the required
 * next action.
 *
 * Advisory only. If the caller supplies an `attribution` block naming the
 * human reviewer, the response also includes the attributed finding.
 */

import { IrisError } from "@/lib/errors";
import { assessScrutiny, type ScrutinyInput } from "@/lib/scrutiny/assess";
import {
  attributeFinding,
  type ReviewerAttribution,
} from "@/lib/scrutiny/attribution";

type Body = ScrutinyInput & {
  attribution?: ReviewerAttribution;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new IrisError("bad_request:scrutiny").toResponse();
  }

  try {
    const assessment = assessScrutiny({
      namedOfficer: body.namedOfficer,
      role: body.role,
      reviewedSpecificFacts: body.reviewedSpecificFacts,
      adjustmentApplied: body.adjustmentApplied,
      liveProceedingChecked: body.liveProceedingChecked,
      recordedAndDisclosable: body.recordedAndDisclosable,
      processLanguage: body.processLanguage,
    });

    if (!body.attribution) {
      return Response.json(assessment);
    }

    const attributed = attributeFinding(assessment, body.attribution);
    return Response.json({ ...assessment, attributed });
  } catch (error) {
    const cause =
      error instanceof Error ? error.message : "Invalid scrutiny payload.";
    return new IrisError("bad_request:scrutiny", cause).toResponse();
  }
}
