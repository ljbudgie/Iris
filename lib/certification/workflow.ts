export const CERTIFICATION_MARK = "UK00004343685";
export const CERTIFICATION_DISCLAIMER =
  "This assessment was conducted under The Burgess Principle framework. It does not constitute legal advice.";

export type DecisionType =
  | "PCN"
  | "SAR"
  | "credit marker"
  | "warrant"
  | "other";
export type BinaryAnswer = "yes" | "no";
export type CertificationClassification = "SOVEREIGN" | "NULL" | "AMBIGUOUS";

export type CertificationIntake = {
  institutionName: string;
  processAssessed: string;
  decisionReference: string;
  decisionType: DecisionType;
  decisionDate: string;
  namedIndividualIdentified: boolean;
  assessorReference: string;
};

export type BinaryTestStep = {
  answer: BinaryAnswer;
  evidence: string;
};

export type BinaryTestResponses = {
  decisionPoint: BinaryTestStep;
  namedIndividual: BinaryTestStep;
  specificFactsReview: BinaryTestStep;
};

export type PersonGateSigning = {
  commitment: string;
  algorithm: "SHA-256";
  provider: "PersonGate";
  label: string;
  createdAt: string;
};

export type CertificationRecord = {
  id: string;
  intake: CertificationIntake;
  test: BinaryTestResponses;
  classification: CertificationClassification;
  summary: string;
  assessedAt: string;
  signing?: PersonGateSigning;
};

export type CertificationLedgerEntry = {
  entity: string;
  process: string;
  classification: CertificationClassification;
  summary: string;
  date: string;
  signature: string;
};

export function classifyCertification(
  responses: BinaryTestResponses
): CertificationClassification {
  if (responses.decisionPoint.answer === "no") {
    return "AMBIGUOUS";
  }

  if (
    responses.namedIndividual.answer === "no" ||
    responses.specificFactsReview.answer === "no"
  ) {
    return "NULL";
  }

  return "SOVEREIGN";
}

export function buildCertificationSummary({
  intake,
  responses,
  classification,
}: {
  intake: CertificationIntake;
  responses: BinaryTestResponses;
  classification: CertificationClassification;
}) {
  const institution = intake.institutionName || "The institution";
  const process = intake.processAssessed || "the assessed decision process";
  const decisionType = intake.decisionType.toLowerCase();
  const namedIndividual =
    responses.namedIndividual.answer === "yes"
      ? "a named individual was identified"
      : "no named individual was identified";
  const specificReview =
    responses.specificFactsReview.answer === "yes"
      ? "there was evidence of individual review of the specific facts"
      : "there was no sufficient evidence of individual review of the specific facts";

  if (classification === "SOVEREIGN") {
    return `${institution} was assessed for ${process} (${decisionType}). The decision point was identified, ${namedIndividual}, and ${specificReview}. The assessment is classified as SOVEREIGN under The Burgess Principle.`;
  }

  if (classification === "NULL") {
    return `${institution} was assessed for ${process} (${decisionType}). The decision point was identified, but ${namedIndividual} and/or ${specificReview}. The assessment is classified as NULL under The Burgess Principle.`;
  }

  return `${institution} was assessed for ${process} (${decisionType}). The decision point could not be identified with enough certainty to complete the binary test. The assessment is classified as AMBIGUOUS under The Burgess Principle.`;
}

export function buildLedgerEntry(
  record: CertificationRecord
): CertificationLedgerEntry {
  return {
    entity: record.intake.institutionName,
    process: record.intake.processAssessed,
    classification: record.classification,
    summary: record.summary,
    date: record.assessedAt,
    signature: record.signing?.commitment ?? "",
  };
}

export function buildCommitmentPayload({
  intake,
  responses,
  classification,
  assessedAt,
}: {
  intake: CertificationIntake;
  responses: BinaryTestResponses;
  classification: CertificationClassification;
  assessedAt: string;
}) {
  return JSON.stringify(
    {
      institutionName: intake.institutionName,
      processAssessed: intake.processAssessed,
      decisionReference: intake.decisionReference,
      decisionType: intake.decisionType,
      decisionDate: intake.decisionDate,
      namedIndividualIdentified: intake.namedIndividualIdentified,
      assessorReference: intake.assessorReference,
      responses,
      classification,
      assessedAt,
    },
    null,
    2
  );
}
