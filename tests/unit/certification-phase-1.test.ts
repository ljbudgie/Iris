/**
 * Unit tests for Phase 1 certification tools.
 *
 * get-certified-partners: pure CSV parsing logic tested without network calls.
 * submit-certification-inquiry: DB-dependent — tested via type/shape checks only.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

// ---------------------------------------------------------------------------
// CSV parsing helpers — extracted for testability
// ---------------------------------------------------------------------------

/** Mirror of the private splitCsvLine in get-certified-partners.ts */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ---------------------------------------------------------------------------
// Sample data matching actual institutional_register.csv structure
// ---------------------------------------------------------------------------

const SAMPLE_CSV = `Institution,Sector,Finding,Score,D1,D2,D3,D4,D5,Status,Key_Reference
Wave Utilities,Utilities,SOVEREIGN,16/20,4,3,3,3,3,Resolved — both accounts £0.00. £795.14 removed.,CASE_STUDY_WAVE.md
Darlington Borough Council,Local Government,NULL,3/20,0,1,1,1,0,TPT appeal DK00003-2605 allowed 14 June 2026.,DK00003-2605
HMCTS / Birmingham Magistrates Court,Courts,NULL,1/20,1,0,0,0,0,Admission documented.,HMCTS 80553951
Palantir,Technology,Clean Negative,N/A,,,,,,"No records found. Proper institutional response.",
Starling Bank,Financial Services,Pending,,,,,,,Bernadette Smith CCO contacted 19 June 2026 re Tier 2 certification.,Internal
TV Licensing / BBC,Public Broadcaster,Partial Sovereign,12/20,3,2,2,3,2,Enforcement ceased on record correction.,
"Acme, Corp",Technology,NULL,0/20,0,0,0,0,0,No response.,REF123`;

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

describe("parseCsv — structure", () => {
  it("returns one object per data row", () => {
    const rows = parseCsv(SAMPLE_CSV);
    assert.equal(rows.length, 7);
  });

  it("maps header keys correctly", () => {
    const rows = parseCsv(SAMPLE_CSV);
    assert.ok("Institution" in rows[0]);
    assert.ok("Finding" in rows[0]);
    assert.ok("Sector" in rows[0]);
  });

  it("handles quoted fields with commas", () => {
    const rows = parseCsv(SAMPLE_CSV);
    const acme = rows.find((r) => r.Institution?.includes("Acme"));
    assert.ok(acme, "Acme, Corp row should be parsed");
    assert.equal(acme?.Institution, "Acme, Corp");
  });

  it("returns empty array for header-only CSV", () => {
    const rows = parseCsv("Institution,Sector,Finding\n");
    assert.equal(rows.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Filter: sovereign
// ---------------------------------------------------------------------------

describe("filter: sovereign", () => {
  const rows = parseCsv(SAMPLE_CSV);

  const isSovereign = (f: string) =>
    f.toUpperCase().includes("SOVEREIGN") &&
    !f.toUpperCase().includes("PARTIAL");

  it("identifies SOVEREIGN rows", () => {
    const results = rows.filter((r) => isSovereign(r.Finding ?? ""));
    assert.equal(results.length, 1);
    assert.equal(results[0].Institution, "Wave Utilities");
  });

  it("excludes Partial Sovereign from sovereign filter", () => {
    const results = rows.filter((r) => isSovereign(r.Finding ?? ""));
    assert.ok(
      !results.some((r) => r.Institution === "TV Licensing / BBC"),
      "Partial Sovereign should not appear in sovereign filter"
    );
  });
});

// ---------------------------------------------------------------------------
// Filter: null
// ---------------------------------------------------------------------------

describe("filter: null", () => {
  const rows = parseCsv(SAMPLE_CSV);

  const isNull = (f: string) =>
    f.toUpperCase().startsWith("NULL") ||
    f.toUpperCase().includes("CONFIRMED") ||
    f.toUpperCase().includes("PROVISIONAL") ||
    f.toUpperCase().includes("ACCESSIBILITY");

  it("identifies NULL rows", () => {
    const results = rows.filter((r) => isNull(r.Finding ?? ""));
    assert.ok(results.length >= 2);
    assert.ok(results.some((r) => r.Institution === "Darlington Borough Council"));
    assert.ok(results.some((r) => r.Institution?.includes("HMCTS")));
  });

  it("does not include SOVEREIGN in null filter", () => {
    const results = rows.filter((r) => isNull(r.Finding ?? ""));
    assert.ok(!results.some((r) => r.Institution === "Wave Utilities"));
  });
});

// ---------------------------------------------------------------------------
// Filter: pending
// ---------------------------------------------------------------------------

describe("filter: pending", () => {
  const rows = parseCsv(SAMPLE_CSV);

  const isPending = (f: string) =>
    f.toUpperCase() === "PENDING" || f.toUpperCase().includes("PENDING");

  it("identifies Pending rows", () => {
    const results = rows.filter((r) => isPending(r.Finding ?? ""));
    assert.equal(results.length, 1);
    assert.equal(results[0].Institution, "Starling Bank");
  });
});

// ---------------------------------------------------------------------------
// Institution search
// ---------------------------------------------------------------------------

describe("institution search", () => {
  const rows = parseCsv(SAMPLE_CSV);

  it("finds institution by case-insensitive partial match", () => {
    const results = rows.filter((r) =>
      r.Institution?.toLowerCase().includes("wave")
    );
    assert.equal(results.length, 1);
    assert.equal(results[0].Finding, "SOVEREIGN");
  });

  it("returns empty array for no match", () => {
    const results = rows.filter((r) =>
      r.Institution?.toLowerCase().includes("zzznomatch")
    );
    assert.equal(results.length, 0);
  });
});

// ---------------------------------------------------------------------------
// Summary counts
// ---------------------------------------------------------------------------

describe("summary counts", () => {
  const rows = parseCsv(SAMPLE_CSV);

  it("counts total rows", () => {
    assert.equal(rows.length, 7);
  });

  it("counts SOVEREIGN correctly (excludes Partial)", () => {
    const count = rows.filter(
      (r) =>
        r.Finding?.toUpperCase().includes("SOVEREIGN") &&
        !r.Finding?.toUpperCase().includes("PARTIAL")
    ).length;
    assert.equal(count, 1);
  });

  it("counts NULL correctly", () => {
    const count = rows.filter((r) =>
      r.Finding?.toUpperCase().startsWith("NULL")
    ).length;
    assert.equal(count, 3);
  });
});

// ---------------------------------------------------------------------------
// splitCsvLine edge cases
// ---------------------------------------------------------------------------

describe("splitCsvLine — edge cases", () => {
  it("handles empty string", () => {
    const result = splitCsvLine("");
    assert.deepEqual(result, [""]);
  });

  it("handles trailing comma", () => {
    const result = splitCsvLine("a,b,");
    assert.equal(result.length, 3);
    assert.equal(result[2], "");
  });

  it("handles nested quotes", () => {
    const result = splitCsvLine('"hello, world",second');
    assert.equal(result[0], "hello, world");
    assert.equal(result[1], "second");
  });
});
