/**
 * /api/challenges
 *
 * GET  — list the statutory challenge routes Iris can generate.
 * POST — generate a statutory challenge letter from a completed NULL or
 *        AMBIGUOUS Burgess certification record.
 *
 * The generated letter is advisory drafting help, not legal advice.
 */

import type { CertificationRecord } from "@/lib/certification/workflow";
import {
  buildChallengeRecord,
  CHALLENGE_ROUTES,
  type PreferredRemedy,
  type StatutoryChallengeType,
  todayIsoDate,
} from "@/lib/challenges/workflow";
import { IrisError } from "@/lib/errors";

type Body = {
  record?: CertificationRecord;
  challengeType?: StatutoryChallengeType;
  submissionDate?: string;
  institutionAddress?: string;
  preferredRemedy?: PreferredRemedy;
  reasonableAdjustmentEmailOnly?: boolean;
};

export function GET() {
  return Response.json({
    routes: CHALLENGE_ROUTES.map((route) => ({
      type: route.type,
      label: route.label,
      statutoryBasis: route.statutoryBasis,
      deadlineRule: route.deadlineRule,
    })),
  });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new IrisError("bad_request:challenges").toResponse();
  }

  if (!body.record || !body.challengeType) {
    return new IrisError(
      "bad_request:challenges",
      "Provide `record` (a completed certification record) and `challengeType`."
    ).toResponse();
  }

  try {
    const challenge = buildChallengeRecord({
      id: crypto.randomUUID(),
      record: body.record,
      challengeType: body.challengeType,
      submissionDate: body.submissionDate || todayIsoDate(),
      institutionAddress: body.institutionAddress ?? "",
      preferredRemedy: body.preferredRemedy ?? "compliance",
      reasonableAdjustmentEmailOnly:
        body.reasonableAdjustmentEmailOnly ?? false,
      createdAt: new Date().toISOString(),
    });
    return Response.json(challenge);
  } catch (error) {
    const cause =
      error instanceof Error ? error.message : "Invalid challenge payload.";
    return new IrisError("bad_request:challenges", cause).toResponse();
  }
}
