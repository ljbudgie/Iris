import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";

type BurgessGate = (decisionRecord: unknown) => Promise<{
  classification: "SOVEREIGN" | "NULL" | "AMBIGUOUS";
  commitment: string;
  mark: string;
}>;

let cachedGate: BurgessGate | undefined;

async function getBurgessGate() {
  if (!cachedGate) {
    const source = await readFile(
      join(process.cwd(), "public", "burgess-gate.js"),
      "utf8"
    );
    const gateModule = await import(
      `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`
    );
    cachedGate = gateModule.burgessGate;
  }

  return cachedGate;
}

describe("Tier 1 Burgess Gate API", () => {
  it("classifies sovereign when all binary checks are confirmed", async () => {
    const burgessGate = await getBurgessGate();
    const result = await burgessGate({
      institution: "Example Bank",
      decisionType: "credit marker",
      namedIndividual: "A. Reviewer",
      reviewConfirmed: true,
      specificFactsReviewed: true,
      evidenceNote: "Reviewer confirmed case-file review.",
    });

    assert.equal(result.classification, "SOVEREIGN");
    assert.equal(result.mark, "UK00004343685");
    assert.match(result.commitment, /^[a-f0-9]{64}$/);
  });

  it("classifies null when named individual review is absent", async () => {
    const burgessGate = await getBurgessGate();
    const result = await burgessGate({
      institution: "Example Council",
      decisionType: "PCN",
      namedIndividual: null,
      reviewConfirmed: true,
      specificFactsReviewed: true,
      evidenceNote: "No named officer was supplied.",
    });

    assert.equal(result.classification, "NULL");
  });

  it("classifies ambiguous when required fields are missing", async () => {
    const burgessGate = await getBurgessGate();
    const result = await burgessGate({
      institution: "Example Hiring Ltd",
      decisionType: "hiring shortlist",
      namedIndividual: "Unknown",
      reviewConfirmed: true,
      specificFactsReviewed: true,
      evidenceNote: "TBC",
    });

    assert.equal(result.classification, "AMBIGUOUS");
  });

  it("creates stable commitments for identical input records", async () => {
    const burgessGate = await getBurgessGate();
    const record = {
      institution: "Example Bank",
      decisionType: "credit marker",
      namedIndividual: "A. Reviewer",
      reviewConfirmed: true,
      specificFactsReviewed: true,
      evidenceNote: "Reviewer confirmed case-file review.",
    };

    const first = await burgessGate(record);
    const second = await burgessGate(record);

    assert.equal(first.commitment, second.commitment);
  });
});
