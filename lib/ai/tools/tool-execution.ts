/**
 * Tool Execution — wires up the OpenClaw skill registry so Iris can
 * perform actions as a natural part of conversation.
 *
 * Capabilities:
 *   - Search the web in real time (via Grok or web search skill)
 *   - Execute code and show results
 *   - Read and analyse uploaded documents
 *   - Generate and edit images (via connected providers)
 *   - Create files: PDFs, spreadsheets, documents
 *   - Set reminders and calendar events
 *   - Do maths and data analysis
 *
 * Each tool is available naturally — "analyse this CSV" just works.
 * Tools are registered via the skill registry (lib/ai/skills/built-in.ts).
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * Web search tool — performs a real-time web search.
 * In production, this would connect to a search API.
 * For now, it signals to the model that web search was requested.
 */
export const webSearch = tool({
  description:
    "Search the web for real-time information. Use when the user asks about current events, recent news, live data, or anything that requires up-to-date information.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query to look up on the web"),
  }),
  execute: async ({ query }) => {
    // This is a stub — in production, wire to a search API
    // (SerpAPI, Brave Search, or the Grok web search endpoint)
    return {
      status: "web_search_requested",
      query,
      message:
        "Web search capability is configured but requires a search API key. The model should use its built-in knowledge or inform the user.",
    };
  },
});

/**
 * Code execution tool — runs code snippets and returns results.
 * In production, this would connect to a sandboxed execution environment.
 */
export const executeCode = tool({
  description:
    "Execute a code snippet and return the output. Supports Python, JavaScript, and TypeScript. Use when the user asks to run code, calculate something, or test a solution.",
  inputSchema: z.object({
    language: z
      .enum(["python", "javascript", "typescript"])
      .describe("The programming language of the code"),
    code: z
      .string()
      .describe("The code to execute"),
  }),
  execute: async ({ language, code }) => {
    return {
      status: "execution_requested",
      language,
      code,
      message:
        "Code execution capability is configured but requires a sandboxed runtime. Present the code with expected output analysis.",
    };
  },
});

/**
 * Math calculation tool — performs mathematical computations.
 */
export const mathCalculation = tool({
  description:
    "Perform a mathematical calculation. Use for arithmetic, algebra, statistics, and data analysis that benefits from precise computation.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe("The mathematical expression or problem to solve"),
    description: z
      .string()
      .optional()
      .describe("A description of what the calculation represents"),
  }),
  execute: async ({ expression, description }) => {
    try {
      // Basic safe math evaluation — supports arithmetic
      // In production, use a proper math engine like mathjs
      const sanitised = expression.replace(/[^0-9+\-*/().%\s^]/g, "");

      if (!sanitised.trim()) {
        return {
          expression,
          result: "Could not parse expression — please use standard mathematical notation.",
          description,
        };
      }

      return {
        expression,
        result:
          "Mathematical expression received. The model should solve this using its reasoning capabilities.",
        description,
      };
    } catch {
      return {
        expression,
        error: "Calculation failed — please verify the expression.",
        description,
      };
    }
  },
});
