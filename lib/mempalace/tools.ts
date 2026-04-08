/**
 * MemPalace AI tools — exposes MemPalace MCP operations as Iris AI tools.
 *
 * These tools register with the Iris skill registry so they are
 * automatically available when a MemPalace MCP server is configured
 * via the MEMPALACE_MCP_COMMAND environment variable.
 *
 * The three core tools exposed to the AI model:
 *  - mempalaceSearch  — semantic search across palace memories
 *  - mempalaceStore   — file verbatim content into the palace
 *  - mempalaceStatus  — palace overview for wake-up context
 */
import { tool } from "ai";
import { z } from "zod";
import type { SkillDefinition } from "@/lib/ai/skills/types";
import { getMemPalaceClient } from "./client";

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const mempalaceSearch = tool({
  description:
    "Search the user's MemPalace for relevant memories. Use this when the user asks about past conversations, facts about themselves, their projects, or anything that might be stored in their palace memory. Returns verbatim content with similarity scores.",
  inputSchema: z.object({
    query: z.string().describe("What to search for in the palace"),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results to return (default: 5)"),
    wing: z
      .string()
      .optional()
      .describe("Filter by wing/project name (optional)"),
    room: z.string().optional().describe("Filter by room/topic (optional)"),
  }),
  execute: async (input) => {
    const client = getMemPalaceClient();
    if (!client) {
      return {
        error:
          "MemPalace is not configured. Set MEMPALACE_MCP_COMMAND to enable palace memory.",
      };
    }
    try {
      if (!client.isConnected()) {
        await client.connect();
      }
      return await client.search(input);
    } catch (error) {
      console.error("[Iris] MemPalace search failed:", error);
      return {
        error: `MemPalace search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

export const mempalaceStore = tool({
  description:
    "Store verbatim content in the user's MemPalace. Use this when the user explicitly asks to remember something, save a fact, or record information for future sessions. Content is stored exactly as provided — never summarise.",
  inputSchema: z.object({
    wing: z
      .string()
      .describe(
        "Wing/project to file under (e.g. 'wing_user', 'wing_code', project name)"
      ),
    room: z
      .string()
      .describe(
        "Room/topic within the wing (e.g. 'preferences', 'decisions', 'meetings')"
      ),
    content: z
      .string()
      .describe("Verbatim content to store — exact words, never summarised"),
  }),
  execute: async (input) => {
    const client = getMemPalaceClient();
    if (!client) {
      return {
        error:
          "MemPalace is not configured. Set MEMPALACE_MCP_COMMAND to enable palace memory.",
      };
    }
    try {
      if (!client.isConnected()) {
        await client.connect();
      }
      return await client.addDrawer({
        ...input,
        added_by: "iris",
      });
    } catch (error) {
      console.error("[Iris] MemPalace store failed:", error);
      return {
        error: `MemPalace store failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

export const mempalaceStatus = tool({
  description:
    "Get the status of the user's MemPalace — total memories, wings, rooms, and the AAAK dialect spec. Call this on wake-up to load palace context.",
  inputSchema: z.object({}),
  execute: async () => {
    const client = getMemPalaceClient();
    if (!client) {
      return {
        error:
          "MemPalace is not configured. Set MEMPALACE_MCP_COMMAND to enable palace memory.",
      };
    }
    try {
      if (!client.isConnected()) {
        await client.connect();
      }
      return await client.status();
    } catch (error) {
      console.error("[Iris] MemPalace status failed:", error);
      return {
        error: `MemPalace status failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

// ---------------------------------------------------------------------------
// Skill definitions for the registry
// ---------------------------------------------------------------------------

export const mempalaceSearchSkill: SkillDefinition = {
  metadata: {
    name: "mempalaceSearch",
    description: "Search the user's MemPalace for relevant memories.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["mempalace", "memory", "search"],
    requiresContext: false,
  },
  tool: mempalaceSearch,
};

export const mempalaceStoreSkill: SkillDefinition = {
  metadata: {
    name: "mempalaceStore",
    description: "Store verbatim content in the user's MemPalace.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["mempalace", "memory", "write"],
    requiresContext: false,
  },
  tool: mempalaceStore,
};

export const mempalaceStatusSkill: SkillDefinition = {
  metadata: {
    name: "mempalaceStatus",
    description: "Get MemPalace status and wake-up context.",
    version: "1.0.0",
    sensitivity: "standard",
    tags: ["mempalace", "memory", "status"],
    requiresContext: false,
  },
  tool: mempalaceStatus,
};
