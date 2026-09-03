/**
 * POST /api/verify
 *
 * Integration Contract v2.0 core verification endpoint. Verifies Burgess
 * reasoning text against a SHA-256 digest, so anyone holding a commitment
 * digest can check that a piece of reasoning is the one committed to —
 * digest-first, without moving the raw facts.
 */
import {
  isValidSha256Hex,
  verifyReasoningDigest,
} from "@/lib/certification/verify-digest";
import { IrisError } from "@/lib/errors";

type Body = {
  text?: string;
  digest?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new IrisError("bad_request:verify").toResponse();
  }

  if (typeof body.text !== "string" || typeof body.digest !== "string") {
    return new IrisError(
      "bad_request:verify",
      "Provide `text` (the reasoning) and `digest` (a SHA-256 hex digest)."
    ).toResponse();
  }

  if (!isValidSha256Hex(body.digest)) {
    return new IrisError(
      "bad_request:verify",
      "`digest` must be a 64-character SHA-256 hex digest."
    ).toResponse();
  }

  return Response.json(verifyReasoningDigest(body.text, body.digest));
}
