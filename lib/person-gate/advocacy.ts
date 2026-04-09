/**
 * Advocacy tone controls and tribunal-ready export generation.
 *
 * When a NULL receipt is received, PersonGate generates calm, firm
 * advocacy language suitable for formal escalation.  The tone is
 * designed to be assertive but respectful — reflecting the Burgess
 * Principle stance that institutions serve the citizen.
 */

import { CERTIFICATION_MARK } from "@/lib/federation/governance";
import type { Challenge, VaultRecord, VaultState } from "./types";

/**
 * Generate calm advocacy language for a NULL case.
 *
 * This produces text suitable for:
 * - Formal letters to institutions
 * - Tribunal submissions
 * - Complaint escalations
 */
export function generateAdvocacyText({
  record,
  respondent,
}: {
  record: VaultRecord;
  respondent: string;
}): string {
  const lines = [
    `Dear ${respondent},`,
    "",
    "I am writing regarding a matter that directly affects my individual circumstances.",
    "",
    `Under The Burgess Principle (UK Certification Mark ${CERTIFICATION_MARK}), ` +
      "I have the right to ask:",
    "",
    '"Was a human member of your team able to personally review the specific facts ' +
      'of my individual situation before this decision or action was taken?"',
    "",
    `The facts of my case (reference: ${record.id}) were submitted via ` +
      "cryptographic commitment. Your system returned a NULL governance status, " +
      "indicating that no human review of my specific circumstances took place " +
      "before the decision was made.",
    "",
    "I respectfully request:",
    "",
    "1. Confirmation of whether a human reviewer examined my individual case facts.",
    "2. If not, that my case be referred for sovereign (human) review immediately.",
    "3. A written response confirming the outcome of this review within a reasonable timeframe.",
    "",
    "This is not a complaint about automation itself, but a request for the " +
      "accountability that every person is entitled to when decisions affect " +
      "their individual circumstances.",
    "",
    "I look forward to your response.",
    "",
    "Yours faithfully",
  ];

  return lines.join("\n");
}

/**
 * Generate a tribunal-ready export document from the user's vault state.
 *
 * This produces a structured document containing:
 * - All vault records with their governance statuses
 * - All challenges with their current statuses
 * - A timeline of events
 * - Summary statistics
 *
 * Raw facts are included only in this export (which stays with the user).
 */
export function generateTribunalExport({
  vaultState,
  userName,
}: {
  vaultState: VaultState;
  userName?: string;
}): string {
  const sections: string[] = [];

  // Header
  sections.push("# Sovereign Data Record — Tribunal Export");
  sections.push(
    `**Generated:** ${new Date().toISOString()}  ` +
      `\n**Certification Mark:** ${CERTIFICATION_MARK}  ` +
      (userName ? `\n**Subject:** ${userName}` : "")
  );
  sections.push("");

  // Summary
  sections.push("## Summary");
  sections.push("");
  sections.push(`- Total records: ${vaultState.summary.totalRecords}`);
  sections.push(
    `- SOVEREIGN (human-reviewed): ${vaultState.summary.sovereignCount}`
  );
  sections.push(`- NULL (no human review): ${vaultState.summary.nullCount}`);
  sections.push(`- Open challenges: ${vaultState.summary.openChallenges}`);
  sections.push("");

  // Records
  if (vaultState.records.length > 0) {
    sections.push("## Case Records");
    sections.push("");

    for (const record of vaultState.records) {
      sections.push(`### Record ${record.id}`);
      sections.push("");
      sections.push(`- **Category:** ${record.category}`);
      sections.push(`- **Status:** ${record.governanceStatus}`);
      sections.push(`- **Created:** ${record.createdAt}`);
      sections.push(`- **Updated:** ${record.updatedAt}`);
      sections.push(`- **Commitment:** \`${record.commitment}\``);
      sections.push("");
      sections.push("**Facts:**");
      sections.push("");
      sections.push(`> ${record.facts.replace(/\n/g, "\n> ")}`);
      sections.push("");
    }
  }

  // Challenges
  const activeChallenges = vaultState.challenges.filter(
    (c) => c.status !== "resolved"
  );

  if (activeChallenges.length > 0) {
    sections.push("## Active Challenges");
    sections.push("");

    for (const challenge of activeChallenges) {
      sections.push(`### Challenge ${challenge.id}`);
      sections.push("");
      sections.push(`- **Status:** ${challenge.status}`);
      sections.push(`- **Respondent:** ${challenge.receipt.respondent}`);
      sections.push(`- **Date:** ${challenge.createdAt}`);
      sections.push(
        `- **Commitment Hash:** \`${challenge.commitment.hash}\``
      );
      sections.push("");
      sections.push("**Advocacy Text:**");
      sections.push("");
      sections.push(challenge.advocacyText);
      sections.push("");
    }
  }

  // Timeline
  sections.push("## Timeline");
  sections.push("");

  const events = [
    ...vaultState.records.map((r) => ({
      date: r.createdAt,
      event: `Record created: ${r.category} (${r.governanceStatus})`,
    })),
    ...vaultState.challenges.map((c) => ({
      date: c.createdAt,
      event: `Challenge raised: ${c.receipt.respondent} returned NULL`,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  for (const entry of events) {
    sections.push(`- **${entry.date}** — ${entry.event}`);
  }

  sections.push("");
  sections.push("---");
  sections.push(
    `*This document was generated by Iris PersonGate under The Burgess Principle (${CERTIFICATION_MARK}). ` +
      "All facts remain under the data subject's sovereign control.*"
  );

  return sections.join("\n");
}

/**
 * Detect whether a user message involves a personal case that should
 * route through PersonGate.
 *
 * This is a heuristic — it looks for language indicating the user is
 * discussing their own situation, an appeal, a reasonable adjustment,
 * or a decision that affects them personally.
 */
export function isPersonalCaseMessage(message: string): boolean {
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
