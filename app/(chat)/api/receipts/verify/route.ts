/**
 * POST /api/receipts/verify
 *
 * Check a request receipt against its SHA-256 digest.
 * Digest-first. No raw prompt text is required or accepted.
 */
import { IrisError } from "@/lib/errors";
import {
  verifyRequestReceipt,
  type RequestReceipt,
} from "@/lib/receipts";

export async function POST(request: Request) {
  let body: { receipt?: RequestReceipt };
  try {
    body = (await request.json()) as { receipt?: RequestReceipt };
  } catch {
    return new IrisError("bad_request:verify").toResponse();
  }

  if (!body.receipt || typeof body.receipt.digest !== "string") {
    return new IrisError(
      "bad_request:verify",
      "Provide `receipt` with a SHA-256 digest."
    ).toResponse();
  }

  try {
    return Response.json(verifyRequestReceipt(body.receipt));
  } catch (error) {
    const cause =
      error instanceof Error ? error.message : "Invalid receipt payload.";
    return new IrisError("bad_request:verify", cause).toResponse();
  }
}
