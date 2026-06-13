import type { CertificationRecord } from "@/lib/certification/workflow";

export type StatutoryChallengeType =
  | "subject_access_request"
  | "article_15_1_h"
  | "article_16_rectification"
  | "article_17_erasure"
  | "duaa_automated_decision_notice"
  | "equality_act_adjustment"
  | "pre_action_protocol";

export type PreferredRemedy =
  | "compliance"
  | "rectification"
  | "erasure"
  | "compensation"
  | "combination";

export type ResponseType = "substantive" | "holding" | "no response";

export type ChallengeResponseLog = {
  responseDate: string;
  responseType: ResponseType;
  updatedFinding: "SOVEREIGN" | "NULL";
};

export type StatutoryChallengeRecord = {
  id: string;
  originatingCertificationId: string;
  challengeType: StatutoryChallengeType;
  challengeLabel: string;
  institutionName: string;
  institutionAddress: string;
  decisionReference: string;
  classification: "NULL" | "AMBIGUOUS";
  processAssessed: string;
  evidenceNotes: string[];
  submissionDate: string;
  statutoryDeadline: string;
  preferredRemedy: PreferredRemedy;
  reasonableAdjustmentEmailOnly: boolean;
  plainText: string;
  html: string;
  createdAt: string;
  responseLog?: ChallengeResponseLog;
};

type ChallengeRoute = {
  type: StatutoryChallengeType;
  label: string;
  statutoryBasis: string;
  demand: string;
  deadlineRule:
    | "thirty_calendar_days"
    | "twenty_working_days"
    | "fourteen_calendar_days";
};

export const CHALLENGE_ROUTES: ChallengeRoute[] = [
  {
    type: "subject_access_request",
    label: "Subject Access Request (UK GDPR Article 15)",
    statutoryBasis:
      "UK GDPR Article 15 and the Data Protection Act 2018: right of access to personal data.",
    demand:
      "Provide copies of all personal data, case notes, internal records, audit logs, decision records, correspondence, and data used or generated in connection with the assessed process.",
    deadlineRule: "thirty_calendar_days",
  },
  {
    type: "article_15_1_h",
    label:
      "Article 15(1)(h) Request (logic, significance, and consequences of automated processing)",
    statutoryBasis:
      "UK GDPR Article 15(1)(h): meaningful information about the logic involved, and the significance and envisaged consequences of automated processing.",
    demand:
      "Explain whether automated processing was used, the logic involved, its significance, and the envisaged consequences for the data subject.",
    deadlineRule: "thirty_calendar_days",
  },
  {
    type: "article_16_rectification",
    label: "Article 16 Rectification Demand (inaccurate personal data)",
    statutoryBasis:
      "UK GDPR Article 16 and the Data Protection Act 2018: right to rectification of inaccurate personal data.",
    demand:
      "Rectify inaccurate personal data and confirm what data has been corrected, who it was shared with, and how future processing will be prevented from relying on the inaccurate data.",
    deadlineRule: "thirty_calendar_days",
  },
  {
    type: "article_17_erasure",
    label:
      "Article 17 Erasure Request (unlawful processing or inaccurate data)",
    statutoryBasis:
      "UK GDPR Article 17 and the Data Protection Act 2018: right to erasure where processing is unlawful or data is inaccurate or no longer necessary.",
    demand:
      "Erase unlawfully processed or inaccurate personal data, stop further processing, and confirm any recipients notified of the erasure.",
    deadlineRule: "thirty_calendar_days",
  },
  {
    type: "duaa_automated_decision_notice",
    label:
      "Data (Use and Access) Act 2025 Formal Notice (Articles 22A–22D — automated decision-making)",
    statutoryBasis:
      "Data (Use and Access) Act 2025 amendments to the UK GDPR, Articles 22A–22D: safeguards and notices for automated decision-making.",
    demand:
      "Confirm whether an automated decision-making process was used, identify safeguards applied, provide human-review routes, and preserve the decision record for challenge.",
    deadlineRule: "twenty_working_days",
  },
  {
    type: "equality_act_adjustment",
    label: "Equality Act 2010 Reasonable Adjustment Notice (ss.20 and 29)",
    statutoryBasis:
      "Equality Act 2010 sections 20 and 29: duty to make reasonable adjustments in service provision.",
    demand:
      "Record and apply the requested reasonable adjustment, including email-only communication where selected, and confirm that it is attached to the file.",
    deadlineRule: "fourteen_calendar_days",
  },
  {
    type: "pre_action_protocol",
    label:
      "Pre-Action Protocol Letter (CPR Practice Direction — Pre-Action Conduct)",
    statutoryBasis:
      "Civil Procedure Rules Practice Direction — Pre-Action Conduct and Protocols.",
    demand:
      "Provide a substantive response, identify the decision-maker, disclose relevant documents, preserve all records, and set out whether the matter can be resolved without proceedings.",
    deadlineRule: "fourteen_calendar_days",
  },
];

export function formatDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addCalendarDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addWorkingDays(date: Date, days: number) {
  const next = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    next.setUTCDate(next.getUTCDate() + 1);
    const day = next.getUTCDay();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }

  return next;
}

function toIsoDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calculateStatutoryDeadline(
  submissionDate: string,
  challengeType: StatutoryChallengeType
) {
  const route = getChallengeRoute(challengeType);
  const start = new Date(`${submissionDate}T00:00:00Z`);

  if (route.deadlineRule === "twenty_working_days") {
    return toIsoDate(addWorkingDays(start, 20));
  }

  if (route.deadlineRule === "fourteen_calendar_days") {
    return toIsoDate(addCalendarDays(start, 14));
  }

  return toIsoDate(addCalendarDays(start, 30));
}

export function getChallengeRoute(type: StatutoryChallengeType) {
  const route = CHALLENGE_ROUTES.find((item) => item.type === type);
  if (!route) {
    throw new Error(`Unknown challenge route: ${type}`);
  }
  return route;
}

export function getEvidenceNotes(record: CertificationRecord) {
  return [
    record.test.decisionPoint.evidence &&
      `Decision point: ${record.test.decisionPoint.evidence}`,
    record.test.namedIndividual.evidence &&
      `Named individual: ${record.test.namedIndividual.evidence}`,
    record.test.specificFactsReview.evidence &&
      `Specific facts review: ${record.test.specificFactsReview.evidence}`,
  ].filter(Boolean) as string[];
}

function remedyPhrase(remedy: PreferredRemedy) {
  const phrases: Record<PreferredRemedy, string> = {
    compliance: "compliance with the statutory duty identified above",
    rectification: "rectification of inaccurate records",
    erasure: "erasure of unlawfully processed or inaccurate data",
    compensation: "appropriate compensation for harm caused",
    combination:
      "a combined remedy including compliance, correction, erasure where appropriate, and compensation if harm has been caused",
  };

  return phrases[remedy];
}

function buildPlainText({
  record,
  route,
  submissionDate,
  statutoryDeadline,
  institutionAddress,
  preferredRemedy,
  reasonableAdjustmentEmailOnly,
}: {
  record: CertificationRecord;
  route: ChallengeRoute;
  submissionDate: string;
  statutoryDeadline: string;
  institutionAddress: string;
  preferredRemedy: PreferredRemedy;
  reasonableAdjustmentEmailOnly: boolean;
}) {
  const evidenceNotes = getEvidenceNotes(record);
  const addressBlock = institutionAddress.trim()
    ? `\n${institutionAddress.trim()}`
    : "";
  const evidenceBlock =
    evidenceNotes.length > 0
      ? evidenceNotes.map((note) => `- ${note}`).join("\n")
      : "- No additional evidence notes were recorded.";
  const adjustmentBlock = reasonableAdjustmentEmailOnly
    ? "\nReasonable adjustment notice\nPlease record email-only communication as a reasonable adjustment on my file. Do not require telephone contact unless I expressly agree in writing.\n"
    : "";

  return `${formatDate(submissionDate)}

To: ${record.intake.institutionName}${addressBlock}
Reference: ${record.intake.decisionReference || record.id}
Process assessed: ${record.intake.processAssessed}

${route.label}

Dear Sir or Madam,

I am issuing this formal notice following a completed Burgess Principle institutional certification.

Statutory basis
${route.statutoryBasis}

Binary test finding
The originating certification classified the decision process as ${record.classification}. The assessed record states: ${record.summary}

Evidence summary
${evidenceBlock}

Specific demands
${route.demand}

I require ${remedyPhrase(preferredRemedy)}. Please provide a substantive written response by ${formatDate(statutoryDeadline)}.
${adjustmentBlock}
Certification mark reference
This notice is issued under The Burgess Principle (UK Certification Mark UK00004343685)

Yours faithfully,

Lewis James Burgess
The Burgess Principle Ltd
lewisjames@theburgessprinciple.com`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml(plainText: string) {
  return `<article class="burgess-statutory-challenge">
${plainText
  .split("\n")
  .map((line) =>
    line.trim()
      ? `<p>${escapeHtml(line)}</p>`
      : '<div class="letter-space"></div>'
  )
  .join("\n")}
</article>`;
}

export function buildChallengeRecord({
  id,
  record,
  challengeType,
  submissionDate,
  institutionAddress,
  preferredRemedy,
  reasonableAdjustmentEmailOnly,
  createdAt,
}: {
  id: string;
  record: CertificationRecord;
  challengeType: StatutoryChallengeType;
  submissionDate: string;
  institutionAddress: string;
  preferredRemedy: PreferredRemedy;
  reasonableAdjustmentEmailOnly: boolean;
  createdAt: string;
}): StatutoryChallengeRecord {
  if (record.classification === "SOVEREIGN") {
    throw new Error("Statutory challenges require a NULL or AMBIGUOUS record.");
  }

  const route = getChallengeRoute(challengeType);
  const statutoryDeadline = calculateStatutoryDeadline(
    submissionDate,
    challengeType
  );
  const plainText = buildPlainText({
    record,
    route,
    submissionDate,
    statutoryDeadline,
    institutionAddress,
    preferredRemedy,
    reasonableAdjustmentEmailOnly,
  });

  return {
    id,
    originatingCertificationId: record.id,
    challengeType,
    challengeLabel: route.label,
    institutionName: record.intake.institutionName,
    institutionAddress,
    decisionReference: record.intake.decisionReference,
    classification: record.classification,
    processAssessed: record.intake.processAssessed,
    evidenceNotes: getEvidenceNotes(record),
    submissionDate,
    statutoryDeadline,
    preferredRemedy,
    reasonableAdjustmentEmailOnly,
    plainText,
    html: buildHtml(plainText),
    createdAt,
  };
}
