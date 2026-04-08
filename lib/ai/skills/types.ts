import type { GovernanceStatus } from "@/lib/federation/types";

/**
 * Skill sensitivity level under The Burgess Principle governance.
 *
 * - "standard"  — safe for use without human review (informational/editorial)
 * - "sensitive" — produces formal outputs that could materially affect a
 *                 user's legal or financial situation; requires SOVEREIGN status
 */
export type SkillSensitivity = "standard" | "sensitive";

/**
 * Metadata describing a registered skill, inspired by the nexus-ai-hub
 * OpenClaw `SkillMetadata` pattern but adapted for Iris's TypeScript
 * governance-aware architecture.
 */
export type SkillMetadata = {
  /** Unique skill name matching the tool key in the `tools` object. */
  name: string;

  /** Human-readable description shown to developers and in docs. */
  description: string;

  /** Semantic version string (e.g. "1.0.0"). */
  version: string;

  /** Governance sensitivity classification. */
  sensitivity: SkillSensitivity;

  /** Free-form tags for categorisation and discovery. */
  tags: string[];

  /**
   * Whether this skill needs runtime context (session, dataStream, modelId)
   * to be initialised.  Skills that require context use a factory function;
   * simple skills export a tool directly.
   */
  requiresContext: boolean;
};

/**
 * Runtime context passed to factory-style skills that need access to the
 * current session, data stream writer, and model identifier.
 */
export type SkillContext = {
  session: unknown;
  dataStream: unknown;
  modelId: string;
};

/**
 * A registered skill definition.  Wraps the AI SDK `tool()` return value
 * alongside governance-aware metadata.
 *
 * - `tool` is the pre-built tool (for context-free skills like `getWeather`)
 * - `factory` is a function that produces the tool given runtime context
 *   (for skills like `createDocument` that need session/dataStream)
 *
 * Exactly one of `tool` or `factory` must be provided.
 */
export type SkillDefinition = {
  metadata: SkillMetadata;
} & (
  | { tool: unknown; factory?: never }
  | { tool?: never; factory: (ctx: SkillContext) => unknown }
);

/**
 * Returns true when a skill is permitted under the given governance status.
 */
export function isSkillPermitted(
  skill: SkillDefinition,
  governanceStatus: GovernanceStatus | undefined
): boolean {
  if (governanceStatus === "NULL") {
    return skill.metadata.sensitivity !== "sensitive";
  }
  return true;
}
