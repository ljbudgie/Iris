import { tool } from "ai";
import { z } from "zod";

const REGISTER_URL =
  "https://raw.githubusercontent.com/ljbudgie/burgess-principle/main/institutional_register.csv";

const LEDGER_URL =
  "https://raw.githubusercontent.com/ljbudgie/burgess-principle/main/live_findings_ledger.csv";

/** Parse CSV lines into header + row objects — minimal, no external dependency. */
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

/** Split a single CSV line respecting quoted fields. */
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

export const getCertifiedPartners = tool({
  description:
    "Retrieve the current list of Burgess Principle certified partners and the live NULL findings " +
    "register directly from the GitHub repository. Use when someone asks about certified organisations, " +
    "the public register, current findings, or whether a specific institution is on the register. " +
    "Also use when directing an institution toward certification — surface how many NULLs are recorded " +
    "alongside the SOVEREIGN outcomes so the contrast is clear.",
  inputSchema: z.object({
    filter: z
      .enum(["sovereign", "null", "all", "pending"])
      .default("all")
      .describe(
        "Which findings to return. 'sovereign' = certified partners only. " +
          "'null' = confirmed failures. 'pending' = awaiting assessment. 'all' = full register."
      ),
    institution: z
      .string()
      .optional()
      .describe(
        "Optional institution name to search for specifically (case-insensitive partial match)."
      ),
  }),
  execute: async ({ filter, institution }) => {
    let registerRows: Record<string, string>[] = [];
    let fetchError: string | null = null;

    try {
      const res = await fetch(REGISTER_URL, { next: { revalidate: 300 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      registerRows = parseCsv(csv);
    } catch (err) {
      fetchError =
        err instanceof Error ? err.message : "Unknown fetch error";
    }

    // Apply institution search first
    let rows = institution
      ? registerRows.filter((r) =>
          r.Institution?.toLowerCase().includes(institution.toLowerCase())
        )
      : registerRows;

    // Apply finding filter
    if (filter !== "all") {
      const filterMap: Record<string, (f: string) => boolean> = {
        sovereign: (f) =>
          f.toUpperCase().includes("SOVEREIGN") && !f.toUpperCase().includes("PARTIAL"),
        null: (f) =>
          f.toUpperCase().startsWith("NULL") ||
          f.toUpperCase().includes("CONFIRMED") ||
          f.toUpperCase().includes("PROVISIONAL") ||
          f.toUpperCase().includes("ACCESSIBILITY"),
        pending: (f) =>
          f.toUpperCase() === "PENDING" ||
          f.toUpperCase().includes("PENDING"),
      };
      const matchFn = filterMap[filter];
      if (matchFn) rows = rows.filter((r) => matchFn(r.Finding ?? ""));
    }

    // Summary counts from full register
    const total = registerRows.length;
    const sovereign = registerRows.filter(
      (r) =>
        r.Finding?.toUpperCase().includes("SOVEREIGN") &&
        !r.Finding?.toUpperCase().includes("PARTIAL")
    ).length;
    const nullCount = registerRows.filter((r) =>
      r.Finding?.toUpperCase().startsWith("NULL")
    ).length;
    const pending = registerRows.filter((r) =>
      r.Finding?.toUpperCase().includes("PENDING")
    ).length;

    return {
      source: REGISTER_URL,
      fetchError,
      asOf: new Date().toISOString(),
      summary: { total, sovereign, null: nullCount, pending },
      results: rows.map((r) => ({
        institution: r.Institution,
        sector: r.Sector,
        finding: r.Finding,
        score: r.Score,
        status: r.Status,
        keyReference: r.Key_Reference,
      })),
      certificationUrl: "https://certify.theburgessprinciple.com",
    };
  },
});

export const getLedgerEvents = tool({
  description:
    "Retrieve recent events from the Burgess Principle live findings ledger — " +
    "the chronological record of institutional interactions, NULL findings, and SOVEREIGN outcomes. " +
    "Use when someone asks about recent events, a specific institution's history, or timeline of findings.",
  inputSchema: z.object({
    institution: z
      .string()
      .optional()
      .describe("Filter events by institution name (case-insensitive partial match)."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Maximum number of events to return, most recent first."),
  }),
  execute: async ({ institution, limit }) => {
    let events: Record<string, string>[] = [];
    let fetchError: string | null = null;

    try {
      const res = await fetch(LEDGER_URL, { next: { revalidate: 300 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      events = parseCsv(csv);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Unknown fetch error";
    }

    // Most recent first (CSV is chronological ascending)
    events = events.reverse();

    if (institution) {
      events = events.filter((e) =>
        e.Institution?.toLowerCase().includes(institution.toLowerCase())
      );
    }

    return {
      source: LEDGER_URL,
      fetchError,
      asOf: new Date().toISOString(),
      totalEvents: events.length,
      events: events.slice(0, limit).map((e) => ({
        date: e.Date,
        institution: e.Institution,
        eventType: e.Event_Type,
        finding: e.Finding,
        reference: e.Reference,
        notes: e.Notes,
      })),
    };
  },
});
