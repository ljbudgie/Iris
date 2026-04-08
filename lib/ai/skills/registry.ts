import type { ToolSet } from "ai";
import type { GovernanceStatus } from "@/lib/federation/types";
import {
  isSkillPermitted,
  type SkillContext,
  type SkillDefinition,
} from "./types";

/**
 * SkillRegistry — a self-describing, governance-aware tool registration layer.
 *
 * Inspired by the nexus-ai-hub `SkillRegistry` pattern, adapted for Iris's
 * TypeScript/Vercel AI SDK architecture.  The registry replaces the hardcoded
 * `ALL_TOOLS` and `SENSITIVE_TOOLS` sets in `lib/federation/tool-permissions.ts`
 * with a single source of truth that each skill self-declares into.
 *
 * Usage:
 *   import { skillRegistry } from "@/lib/ai/skills";
 *   skillRegistry.register(mySkillDefinition);
 *   const tools = skillRegistry.buildTools(ctx, governanceStatus);
 *   const activeToolNames = skillRegistry.getPermittedNames(governanceStatus);
 */
class SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition>();

  /**
   * Register a skill.  Throws if a skill with the same name already exists.
   */
  register(skill: SkillDefinition): void {
    const { name } = skill.metadata;
    if (this.skills.has(name)) {
      throw new Error(`Skill "${name}" is already registered.`);
    }
    this.skills.set(name, skill);
  }

  /**
   * Retrieve a skill definition by name.
   */
  get(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  /**
   * Return all registered skill definitions.
   */
  list(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Return registered skill names in insertion order.
   */
  names(): string[] {
    return Array.from(this.skills.keys());
  }

  /**
   * Return skill names permitted under the given governance status.
   * When governance is NULL, sensitive skills are excluded.
   */
  getPermittedNames(governanceStatus: GovernanceStatus | undefined): string[] {
    return this.list()
      .filter((s) => isSkillPermitted(s, governanceStatus))
      .map((s) => s.metadata.name);
  }

  /**
   * Build the `tools` object expected by the Vercel AI SDK `streamText()`.
   *
   * For each registered skill the method:
   *  - uses the pre-built `tool` if the skill is context-free
   *  - calls the `factory(ctx)` if the skill requires runtime context
   *
   * Only skills permitted by the current governance status are included.
   */
  buildTools(
    ctx: SkillContext,
    governanceStatus: GovernanceStatus | undefined
  ): ToolSet {
    const tools: Record<string, unknown> = {};
    for (const skill of this.list()) {
      if (!isSkillPermitted(skill, governanceStatus)) {
        continue;
      }
      tools[skill.metadata.name] = skill.factory
        ? skill.factory(ctx)
        : skill.tool;
    }
    return tools as ToolSet;
  }

  /**
   * Number of registered skills.
   */
  get size(): number {
    return this.skills.size;
  }
}

/**
 * The singleton skill registry for the Iris application.
 */
export const skillRegistry = new SkillRegistry();
