import {
  CERTIFICATION_MARK,
  type CertificationRecord,
} from "@/lib/certification/workflow";
import type { StatutoryChallengeRecord } from "@/lib/challenges/workflow";

export type EvidenceBundleDeadlineStatus = "met" | "missed" | "pending";

export type EvidenceBundleTimelineEvent = {
  date: string;
  label: string;
  detail: string;
};

export type EvidenceBundle = {
  produced_at: string;
  cover_page: {
    institution_name: string;
    case_reference: string;
    date_range: string;
    assessor: string;
    classification_summary: string;
    certification_mark: typeof CERTIFICATION_MARK;
  };
  certification_record: CertificationRecord;
  challenge_letters: StatutoryChallengeRecord[];
  response_log: {
    challenge_id: string;
    challenge_label: string;
    response_date: string;
    response_type: string;
    updated_classification: string;
  }[];
  deadline_summary: {
    challenge_id: string;
    challenge_label: string;
    statutory_deadline: string;
    status: EvidenceBundleDeadlineStatus;
  }[];
  timeline: EvidenceBundleTimelineEvent[];
  closing_statement: string;
};

const CLOSING_STATEMENT =
  "This bundle was produced from The Burgess Principle Institutional Certification platform. All records are locally held and cryptographically committed under PersonGate SHA-256. UK Certification Mark UK00004343685.";

function isoDate(value: string) {
  return value.slice(0, 10);
}

function compareDates(left: string, right: string) {
  return left.localeCompare(right);
}

function matchingChallenges(
  record: CertificationRecord,
  challenges: StatutoryChallengeRecord[]
) {
  return challenges
    .filter(
      (challenge) =>
        challenge.originatingCertificationId === record.id ||
        challenge.institutionName === record.intake.institutionName
    )
    .sort((left, right) =>
      left.submissionDate.localeCompare(right.submissionDate)
    );
}

function deadlineStatus(
  challenge: StatutoryChallengeRecord,
  today: string
): EvidenceBundleDeadlineStatus {
  if (challenge.responseLog?.responseDate) {
    return challenge.responseLog.responseDate <= challenge.statutoryDeadline
      ? "met"
      : "missed";
  }

  return challenge.statutoryDeadline < today ? "missed" : "pending";
}

function dateRange(
  record: CertificationRecord,
  challenges: StatutoryChallengeRecord[]
) {
  const dates = [
    isoDate(record.assessedAt),
    ...challenges.flatMap((challenge) => [
      challenge.submissionDate,
      challenge.statutoryDeadline,
      challenge.responseLog?.responseDate ?? "",
    ]),
  ].filter(Boolean);

  const sortedDates = dates.sort(compareDates);
  const first = sortedDates[0] ?? isoDate(record.assessedAt);
  const last = sortedDates.at(-1) ?? first;

  return first === last ? first : `${first} to ${last}`;
}

function buildTimeline(
  record: CertificationRecord,
  challenges: StatutoryChallengeRecord[]
) {
  const events: EvidenceBundleTimelineEvent[] = [
    {
      date: isoDate(record.assessedAt),
      label: "Certification completed",
      detail: `${record.intake.institutionName} classified ${record.classification}.`,
    },
  ];

  for (const challenge of challenges) {
    events.push({
      date: challenge.submissionDate,
      label: "Challenge submitted",
      detail: challenge.challengeLabel,
    });
    events.push({
      date: challenge.statutoryDeadline,
      label: "Statutory deadline",
      detail: challenge.challengeLabel,
    });

    if (challenge.responseLog?.responseDate) {
      events.push({
        date: challenge.responseLog.responseDate,
        label: "Response received",
        detail: `${challenge.responseLog.responseType}; updated classification ${challenge.responseLog.updatedFinding}.`,
      });
    }
  }

  return events.sort((left, right) => compareDates(left.date, right.date));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRows(items: { label: string; value: string }[]) {
  return items
    .map(
      (item) =>
        `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`
    )
    .join("");
}

export function buildEvidenceBundle({
  record,
  challenges,
  producedAt = new Date().toISOString(),
  today = new Date().toISOString().slice(0, 10),
}: {
  record: CertificationRecord;
  challenges: StatutoryChallengeRecord[];
  producedAt?: string;
  today?: string;
}): EvidenceBundle {
  const caseChallenges = matchingChallenges(record, challenges);

  return {
    produced_at: producedAt,
    cover_page: {
      institution_name: record.intake.institutionName,
      case_reference: record.intake.decisionReference || record.id,
      date_range: dateRange(record, caseChallenges),
      assessor: record.intake.assessorReference,
      classification_summary: `${record.classification}: ${record.summary}`,
      certification_mark: CERTIFICATION_MARK,
    },
    certification_record: record,
    challenge_letters: caseChallenges,
    response_log: caseChallenges
      .filter((challenge) => Boolean(challenge.responseLog))
      .map((challenge) => ({
        challenge_id: challenge.id,
        challenge_label: challenge.challengeLabel,
        response_date: challenge.responseLog?.responseDate ?? "",
        response_type: challenge.responseLog?.responseType ?? "",
        updated_classification: challenge.responseLog?.updatedFinding ?? "",
      })),
    deadline_summary: caseChallenges.map((challenge) => ({
      challenge_id: challenge.id,
      challenge_label: challenge.challengeLabel,
      statutory_deadline: challenge.statutoryDeadline,
      status: deadlineStatus(challenge, today),
    })),
    timeline: buildTimeline(record, caseChallenges),
    closing_statement: CLOSING_STATEMENT,
  };
}

export function buildEvidenceBundleHtml(bundle: EvidenceBundle) {
  const record = bundle.certification_record;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(bundle.cover_page.institution_name)} evidence bundle</title>
<style>
body{margin:0;background:#071527;color:#f8f1df;font-family:Inter,Arial,sans-serif;line-height:1.6}
main{max-width:960px;margin:0 auto;padding:40px 24px}
section{break-inside:avoid;margin:0 0 24px;border:1px solid rgba(214,188,143,.35);border-radius:24px;background:#0b1b2f;padding:24px}
h1,h2{font-family:Cinzel,Georgia,serif;color:#f8e7bd;letter-spacing:.04em}
h1{font-size:36px;margin:8px 0 12px}h2{font-size:22px;margin:0 0 16px}
.eyebrow{color:#d6bc8f;font:700 11px monospace;letter-spacing:.28em;text-transform:uppercase}
dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
dt{color:#d6bc8f;font:700 10px monospace;letter-spacing:.18em;text-transform:uppercase}
dd{margin:4px 0 0;color:#fff;word-break:break-word}
.mark{display:inline-block;border:1px solid #d6bc8f;border-radius:999px;padding:8px 12px;color:#f8e7bd;font:700 12px monospace;letter-spacing:.16em}
.paper{background:#f8f1df;color:#111827;border-color:#d6bc8f}
.paper h2{color:#071527}.paper pre{white-space:pre-wrap;font:13px/1.7 Inter,Arial,sans-serif}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-top:1px solid rgba(214,188,143,.25);padding:8px;text-align:left;vertical-align:top}th{color:#d6bc8f}
@media print{body{background:#fff;color:#111}main{padding:0}section{break-inside:avoid;border-color:#c7a968;background:#fff;color:#111}.paper{background:#fff}.mark,dt,th,h1,h2,.eyebrow{color:#7a5415}}
</style>
</head>
<body>
<main>
<section>
<p class="eyebrow">The Burgess Principle evidence bundle</p>
<h1>${escapeHtml(bundle.cover_page.institution_name)}</h1>
<p class="mark">UK Certification Mark ${escapeHtml(bundle.cover_page.certification_mark)}</p>
<dl>${renderRows([
    { label: "Case reference", value: bundle.cover_page.case_reference },
    { label: "Date range", value: bundle.cover_page.date_range },
    { label: "Assessor", value: bundle.cover_page.assessor },
    {
      label: "Classification summary",
      value: bundle.cover_page.classification_summary,
    },
  ])}</dl>
</section>
<section>
<h2>Certification record</h2>
<dl>${renderRows([
    { label: "Institution", value: record.intake.institutionName },
    { label: "Process assessed", value: record.intake.processAssessed },
    { label: "Decision reference", value: record.intake.decisionReference },
    { label: "Decision type", value: record.intake.decisionType },
    { label: "Decision date", value: record.intake.decisionDate },
    { label: "Finding", value: record.classification },
    { label: "PersonGate commitment", value: record.signing?.commitment ?? "" },
  ])}</dl>
<p>${escapeHtml(record.summary)}</p>
</section>
<section>
<h2>Binary test steps</h2>
<table><tbody>${Object.entries(record.test)
    .map(
      ([key, value]) =>
        `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value.answer)}</td><td>${escapeHtml(value.evidence || "No evidence note recorded.")}</td></tr>`
    )
    .join("")}</tbody></table>
</section>
<section>
<h2>Challenge letters</h2>
${
  bundle.challenge_letters
    .map(
      (challenge) =>
        `<article class="paper"><h2>${escapeHtml(challenge.challengeLabel)}</h2><pre>${escapeHtml(challenge.plainText)}</pre></article>`
    )
    .join("") || "<p>No challenge letters recorded for this institution.</p>"
}
</section>
<section>
<h2>Response log</h2>
<table><thead><tr><th>Date</th><th>Challenge</th><th>Type</th><th>Updated classification</th></tr></thead><tbody>${bundle.response_log
    .map(
      (response) =>
        `<tr><td>${escapeHtml(response.response_date)}</td><td>${escapeHtml(response.challenge_label)}</td><td>${escapeHtml(response.response_type)}</td><td>${escapeHtml(response.updated_classification)}</td></tr>`
    )
    .join("")}</tbody></table>
</section>
<section>
<h2>Deadline summary</h2>
<table><thead><tr><th>Deadline</th><th>Challenge</th><th>Status</th></tr></thead><tbody>${bundle.deadline_summary
    .map(
      (deadline) =>
        `<tr><td>${escapeHtml(deadline.statutory_deadline)}</td><td>${escapeHtml(deadline.challenge_label)}</td><td>${escapeHtml(deadline.status)}</td></tr>`
    )
    .join("")}</tbody></table>
</section>
<section>
<h2>Timeline</h2>
<table><tbody>${bundle.timeline
    .map(
      (event) =>
        `<tr><th>${escapeHtml(event.date)}</th><td>${escapeHtml(event.label)}</td><td>${escapeHtml(event.detail)}</td></tr>`
    )
    .join("")}</tbody></table>
</section>
<section><h2>Closing statement</h2><p>${escapeHtml(bundle.closing_statement)}</p></section>
</main>
</body>
</html>`;
}
