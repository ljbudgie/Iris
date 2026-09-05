/**
 * Cryptographic request receipt.
 *
 * A receipt records what actually ran for one Iris turn: requested model,
 * model that answered, tokens, tools, governance status, and any PersonGate
 * commitment. Pricing is not part of the receipt — the digest is.
 *
 * Digest-first: SHA-256 over a canonical JSON payload. Anyone holding the
 * receipt can check it without the raw prompt text.
 *
 * Advisory only. A named human must still attribute any certified finding.
 */
import { sha256Hex } from "@/lib/certification/verify-digest";

export const REQUEST_RECEIPT_DISCLAIMER =
  "Advisory request receipt. This records what ran. It is not a certified Burgess finding and it is not an invoice.";

export type RequestReceiptInput = {
  requested_model_id: string;
  actual_model_id: string;
  did_fallback: boolean;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  tools_invoked?: string[];
  governance_status?: "SOVEREIGN" | "NULL";
  person_gate_commitment?: string | null;
  issued_at?: string;
};

export type RequestReceiptPayload = {
  schema_version: 1;
  requested_model_id: string;
  actual_model_id: string;
  did_fallback: boolean;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  tools_invoked: string[];
  governance_status: "SOVEREIGN" | "NULL";
  person_gate_commitment: string | null;
  issued_at: string;
};

export type RequestReceipt = RequestReceiptPayload & {
  digest: string;
  algorithm: "SHA-256";
  advisory: true;
  requires_human_confirmation: true;
  disclaimer: string;
};

function nonNegativeInt(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number.`);
  }
  return Math.floor(value);
}

export function buildReceiptPayload(
  input: RequestReceiptInput
): RequestReceiptPayload {
  const requested = input.requested_model_id?.trim();
  const actual = input.actual_model_id?.trim();
  if (!requested) {
    throw new Error("requested_model_id is required.");
  }
  if (!actual) {
    throw new Error("actual_model_id is required.");
  }

  const issuedAt = input.issued_at?.trim() || new Date().toISOString();
  if (Number.isNaN(Date.parse(issuedAt))) {
    throw new Error("issued_at must be an ISO timestamp.");
  }

  const tools = [...(input.tools_invoked ?? [])]
    .map((name) => name.trim())
    .filter(Boolean)
    .sort();

  return {
    schema_version: 1,
    requested_model_id: requested,
    actual_model_id: actual,
    did_fallback: Boolean(input.did_fallback),
    prompt_tokens: nonNegativeInt(input.prompt_tokens, "prompt_tokens"),
    completion_tokens: nonNegativeInt(
      input.completion_tokens,
      "completion_tokens"
    ),
    total_tokens: nonNegativeInt(input.total_tokens, "total_tokens"),
    tools_invoked: tools,
    governance_status: input.governance_status === "NULL" ? "NULL" : "SOVEREIGN",
    person_gate_commitment: input.person_gate_commitment?.trim() || null,
    issued_at: issuedAt,
  };
}

/** Stable JSON: sorted keys, no extra whitespace. */
export function canonicalReceiptJson(payload: RequestReceiptPayload): string {
  const ordered: RequestReceiptPayload = {
    actual_model_id: payload.actual_model_id,
    completion_tokens: payload.completion_tokens,
    did_fallback: payload.did_fallback,
    governance_status: payload.governance_status,
    issued_at: payload.issued_at,
    person_gate_commitment: payload.person_gate_commitment,
    prompt_tokens: payload.prompt_tokens,
    requested_model_id: payload.requested_model_id,
    schema_version: 1,
    tools_invoked: [...payload.tools_invoked].sort(),
    total_tokens: payload.total_tokens,
  };
  return JSON.stringify(ordered);
}

export function digestReceiptPayload(payload: RequestReceiptPayload): string {
  return sha256Hex(canonicalReceiptJson(payload));
}

export function issueRequestReceipt(input: RequestReceiptInput): RequestReceipt {
  const payload = buildReceiptPayload(input);
  return {
    ...payload,
    digest: digestReceiptPayload(payload),
    algorithm: "SHA-256",
    advisory: true,
    requires_human_confirmation: true,
    disclaimer: REQUEST_RECEIPT_DISCLAIMER,
  };
}

export function verifyRequestReceipt(receipt: RequestReceipt): {
  match: boolean;
  algorithm: "SHA-256";
  computed_digest: string;
} {
  const {
    digest,
    algorithm,
    advisory,
    requires_human_confirmation,
    disclaimer,
    ...payload
  } = receipt;
  const computed = digestReceiptPayload(payload as RequestReceiptPayload);
  return {
    match: computed === digest.trim().toLowerCase(),
    algorithm: "SHA-256",
    computed_digest: computed,
  };
}
