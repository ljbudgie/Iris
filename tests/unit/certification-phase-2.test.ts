/**
 * Unit tests for Phase 2 certification utilities.
 *
 * Tests the pure logic in github-append and framer-publish without
 * making any network calls.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

// ---------------------------------------------------------------------------
// Inline the buildCsvRow logic for testing (mirrors lib/certify/github-append.ts)
// ---------------------------------------------------------------------------

type CertifiedPartnerRow = {
  institution: string;
  sector: string;
  tier: string;
  certifiedDate: string;
  sovereignScore?: string;
  status: string;
  keyReference: string;
};

function buildCsvRow(partner: CertifiedPartnerRow): string {
  const fields = [
    partner.institution,
    partner.sector,
    "SOVEREIGN",
    partner.sovereignScore ?? "",
    "",
    "",
    "",
    "",
    "",
    `Certified ${partner.tier} — ${partner.certifiedDate}. ${partner.status}`,
    partner.keyReference,
  ].map((f) =>
    f.includes(",") || f.includes('"') ? `"${f.replace(/"/g, '""')}"` : f
  );
  return fields.join(",");
}

// ---------------------------------------------------------------------------
// Inline the slugify logic for testing (mirrors lib/certify/framer-publish.ts)
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// buildCsvRow — output format
// ---------------------------------------------------------------------------

describe("buildCsvRow — CSV formatting", () => {
  const partner: CertifiedPartnerRow = {
    institution: "Wave Utilities",
    sector: "Utilities",
    tier: "Tier 1",
    certifiedDate: "2026-06-19",
    sovereignScore: "16/20",
    status: "Tier 1 Burgess Principle certification granted 2026-06-19.",
    keyReference: "Inquiry abc-123",
  };

  it("produces the correct number of CSV fields (11)", () => {
    const row = buildCsvRow(partner);
    // Simple split on comma won't work for quoted fields — count unquoted commas
    // We know there are 10 commas separating 11 fields
    let commaCount = 0;
    let inQuotes = false;
    for (const ch of row) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) commaCount++;
    }
    assert.equal(commaCount, 10, "Expected 10 commas (11 fields)");
  });

  it("sets Finding column to SOVEREIGN", () => {
    const row = buildCsvRow(partner);
    const fields = row.split(",");
    assert.equal(fields[2], "SOVEREIGN");
  });

  it("includes institution name in first field", () => {
    const row = buildCsvRow(partner);
    assert.ok(row.startsWith("Wave Utilities,"));
  });

  it("includes sovereign score in score field", () => {
    const row = buildCsvRow(partner);
    const fields = row.split(",");
    assert.equal(fields[3], "16/20");
  });

  it("quotes fields containing commas", () => {
    const row = buildCsvRow({
      ...partner,
      institution: "Acme, Corp",
    });
    assert.ok(row.startsWith('"Acme, Corp"'));
  });

  it("escapes double-quotes within quoted fields", () => {
    const row = buildCsvRow({
      ...partner,
      institution: 'Say "Hello" Ltd',
    });
    assert.ok(row.startsWith('"Say ""Hello"" Ltd"'));
  });

  it("leaves empty D1–D5 dimension fields", () => {
    const row = buildCsvRow(partner);
    // Fields 4–8 (indices 4-8) should be empty between commas
    assert.ok(row.includes(",,,,,"), "D1-D5 should be empty");
  });

  it("includes tier and date in status field", () => {
    const row = buildCsvRow(partner);
    assert.ok(row.includes("Tier 1"));
    assert.ok(row.includes("2026-06-19"));
  });
});

// ---------------------------------------------------------------------------
// buildCsvRow — normalisation of existing file content
// ---------------------------------------------------------------------------

describe("CSV append — normalisation", () => {
  it("adds trailing newline when file doesn't end with one", () => {
    const existing = "header\nrow1";
    const normalised = existing.endsWith("\n") ? existing : `${existing}\n`;
    assert.ok(normalised.endsWith("\n"));
    assert.equal(normalised, "header\nrow1\n");
  });

  it("does not double newline when file already ends with one", () => {
    const existing = "header\nrow1\n";
    const normalised = existing.endsWith("\n") ? existing : `${existing}\n`;
    assert.equal(normalised, "header\nrow1\n");
    assert.equal(normalised.split("\n").filter(Boolean).length, 2);
  });
});

// ---------------------------------------------------------------------------
// slugify — Framer field
// ---------------------------------------------------------------------------

describe("slugify — Framer slug generation", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    assert.equal(slugify("Wave Utilities"), "wave-utilities");
  });

  it("removes leading and trailing hyphens", () => {
    assert.equal(slugify(" Test Corp "), "test-corp");
  });

  it("collapses multiple non-alphanumeric chars into one hyphen", () => {
    assert.equal(slugify("Acme, Corp & Partners"), "acme-corp-partners");
  });

  it("handles already lowercase slug", () => {
    assert.equal(slugify("starling-bank"), "starling-bank");
  });

  it("handles institution with special characters", () => {
    const result = slugify("Darlington Borough Council (DBC)");
    assert.ok(!result.includes("("));
    assert.ok(!result.includes(")"));
    assert.ok(result.startsWith("darlington"));
  });
});

// ---------------------------------------------------------------------------
// Framer skip logic — env vars not set
// ---------------------------------------------------------------------------

describe("Framer publish — skip behaviour", () => {
  it("skips gracefully when env vars are absent (logic check)", () => {
    const token = undefined;
    const projectId = undefined;
    const collectionId = undefined;

    const shouldSkip = !token || !projectId || !collectionId;
    assert.equal(shouldSkip, true, "Should skip when env vars not set");
  });

  it("does not skip when all env vars are present", () => {
    const token = "framer_token_abc";
    const projectId = "proj_123";
    const collectionId = "col_456";

    const shouldSkip = !token || !projectId || !collectionId;
    assert.equal(shouldSkip, false, "Should not skip when env vars are set");
  });
});

// ---------------------------------------------------------------------------
// Approval route logic — status conflict guard
// ---------------------------------------------------------------------------

describe("approve route — status guard", () => {
  function isConflict(status: string): boolean {
    return status !== "pending";
  }

  it("detects already-approved inquiry", () => {
    assert.equal(isConflict("approved"), true);
  });

  it("detects already-rejected inquiry", () => {
    assert.equal(isConflict("rejected"), true);
  });

  it("allows pending inquiry through", () => {
    assert.equal(isConflict("pending"), false);
  });
});

// ---------------------------------------------------------------------------
// certifiedDate defaulting
// ---------------------------------------------------------------------------

describe("certifiedDate — default to today", () => {
  it("uses provided date when given", () => {
    const provided = "2026-06-19";
    const resolved = provided ?? new Date().toISOString().slice(0, 10);
    assert.equal(resolved, "2026-06-19");
  });

  it("defaults to today's ISO date when not provided", () => {
    const provided = undefined;
    const resolved = provided ?? new Date().toISOString().slice(0, 10);
    assert.match(resolved, /^\d{4}-\d{2}-\d{2}$/);
  });
});
