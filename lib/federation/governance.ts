import type { ProviderResponse } from "./types";

/**
 * UK Certification Mark reference for The Burgess Principle governance.
 */
export const CERTIFICATION_MARK = "UK00004343685";

/**
 * SOVEREIGN/NULL Gate
 *
 * Before any provider response reaches the user it must pass through this
 * gate.  A response is considered SOVEREIGN only when a human mind has been
 * applied to this specific output for this specific user.  Everything else
 * is NULL and must be flagged for human review.
 *
 * In this initial scaffold the gate performs a status check; later it can be
 * extended to integrate with a human-review queue.
 */
export function applyGovernanceGate(
  response: ProviderResponse
): ProviderResponse {
  if (response.governanceStatus !== "SOVEREIGN") {
    return {
      ...response,
      governanceStatus: "NULL",
    };
  }
  return response;
}

/**
 * Check whether a set of responses is safe to deliver directly (all
 * SOVEREIGN) or whether any need human review (at least one NULL).
 */
export function evaluateResponses(responses: ProviderResponse[]): {
  approved: ProviderResponse[];
  pendingReview: ProviderResponse[];
} {
  const approved: ProviderResponse[] = [];
  const pendingReview: ProviderResponse[] = [];

  for (const response of responses) {
    const gated = applyGovernanceGate(response);
    if (gated.governanceStatus === "SOVEREIGN") {
      approved.push(gated);
    } else {
      pendingReview.push(gated);
    }
  }

  return { approved, pendingReview };
}
