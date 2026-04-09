/**
 * Cryptographic commitment utilities for PersonGate.
 *
 * Uses SHA-256 to create commitments from personal facts.  The commitment
 * can be sent to external systems as proof that facts exist without
 * revealing the facts themselves.
 */

import { CERTIFICATION_MARK } from "@/lib/federation/governance";
import type { Commitment, Receipt } from "./types";

/**
 * Generate a SHA-256 hash of the given content.
 * Uses the Web Crypto API (available in Node 18+ and all modern runtimes).
 */
export async function sha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a cryptographic commitment from user facts.
 *
 * The commitment includes the user ID and a timestamp to ensure
 * uniqueness even if the same facts are committed at different times.
 */
export async function createCommitment({
  facts,
  vaultRecordId,
  userId,
}: {
  facts: string;
  vaultRecordId: string;
  userId: string;
}): Promise<Commitment> {
  const timestamp = new Date().toISOString();

  // Hash includes userId + timestamp + facts for uniqueness
  const payload = `${userId}:${timestamp}:${facts}`;
  const hash = await sha256(payload);

  return {
    hash,
    vaultRecordId,
    userId,
    timestamp,
    certificationMark: CERTIFICATION_MARK,
  };
}

/**
 * Validate that a receipt matches its expected commitment.
 *
 * Returns true only if the receipt's commitment hash matches
 * the commitment that was sent.
 */
export function validateReceipt(
  receipt: Receipt,
  commitment: Commitment
): boolean {
  return receipt.commitmentHash === commitment.hash;
}
