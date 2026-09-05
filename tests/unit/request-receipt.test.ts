import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REQUEST_RECEIPT_DISCLAIMER,
  canonicalReceiptJson,
  issueRequestReceipt,
  verifyRequestReceipt,
} from "../../lib/receipts";

const base = {
  requested_model_id: "moonshotai/kimi-k2-0905",
  actual_model_id: "moonshotai/kimi-k2-0905",
  did_fallback: false,
  prompt_tokens: 120,
  completion_tokens: 80,
  total_tokens: 200,
  issued_at: "2026-09-05T12:00:00.000Z",
};

describe("issueRequestReceipt", () => {
  it("issues a digest-first receipt without a price", () => {
    const receipt = issueRequestReceipt(base);
    assert.equal(receipt.schema_version, 1);
    assert.equal(receipt.algorithm, "SHA-256");
    assert.match(receipt.digest, /^[a-f0-9]{64}$/);
    assert.equal(receipt.advisory, true);
    assert.equal(receipt.requires_human_confirmation, true);
    assert.equal(receipt.disclaimer, REQUEST_RECEIPT_DISCLAIMER);
    assert.equal("price" in receipt, false);
    assert.equal("cost" in receipt, false);
  });

  it("is stable for identical input", () => {
    const first = issueRequestReceipt(base);
    const second = issueRequestReceipt(base);
    assert.equal(first.digest, second.digest);
  });

  it("changes the digest when the model that actually ran changes", () => {
    const original = issueRequestReceipt(base);
    const fallback = issueRequestReceipt({
      ...base,
      actual_model_id: "mistral/mistral-small",
      did_fallback: true,
    });
    assert.notEqual(original.digest, fallback.digest);
    assert.equal(fallback.did_fallback, true);
  });

  it("does not put raw prompt text in the canonical payload", () => {
    const receipt = issueRequestReceipt({
      ...base,
      person_gate_commitment: "abc123",
    });
    const json = canonicalReceiptJson(receipt);
    assert.doesNotMatch(json, /prompt text/i);
    assert.match(json, /person_gate_commitment/);
  });

  it("rejects a missing model id", () => {
    assert.throws(
      () => issueRequestReceipt({ ...base, actual_model_id: "  " }),
      /actual_model_id/
    );
  });
});

describe("verifyRequestReceipt", () => {
  it("accepts an untampered receipt", () => {
    const receipt = issueRequestReceipt(base);
    const result = verifyRequestReceipt(receipt);
    assert.equal(result.match, true);
    assert.equal(result.computed_digest, receipt.digest);
  });

  it("rejects a receipt whose token count was rewritten", () => {
    const receipt = issueRequestReceipt(base);
    const tampered = { ...receipt, total_tokens: 9_999 };
    const result = verifyRequestReceipt(tampered);
    assert.equal(result.match, false);
  });
});
