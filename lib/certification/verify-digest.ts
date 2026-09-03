/**
 * Verify Burgess reasoning text against a SHA-256 digest.
 *
 * Integration Contract v2.0, core verification: `POST /verify` — verify
 * Burgess reasoning text against a SHA-256 digest. Digest-first: commitments
 * and digests move before raw facts, so anyone holding the digest can check
 * that a piece of reasoning is the one that was committed to.
 */

import { createHash } from "node:crypto";

export type DigestVerification = {
  match: boolean;
  algorithm: "SHA-256";
  computed_digest: string;
};

const HEX_DIGEST = /^[0-9a-f]{64}$/i;

export function isValidSha256Hex(digest: string): boolean {
  return HEX_DIGEST.test(digest.trim());
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function verifyReasoningDigest(
  text: string,
  digest: string
): DigestVerification {
  const computed = sha256Hex(text);
  return {
    match: computed === digest.trim().toLowerCase(),
    algorithm: "SHA-256",
    computed_digest: computed,
  };
}
