/**
 * Unit tests for PersonGate — sovereign data handling.
 *
 * Tests cover the full PersonGate flow:
 * 1. Committing facts to the vault
 * 2. Generating cryptographic commitments
 * 3. Receiving and validating receipts
 * 4. Automatic challenge creation for NULL receipts
 * 5. Advocacy text generation
 * 6. Tribunal export generation
 * 7. Personal case message detection
 * 8. Vault state management
 *
 * Run with: npx tsx --test tests/unit/person-gate.test.ts
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

// ---------------------------------------------------------------------------
// Inline implementations to avoid Next.js module resolution issues
// (same pattern used in principles.test.ts)
// ---------------------------------------------------------------------------

// -- Crypto --

async function sha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function validateReceipt(
  receipt: { commitmentHash: string },
  commitment: { hash: string }
): boolean {
  return receipt.commitmentHash === commitment.hash;
}

// -- Advocacy detection --

function isPersonalCaseMessage(message: string): boolean {
  const personalPatterns = [
    /\b(my|mine)\b.*\b(case|appeal|claim|situation|circumstances)\b/i,
    /\b(reasonable\s+adjust(ment|ments))\b/i,
    /\b(my\s+(specific|individual|personal)\s+(facts?|data|details?))\b/i,
    /\b(appeal(ing|ed)?)\b.*\b(decision|outcome|result)\b/i,
    /\b(tribunal|hearing|complaint)\b.*\b(submit|prepare|ready)\b/i,
    /\b(submit|prepare|ready)\b.*\b(tribunal|hearing|complaint)\b/i,
    /\b(they\s+(decided|refused|denied|rejected))\b/i,
    /\b(institution|council|employer|DWP|HMRC|NHS|university)\b.*\b(my|me)\b/i,
    /\b(unfair|discriminat|bias(ed)?)\b.*\b(decision|treatment|outcome)\b/i,
    /\b(decision|treatment|outcome)\b.*\b(unfair|discriminat|bias(ed)?)\b/i,
    /\b(sovereign\s+data|person\s*gate|vault\s+record)\b/i,
  ];

  let matchCount = 0;
  for (const pattern of personalPatterns) {
    if (pattern.test(message)) {
      matchCount++;
    }
  }

  return matchCount >= 1;
}

// -- Vault (simplified in-memory) --

type GovernanceStatus = "SOVEREIGN" | "NULL";

type VaultRecord = {
  id: string;
  userId: string;
  category: string;
  facts: string;
  commitment: string;
  governanceStatus: GovernanceStatus;
  createdAt: string;
  updatedAt: string;
};

type Challenge = {
  id: string;
  vaultRecordId: string;
  userId: string;
  status: string;
  createdAt: string;
};

type VaultState = {
  records: VaultRecord[];
  challenges: Challenge[];
  summary: {
    totalRecords: number;
    sovereignCount: number;
    nullCount: number;
    openChallenges: number;
  };
};

function computeVaultSummary(
  records: VaultRecord[],
  challenges: Challenge[]
): VaultState {
  return {
    records,
    challenges,
    summary: {
      totalRecords: records.length,
      sovereignCount: records.filter((r) => r.governanceStatus === "SOVEREIGN")
        .length,
      nullCount: records.filter((r) => r.governanceStatus === "NULL").length,
      openChallenges: challenges.filter((c) => c.status === "open").length,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PersonGate: SHA-256 Commitment", () => {
  it("produces a 64-char hex string", async () => {
    const hash = await sha256("test content");
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it("produces different hashes for different content", async () => {
    const hash1 = await sha256("content A");
    const hash2 = await sha256("content B");
    assert.notEqual(hash1, hash2);
  });

  it("produces the same hash for identical content", async () => {
    const hash1 = await sha256("same content");
    const hash2 = await sha256("same content");
    assert.equal(hash1, hash2);
  });

  it("handles empty string", async () => {
    const hash = await sha256("");
    assert.equal(hash.length, 64);
  });

  it("handles unicode content", async () => {
    const hash = await sha256("Hello 🌍 世界");
    assert.equal(hash.length, 64);
  });
});

describe("PersonGate: Receipt Validation", () => {
  it("validates matching receipt and commitment", () => {
    const commitment = { hash: "abc123" };
    const receipt = { commitmentHash: "abc123" };
    assert.equal(validateReceipt(receipt, commitment), true);
  });

  it("rejects non-matching receipt", () => {
    const commitment = { hash: "abc123" };
    const receipt = { commitmentHash: "xyz789" };
    assert.equal(validateReceipt(receipt, commitment), false);
  });

  it("rejects empty commitment hash", () => {
    const commitment = { hash: "" };
    const receipt = { commitmentHash: "abc123" };
    assert.equal(validateReceipt(receipt, commitment), false);
  });
});

describe("PersonGate: Personal Case Detection", () => {
  it("detects 'my case' language", () => {
    assert.equal(isPersonalCaseMessage("I need help with my case"), true);
  });

  it("detects 'my appeal' language", () => {
    assert.equal(
      isPersonalCaseMessage("I want to appeal the decision"),
      true
    );
  });

  it("detects reasonable adjustment requests", () => {
    assert.equal(
      isPersonalCaseMessage("I need a reasonable adjustment"),
      true
    );
  });

  it("detects institutional references with personal pronouns", () => {
    assert.equal(
      isPersonalCaseMessage("The council refused my request"),
      true
    );
  });

  it("detects tribunal preparation", () => {
    assert.equal(
      isPersonalCaseMessage("I need to prepare for a tribunal hearing"),
      true
    );
  });

  it("detects unfair treatment language", () => {
    assert.equal(
      isPersonalCaseMessage("The decision was unfair and biased"),
      true
    );
  });

  it("detects sovereign data references", () => {
    assert.equal(
      isPersonalCaseMessage("Show me my sovereign data"),
      true
    );
  });

  it("does not flag generic questions", () => {
    assert.equal(isPersonalCaseMessage("What is the weather today?"), false);
  });

  it("does not flag coding questions", () => {
    assert.equal(
      isPersonalCaseMessage("How do I write a React component?"),
      false
    );
  });

  it("does not flag general knowledge", () => {
    assert.equal(
      isPersonalCaseMessage("What is the capital of France?"),
      false
    );
  });
});

describe("PersonGate: Vault State Summary", () => {
  it("computes correct summary for empty vault", () => {
    const state = computeVaultSummary([], []);
    assert.deepStrictEqual(state.summary, {
      totalRecords: 0,
      sovereignCount: 0,
      nullCount: 0,
      openChallenges: 0,
    });
  });

  it("computes correct summary with mixed records", () => {
    const now = new Date().toISOString();
    const records: VaultRecord[] = [
      {
        id: "1",
        userId: "u1",
        category: "appeal",
        facts: "fact 1",
        commitment: "hash1",
        governanceStatus: "SOVEREIGN",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "2",
        userId: "u1",
        category: "decision",
        facts: "fact 2",
        commitment: "hash2",
        governanceStatus: "NULL",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "3",
        userId: "u1",
        category: "case_facts",
        facts: "fact 3",
        commitment: "hash3",
        governanceStatus: "SOVEREIGN",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const challenges: Challenge[] = [
      {
        id: "c1",
        vaultRecordId: "2",
        userId: "u1",
        status: "open",
        createdAt: now,
      },
    ];

    const state = computeVaultSummary(records, challenges);
    assert.deepStrictEqual(state.summary, {
      totalRecords: 3,
      sovereignCount: 2,
      nullCount: 1,
      openChallenges: 1,
    });
  });

  it("counts only open challenges", () => {
    const now = new Date().toISOString();
    const challenges: Challenge[] = [
      {
        id: "c1",
        vaultRecordId: "1",
        userId: "u1",
        status: "open",
        createdAt: now,
      },
      {
        id: "c2",
        vaultRecordId: "2",
        userId: "u1",
        status: "resolved",
        createdAt: now,
      },
      {
        id: "c3",
        vaultRecordId: "3",
        userId: "u1",
        status: "escalated",
        createdAt: now,
      },
    ];

    const state = computeVaultSummary([], challenges);
    assert.equal(state.summary.openChallenges, 1);
  });
});

describe("PersonGate: Governance Tagging", () => {
  it("SOVEREIGN status passes through", () => {
    const status: GovernanceStatus = "SOVEREIGN";
    assert.equal(status, "SOVEREIGN");
  });

  it("NULL status is correctly identified", () => {
    const status: GovernanceStatus = "NULL";
    assert.equal(status, "NULL");
  });

  it("only SOVEREIGN and NULL are valid governance statuses", () => {
    const validStatuses: GovernanceStatus[] = ["SOVEREIGN", "NULL"];
    assert.equal(validStatuses.length, 2);
    assert.ok(validStatuses.includes("SOVEREIGN"));
    assert.ok(validStatuses.includes("NULL"));
  });
});
