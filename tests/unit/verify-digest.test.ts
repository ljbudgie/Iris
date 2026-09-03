/**
 * SHA-256 reasoning-digest verification tests.
 *
 * Integration Contract v2.0, core verification: `POST /verify` — verify
 * Burgess reasoning text against a SHA-256 digest.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import {
  isValidSha256Hex,
  sha256Hex,
  verifyReasoningDigest,
} from "../../lib/certification/verify-digest";

const REASONING =
  "The decision point was identified and a named officer reviewed the specific facts.";
const DIGEST = createHash("sha256").update(REASONING, "utf8").digest("hex");

describe("isValidSha256Hex", () => {
  it("accepts a 64-character hex digest", () => {
    assert.equal(isValidSha256Hex(DIGEST), true);
    assert.equal(isValidSha256Hex(DIGEST.toUpperCase()), true);
  });

  it("rejects malformed digests", () => {
    assert.equal(isValidSha256Hex("abc123"), false);
    assert.equal(isValidSha256Hex(`${DIGEST}00`), false);
    assert.equal(isValidSha256Hex("z".repeat(64)), false);
  });
});

describe("verifyReasoningDigest", () => {
  it("matches when the text produces the digest", () => {
    const result = verifyReasoningDigest(REASONING, DIGEST);
    assert.equal(result.match, true);
    assert.equal(result.algorithm, "SHA-256");
    assert.equal(result.computed_digest, DIGEST);
  });

  it("matches case-insensitively on the supplied digest", () => {
    assert.equal(
      verifyReasoningDigest(REASONING, DIGEST.toUpperCase()).match,
      true
    );
  });

  it("fails when the text was altered", () => {
    const result = verifyReasoningDigest(`${REASONING} (edited)`, DIGEST);
    assert.equal(result.match, false);
    assert.notEqual(result.computed_digest, DIGEST);
  });

  it("agrees with sha256Hex", () => {
    assert.equal(sha256Hex(REASONING), DIGEST);
  });
});
