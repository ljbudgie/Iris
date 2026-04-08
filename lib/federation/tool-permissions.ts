import type { GovernanceStatus } from "./types";

/**
 * Tool permission gating based on The Burgess Principle governance status.
 *
 * Tools are classified by sensitivity level. When a provider's governance
 * status is NULL (no human review has occurred), sensitive tools that
 * generate formal outputs on behalf of the user are restricted to prevent
 * unreviewed automated decisions from reaching vulnerable users.
 *
 * Tools classified as "sensitive" produce formal documents or take actions
 * that could materially affect the user's legal or financial situation.
 * Tools classified as "standard" provide informational or editorial
 * assistance and are safe to use without human review.
 */

/** The complete set of tool names registered in the chat route. */
export type ToolName =
  | "getWeather"
  | "createDocument"
  | "editDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "suggestFollowUps"
  | "generateBurgessLetter";

/**
 * Tools that require SOVEREIGN governance status (human review) before
 * they may be offered.  These tools produce formal outputs that could
 * materially affect a user's legal or financial situation.
 */
const SENSITIVE_TOOLS: ReadonlySet<ToolName> = new Set([
  "generateBurgessLetter",
]);

/**
 * All registered tools in the order expected by the chat route.
 */
const ALL_TOOLS: readonly ToolName[] = [
  "getWeather",
  "createDocument",
  "editDocument",
  "updateDocument",
  "requestSuggestions",
  "suggestFollowUps",
  "generateBurgessLetter",
];

/**
 * Returns the list of active tools permitted for the given governance
 * status.  When governance is NULL, sensitive tools are filtered out.
 * When governance is SOVEREIGN (or when no governance layer is active),
 * all tools are returned.
 */
export function getPermittedTools(
  governanceStatus: GovernanceStatus | undefined,
): ToolName[] {
  if (governanceStatus === "NULL") {
    return ALL_TOOLS.filter((tool) => !SENSITIVE_TOOLS.has(tool));
  }

  return [...ALL_TOOLS];
}

/**
 * Check whether a specific tool is permitted under the given governance
 * status.
 */
export function isToolPermitted(
  toolName: ToolName,
  governanceStatus: GovernanceStatus | undefined,
): boolean {
  if (governanceStatus === "NULL") {
    return !SENSITIVE_TOOLS.has(toolName);
  }

  return true;
}
