import { skillRegistry } from "@/lib/ai/skills/registry";
import type { GovernanceStatus } from "./types";

/**
 * Tool permission gating based on The Burgess Principle governance status.
 *
 * Tool names and sensitivity levels are now derived from the skill registry
 * (lib/ai/skills/) rather than maintained as separate hardcoded lists.
 * This ensures a single source of truth for tool metadata and governance.
 *
 * The ToolName type is kept as a string alias for backward compatibility
 * with existing code that references it.
 */

/** Tool name type — now a string derived from the skill registry. */
export type ToolName = string;

/**
 * Returns the list of active tools permitted for the given governance
 * status.  Delegates to the skill registry which filters by each skill's
 * declared sensitivity level.
 *
 * When governance is NULL, sensitive skills are filtered out.
 * When governance is SOVEREIGN (or when no governance layer is active),
 * all skills are returned.
 */
export function getPermittedTools(
  governanceStatus: GovernanceStatus | undefined
): ToolName[] {
  return skillRegistry.getPermittedNames(governanceStatus);
}

/**
 * Check whether a specific tool is permitted under the given governance
 * status.
 */
export function isToolPermitted(
  toolName: ToolName,
  governanceStatus: GovernanceStatus | undefined
): boolean {
  const skill = skillRegistry.get(toolName);
  if (!skill) {
    return false;
  }
  if (governanceStatus === "NULL") {
    return skill.metadata.sensitivity !== "sensitive";
  }
  return true;
}
