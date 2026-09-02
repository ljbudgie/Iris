/**
 * Maps the Model Clause four limbs onto SOVEREIGN / NULL / AMBIGUOUS.
 *
 * Advisory only. A named human must attribute any certified finding.
 * Limbs:
 *   a — reviewed the specific facts of the specific case
 *   b — recorded reasonable adjustment applied
 *   c — no live complaint / appeal / proceeding that should pause it
 *   d — name, role and date recorded and disclosable
 */

export type ScrutinyLimb = "a" | "b" | "c" | "d";

export type ScrutinyInput = {
  namedOfficer?: string | null;
  role?: string | null;
  reviewedSpecificFacts?: boolean | "ambiguous";
  adjustmentApplied?: boolean | "ambiguous";
  liveProceedingChecked?: boolean | "ambiguous";
  recordedAndDisclosable?: boolean | "ambiguous";
  processLanguage?: string | null;
};

export type ScrutinyAssessment = {
  classification: "SOVEREIGN" | "NULL" | "AMBIGUOUS";
  missingLimbs: ScrutinyLimb[];
  nextAction: string;
  advisory: true;
  requires_human_confirmation: true;
};

const VAGUE =
  /\bhuman oversight\b|\breviewed in line with policy\b|\bsubject to human review\b|\bstandard process\b|\ba member of staff may review\b/i;

export function assessScrutiny(input: ScrutinyInput): ScrutinyAssessment {
  const officer = input.namedOfficer?.trim() || "";
  const role = input.role?.trim() || "";
  const processLanguage = input.processLanguage?.trim() || "";

  const limbState: Record<ScrutinyLimb, boolean | "ambiguous"> = {
    a: input.reviewedSpecificFacts ?? false,
    b: input.adjustmentApplied ?? false,
    c: input.liveProceedingChecked ?? false,
    d: input.recordedAndDisclosable ?? false,
  };

  if (!officer || !role) {
    limbState.d = false;
  }

  const missingLimbs = (Object.entries(limbState) as Array<
    [ScrutinyLimb, boolean | "ambiguous"]
  >)
    .filter(([, value]) => value !== true)
    .map(([limb]) => limb);

  const anyAmbiguousLimb = (Object.values(limbState) as Array<
    boolean | "ambiguous"
  >).some((value) => value === "ambiguous");
  const vagueProcess = Boolean(processLanguage && VAGUE.test(processLanguage));

  let classification: ScrutinyAssessment["classification"];
  if (missingLimbs.length === 0 && officer && role && !vagueProcess) {
    classification = "SOVEREIGN";
  } else if (anyAmbiguousLimb || (vagueProcess && !officer)) {
    classification = "AMBIGUOUS";
  } else {
    classification = "NULL";
  }

  const nextAction =
    classification === "SOVEREIGN"
      ? "Work through the substance of the decision with the named officer."
      : "Ask for the name, role and date of the officer who reviewed the specific facts before the action.";

  return {
    classification,
    missingLimbs,
    nextAction,
    advisory: true,
    requires_human_confirmation: true,
  };
}
