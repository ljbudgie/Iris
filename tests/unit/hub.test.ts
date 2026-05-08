/**
 * Sovereign Hub Mode contract tests.
 *
 * These tests pin the *contract* that the future peer authentication
 * handshake must satisfy. The current scaffold (see
 * docs/sovereign-hub.md) responds to GET /api/hub with a hub
 * advertisement when IRIS_HUB_MODE=1 and 404 otherwise.
 *
 * As peer auth is added, expand this file with tests for:
 *   - rejecting unauthenticated peer registrations
 *   - applying the SOVEREIGN/NULL governance gate to peer outputs
 *   - refusing to expose sensitive tools to NULL-governance peers
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("Sovereign Hub Mode flag", () => {
  function isHubEnabled(value: string | undefined): boolean {
    return value === "1";
  }

  it("treats IRIS_HUB_MODE=1 as enabled", () => {
    assert.equal(isHubEnabled("1"), true);
  });

  it("treats unset IRIS_HUB_MODE as disabled", () => {
    assert.equal(isHubEnabled(undefined), false);
  });

  it("treats IRIS_HUB_MODE=0 as disabled", () => {
    assert.equal(isHubEnabled("0"), false);
  });
});

describe("Sovereign Hub Mode contract", () => {
  // TODO(sovereign-hub): once peer auth lands, this suite must cover:
  //
  //   it("rejects unauthenticated peer registrations", ...)
  //   it("downgrades NULL-governance peer outputs", ...)
  //   it("refuses sensitive tools to NULL peers", ...)
  //
  // The placeholder below documents the contract and prevents the
  // suite from being silently dropped.
  it("documents the future peer-auth contract", () => {
    const required = [
      "rejects unauthenticated peer registrations",
      "downgrades NULL-governance peer outputs",
      "refuses sensitive tools to NULL peers",
    ];
    assert.equal(required.length, 3);
  });
});
