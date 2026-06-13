/**
 * Unit tests for lib/ai/providers.resilient.ts
 *
 * These tests exercise getResilientLanguageModel and isProviderAvailabilityError
 * using a mock resolver injected via the second parameter, so no real network
 * calls are made. The Playwright env vars that trigger isTestEnvironment are
 * not set during `tsx --test`, so the full fallback logic is exercised.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getResilientLanguageModel,
  isProviderAvailabilityError,
} from "../../lib/ai/providers.resilient";

// A minimal stand-in for a LanguageModel — the resilience layer only checks
// whether resolve() succeeds or throws; it never calls into the model object.
const fakeModel = (id: string) =>
  ({ __fakeModelId: id }) as unknown as ReturnType<
    typeof import("../../lib/ai/providers.resilient").getLanguageModel
  >;

// ─────────────────────────────────────────────────────────────────────────
// isProviderAvailabilityError
// ─────────────────────────────────────────────────────────────────────────

describe("isProviderAvailabilityError", () => {
  it("returns true for availability-shaped messages", () => {
    const trueFor = [
      "503 Service Unavailable",
      "429 Too Many Requests",
      "rate limit exceeded",
      "model not found: claude-mythos-5",
      "This model has been withdrawn",
      "service unavailable at this time",
      "forbidden",
      "403 Access Denied",
      "access denied by export control policy",
      "no endpoints available",
      "529 overloaded",
    ];
    for (const msg of trueFor) {
      assert.equal(
        isProviderAvailabilityError(new Error(msg)),
        true,
        `expected true for: "${msg}"`
      );
    }
  });

  it("returns false for unrelated errors and non-Error values", () => {
    assert.equal(
      isProviderAvailabilityError(
        new Error("Cannot read properties of undefined (reading 'config')")
      ),
      false
    );
    assert.equal(
      isProviderAvailabilityError(new Error("SyntaxError: Unexpected token")),
      false
    );
    // Non-Error values should always return false
    assert.equal(isProviderAvailabilityError("just a string"), false);
    assert.equal(isProviderAvailabilityError(null), false);
    assert.equal(isProviderAvailabilityError(undefined), false);
    assert.equal(isProviderAvailabilityError(42), false);
    assert.equal(isProviderAvailabilityError({ message: "rate limit" }), false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getResilientLanguageModel
// ─────────────────────────────────────────────────────────────────────────

describe("getResilientLanguageModel", () => {
  it("returns the preferred model with didFallback=false when the resolver succeeds", async () => {
    const preferredId = "moonshotai/kimi-k2-0905";
    const resolve = (id: string) => fakeModel(id);

    const { model, result } = await getResilientLanguageModel(
      preferredId,
      resolve as any
    );

    assert.equal(result.didFallback, false);
    assert.equal(result.modelId, preferredId);
    assert.equal(result.requestedModelId, preferredId);
    assert.equal(result.message, undefined);
    // The returned model should come from the mock resolver
    assert.deepEqual(model, fakeModel(preferredId));
  });

  it("falls back and sets didFallback=true when the preferred model throws an availability error", async () => {
    // Use a model that is in the pool but is not the default, so the
    // fallback will land on a different model id.
    const preferred = "mistral/codestral";
    let callCount = 0;

    const resolve = (id: string) => {
      callCount++;
      if (id === preferred) {
        throw new Error("503 Service Unavailable");
      }
      return fakeModel(id);
    };

    const { result } = await getResilientLanguageModel(preferred, resolve as any);

    assert.equal(result.didFallback, true);
    assert.notEqual(result.modelId, preferred);
    assert.equal(result.requestedModelId, preferred);
    assert.ok(
      typeof result.message === "string" && result.message.length > 0,
      "message should be a non-empty string"
    );
    // Message should describe what happened in plain English
    assert.ok(
      result.message!.toLowerCase().includes("unavailable") ||
        result.message!.toLowerCase().includes("switched"),
      `message should describe the fallback, got: "${result.message}"`
    );
    assert.ok(callCount > 1, "resolver should have been called more than once");
  });

  it("rethrows non-availability errors immediately without attempting fallback", async () => {
    const preferred = "moonshotai/kimi-k2-0905";
    const original = new TypeError(
      "Cannot read properties of undefined (reading 'config')"
    );
    let callCount = 0;

    const resolve = (_id: string) => {
      callCount++;
      throw original;
    };

    const err = await getResilientLanguageModel(preferred, resolve as any).catch(
      (e) => e
    );

    assert.equal(err, original, "should rethrow the exact same Error instance");
    // Should have stopped after the first failed attempt — not worked through
    // the whole pool trying a non-availability error.
    assert.equal(callCount, 1, "resolver should only have been called once");
  });
});
