/**
 * PersonGate AI tools — registered as skills in the Iris skill registry.
 *
 * These tools allow the AI to interact with the PersonGate sovereign data
 * handling system during conversations.  All are marked as "sensitive"
 * because they handle personal data and produce outputs that could affect
 * a user's legal or institutional situation.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  PersonGate,
  generateTribunalExport,
} from "@/lib/person-gate";
import type { SkillDefinition } from "../skills/types";

const MAX_FACTS_SUMMARY_LENGTH = 100;

// ---------------------------------------------------------------------------
// Tool: personGateCommit — commit personal facts to the sovereign vault
// ---------------------------------------------------------------------------

const personGateCommitTool = tool({
  description:
    "Commit a user's personal facts to their sovereign vault. " +
    "Facts are stored locally and a cryptographic commitment is generated " +
    "that can be sent to external institutions without revealing the raw data. " +
    "Use this when a user shares specific case facts, appeal details, " +
    "reasonable adjustment requests, or any personal circumstances.",
  inputSchema: z.object({
    facts: z
      .string()
      .describe("The user's personal facts to commit to the vault."),
    category: z
      .enum([
        "appeal",
        "adjustment",
        "decision",
        "case_facts",
        "request",
        "evidence",
        "correspondence",
        "general",
      ])
      .describe("Category of the facts being committed."),
    userId: z.string().describe("The user's ID."),
  }),
  execute: async ({ facts, category, userId }) => {
    const gate = new PersonGate(userId);
    const result = await gate.commit({ facts, category });

    return {
      message:
        "Your facts have been committed to your sovereign vault. " +
        "A cryptographic commitment has been generated — only this hash " +
        "will be shared with any external system, never your raw data.",
      vaultRecordId: result.vaultRecord.id,
      commitmentHash: result.commitment.hash,
      category,
      governanceStatus: result.vaultRecord.governanceStatus,
    };
  },
});

// ---------------------------------------------------------------------------
// Tool: personGateStatus — view vault state and challenge list
// ---------------------------------------------------------------------------

const personGateStatusTool = tool({
  description:
    "View the user's sovereign vault status including all committed records, " +
    "active challenges (NULL cases), and summary statistics. " +
    "Use this when a user asks about their case status, vault contents, " +
    "or wants to review their challenge list.",
  inputSchema: z.object({
    userId: z.string().describe("The user's ID."),
  }),
  execute: async ({ userId }) => {
    const gate = new PersonGate(userId);
    const state = gate.getState();

    return {
      summary: state.summary,
      records: state.records.map((r) => ({
        id: r.id,
        category: r.category,
        governanceStatus: r.governanceStatus,
        createdAt: r.createdAt,
        // Facts are summarised, not exposed in full
        factsSummary: r.facts.length > MAX_FACTS_SUMMARY_LENGTH ? `${r.facts.slice(0, MAX_FACTS_SUMMARY_LENGTH)}…` : r.facts,
      })),
      challenges: state.challenges.map((c) => ({
        id: c.id,
        status: c.status,
        respondent: c.receipt.respondent,
        createdAt: c.createdAt,
      })),
    };
  },
});

// ---------------------------------------------------------------------------
// Tool: personGateExport — generate tribunal-ready export
// ---------------------------------------------------------------------------

const personGateExportTool = tool({
  description:
    "Generate a tribunal-ready export document from the user's sovereign vault. " +
    "This creates a structured document with all records, challenges, timeline, " +
    "and advocacy text suitable for formal proceedings. " +
    "Use when a user needs to prepare for a tribunal, hearing, or formal complaint.",
  inputSchema: z.object({
    userId: z.string().describe("The user's ID."),
    userName: z.string().optional().describe("The user's name (optional)."),
  }),
  execute: async ({ userId, userName }) => {
    const gate = new PersonGate(userId);
    const state = gate.getState();
    const exportDoc = generateTribunalExport({ vaultState: state, userName });

    return {
      message:
        "Tribunal-ready export generated. This document contains your full " +
        "case record and remains under your sovereign control.",
      document: exportDoc,
    };
  },
});

// ---------------------------------------------------------------------------
// Skill definitions for registry
// ---------------------------------------------------------------------------

export const personGateCommitSkill: SkillDefinition = {
  metadata: {
    name: "personGateCommit",
    description:
      "Commit personal facts to the sovereign vault with cryptographic commitment.",
    version: "1.0.0",
    sensitivity: "sensitive",
    tags: ["person-gate", "sovereign", "privacy", "burgess-principle"],
    requiresContext: false,
  },
  tool: personGateCommitTool,
};

export const personGateStatusSkill: SkillDefinition = {
  metadata: {
    name: "personGateStatus",
    description:
      "View sovereign vault status, records, and challenge list.",
    version: "1.0.0",
    sensitivity: "sensitive",
    tags: ["person-gate", "sovereign", "privacy", "burgess-principle"],
    requiresContext: false,
  },
  tool: personGateStatusTool,
};

export const personGateExportSkill: SkillDefinition = {
  metadata: {
    name: "personGateExport",
    description:
      "Generate tribunal-ready export from sovereign vault.",
    version: "1.0.0",
    sensitivity: "sensitive",
    tags: ["person-gate", "sovereign", "privacy", "burgess-principle"],
    requiresContext: false,
  },
  tool: personGateExportTool,
};
