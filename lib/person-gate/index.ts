import { createHash } from "node:crypto";

export type PersonGateSensitivity = "none" | "personal" | "institutional";

export type PersonGateAssessment = {
  sensitivity: PersonGateSensitivity;
  requiresSovereignHandling: boolean;
  recordId?: string;
  commitment?: string;
  label?: string;
  tags: string[];
};

type PersonGateModule = {
  personGate?: {
    commit?: (
      label: string,
      facts: string,
      tags?: string[]
    ) => Promise<{ id?: string; recordId?: string; commitment?: string }>;
  };
  commit?: (
    label: string,
    facts: string,
    tags?: string[]
  ) => Promise<{ id?: string; recordId?: string; commitment?: string }>;
};

const PERSONAL_CONTEXT_PATTERNS = [
  /\b(my|me|i)\b.*\b(disability|diagnosis|medical|health|benefit|pip|universal credit|esa|council tax|bailiff|debt|rent|housing|tribunal|appeal|fine|sanction|case|reference number)\b/i,
  /\b(disabled|autistic|deaf|blind|adhd|mental health|reasonable adjustment|equality act)\b/i,
  /\b(date of birth|address|phone number|national insurance|nhs number|bank|income|rent|arrears)\b/i,
  /\b(case details|personal facts|specific facts|individual situation|human review|burgess principle)\b/i,
];

const INSTITUTION_PATTERNS = [
  /\b(council|dwp|hmrc|court|tribunal|landlord|bank|school|university|nhs|police|bailiff|enforcement|solicitor|platform|organisation|institution)\b/i,
  /\b(decision|refused|rejected|sanctioned|appeal|complaint|mandatory reconsideration|subject access|dsar|foi|article 22)\b/i,
];

function hasMatch(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function assessPersonGateContext(text: string): PersonGateAssessment {
  const tags: string[] = [];
  const hasPersonalContext = hasMatch(text, PERSONAL_CONTEXT_PATTERNS);
  const hasInstitutionContext = hasMatch(text, INSTITUTION_PATTERNS);

  if (hasPersonalContext) {
    tags.push("personal-facts");
  }
  if (hasInstitutionContext) {
    tags.push("institutional-context");
  }

  const sensitivity: PersonGateSensitivity = hasPersonalContext
    ? hasInstitutionContext
      ? "institutional"
      : "personal"
    : "none";

  return {
    sensitivity,
    requiresSovereignHandling: sensitivity !== "none",
    tags,
  };
}

export function createLocalCommitment(label: string, facts: string) {
  return createHash("sha256").update(`${label}\n${facts}`).digest("hex");
}

export async function commitPersonalContext({
  label,
  facts,
  tags,
}: {
  label: string;
  facts: string;
  tags: string[];
}): Promise<PersonGateAssessment> {
  const base = assessPersonGateContext(facts);
  const allTags = Array.from(new Set([...base.tags, ...tags]));

  if (!base.requiresSovereignHandling) {
    return { ...base, tags: allTags };
  }

  try {
    const mod = (await import("@iris-gate/person")) as PersonGateModule;
    const commit = mod.personGate?.commit ?? mod.commit;
    if (commit) {
      const result = await commit(label, facts, allTags);
      return {
        ...base,
        recordId: result.recordId ?? result.id,
        commitment: result.commitment ?? createLocalCommitment(label, facts),
        label,
        tags: allTags,
      };
    }
  } catch (error) {
    console.error(
      "[Iris] PersonGate package unavailable, using local commitment:",
      error
    );
  }

  return {
    ...base,
    recordId: createLocalCommitment(`${label}:record`, facts).slice(0, 32),
    commitment: createLocalCommitment(label, facts),
    label,
    tags: allTags,
  };
}

export function buildPersonGatePromptContext(
  assessment: PersonGateAssessment
): string {
  if (!assessment.requiresSovereignHandling) {
    return "";
  }

  return [
    "PersonGate sovereign handling is active for this turn.",
    `Sensitivity: ${assessment.sensitivity}.`,
    assessment.commitment
      ? `Local commitment: ${assessment.commitment}.`
      : "Local commitment pending.",
    "Do not expose unnecessary raw personal facts to external institutions or providers.",
    "If the matter involves an institution, ask whether a human personally reviewed the specific facts of this specific case.",
  ].join("\n");
}
