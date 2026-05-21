"use client";

import {
  AwardIcon,
  DownloadIcon,
  FileJsonIcon,
  PrinterIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildEvidenceBundle,
  buildEvidenceBundleHtml,
  type EvidenceBundle,
} from "@/lib/certification/evidence-bundle";
import {
  createPersonGateCommitment,
  loadCertificationRecords,
  loadStatutoryChallenges,
  saveCertificationRecords,
  saveStatutoryChallenges,
} from "@/lib/certification/local-vault";
import {
  buildRegisterExport,
  type RegisterClassificationFilter,
} from "@/lib/certification/register-export";
import {
  type BinaryAnswer,
  type BinaryTestResponses,
  buildCertificationSummary,
  buildCommitmentPayload,
  buildLedgerEntry,
  CERTIFICATION_DISCLAIMER,
  CERTIFICATION_MARK,
  type CertificationClassification,
  type CertificationIntake,
  type CertificationRecord,
  classifyCertification,
  type DecisionType,
} from "@/lib/certification/workflow";
import {
  buildChallengeRecord,
  CHALLENGE_ROUTES,
  calculateStatutoryDeadline,
  formatDate,
  type PreferredRemedy,
  type ResponseType,
  type StatutoryChallengeRecord,
  type StatutoryChallengeType,
  todayIsoDate,
} from "@/lib/challenges/workflow";
import { readPreferences } from "@/lib/setup/preferences";

const initialIntake: CertificationIntake = {
  institutionName: "",
  processAssessed: "",
  decisionReference: "",
  decisionType: "PCN",
  decisionDate: "",
  namedIndividualIdentified: false,
  assessorReference: "",
};

const initialResponses: BinaryTestResponses = {
  decisionPoint: { answer: "yes", evidence: "" },
  namedIndividual: { answer: "no", evidence: "" },
  specificFactsReview: { answer: "no", evidence: "" },
};

const remedyOptions: { label: string; value: PreferredRemedy }[] = [
  { label: "Compliance", value: "compliance" },
  { label: "Rectification", value: "rectification" },
  { label: "Erasure", value: "erasure" },
  { label: "Compensation", value: "compensation" },
  { label: "Combination", value: "combination" },
];

const responseTypeOptions: { label: string; value: ResponseType }[] = [
  { label: "Substantive", value: "substantive" },
  { label: "Holding", value: "holding" },
  { label: "No response", value: "no response" },
];

function isChallengeable(record: CertificationRecord | null) {
  return (
    record?.classification === "NULL" || record?.classification === "AMBIGUOUS"
  );
}

function classificationClass(classification: CertificationClassification) {
  if (classification === "SOVEREIGN") {
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  }

  if (classification === "NULL") {
    return "border-red-400/40 bg-red-500/10 text-red-200";
  }

  return "border-amber-300/40 bg-amber-400/10 text-amber-100";
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function copyText(value: string) {
  navigator.clipboard?.writeText(value);
}

function deadlineClass(deadline: string) {
  const today = todayIsoDate();
  if (deadline < today) {
    return "border-red-400/50 bg-red-500/10 text-red-100";
  }

  return "border-[#d6bc8f]/30 bg-[#d6bc8f]/10 text-[#f8e7bd]";
}

function registerSummary(record: CertificationRecord) {
  return `${record.intake.institutionName} was assessed under The Burgess Principle. The decision process ${record.intake.processAssessed} was classified ${record.classification} on ${record.assessedAt.slice(0, 10)}.`;
}

function AnswerToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BinaryAnswer;
  onChange: (value: BinaryAnswer) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm text-zinc-200">{label}</p>
      <div className="flex gap-2">
        {(["yes", "no"] as const).map((answer) => (
          <button
            className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition ${
              value === answer
                ? "border-[#d6bc8f] bg-[#d6bc8f]/15 text-[#f8e7bd]"
                : "border-zinc-700 bg-zinc-950/40 text-zinc-400 hover:border-zinc-500"
            }`}
            key={answer}
            onClick={() => onChange(answer)}
            type="button"
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
}

function Certificate({ record }: { record: CertificationRecord }) {
  return (
    <article
      className="print:cert-print rounded-3xl border border-[#d6bc8f]/30 bg-[#08080c] p-6 shadow-[0_0_40px_rgba(214,188,143,0.08)]"
      id="institutional-certificate"
    >
      <div className="mb-6 flex flex-col gap-4 border-[#d6bc8f]/20 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.32em]">
            The Burgess Principle
          </p>
          <h2 className="mt-2 font-semibold text-2xl text-zinc-50">
            Institutional Certification
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {record.intake.institutionName} ·{" "}
            {record.intake.decisionReference || record.id}
          </p>
        </div>
        <div className="rounded-2xl border border-[#d6bc8f]/40 bg-[#d6bc8f]/10 px-4 py-3 text-right">
          <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.2em]">
            UK Certification Mark
          </p>
          <p className="mt-1 font-semibold text-lg text-zinc-50">
            {CERTIFICATION_MARK}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div
            className={`inline-flex rounded-full border px-4 py-2 font-mono font-semibold text-sm tracking-[0.2em] ${classificationClass(record.classification)}`}
          >
            {record.classification}
          </div>
          <p className="text-sm text-zinc-300 leading-6">{record.summary}</p>
          <p className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-zinc-400 text-xs leading-5">
            {CERTIFICATION_DISCLAIMER}
          </p>
        </div>

        <dl className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm">
          <div>
            <dt className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
              Decision process
            </dt>
            <dd className="text-zinc-200">{record.intake.processAssessed}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
              Decision type / date
            </dt>
            <dd className="text-zinc-200">
              {record.intake.decisionType} · {record.intake.decisionDate}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
              Assessment timestamp
            </dt>
            <dd className="text-zinc-200">{record.assessedAt}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
              Assessor reference
            </dt>
            <dd className="text-zinc-200">{record.intake.assessorReference}</dd>
          </div>
          {record.signing?.commitment && (
            <div>
              <dt className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
                Commitment hash (PersonGate)
              </dt>
              <dd className="break-all font-mono text-[#d6bc8f] text-xs">
                {record.signing.commitment}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}

function ChallengeDocument({
  challenge,
}: {
  challenge: StatutoryChallengeRecord;
}) {
  return (
    <article
      className="print:cert-print rounded-3xl border border-[#d6bc8f]/35 bg-[#f8f1df] p-6 text-[#111827] shadow-[0_0_40px_rgba(214,188,143,0.12)]"
      id="statutory-challenge-letter"
    >
      <div className="mb-6 border-[#a67c38]/40 border-b pb-4">
        <p className="font-mono text-[#8a5f16] text-xs uppercase tracking-[0.32em]">
          The Burgess Principle
        </p>
        <h2 className="mt-2 font-semibold text-2xl text-[#071527]">
          Statutory Challenge Notice
        </h2>
        <p className="mt-1 text-[#334155] text-sm">
          {challenge.challengeLabel}
        </p>
      </div>

      <div className="space-y-3 whitespace-pre-wrap text-sm leading-7">
        {challenge.plainText}
      </div>
    </article>
  );
}

function EvidenceBundlePreview({ bundle }: { bundle: EvidenceBundle }) {
  return (
    <article className="print:cert-print rounded-3xl border border-[#d6bc8f]/35 bg-[#071527] p-6 text-[#f8f1df] shadow-[0_0_40px_rgba(214,188,143,0.12)]">
      <div className="mb-6 flex flex-col gap-4 border-[#d6bc8f]/25 border-b pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.32em]">
            The Burgess Principle evidence bundle
          </p>
          <h2 className="mt-2 font-semibold text-2xl text-[#f8e7bd]">
            {bundle.cover_page.institution_name}
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            {bundle.cover_page.case_reference} · {bundle.cover_page.date_range}
          </p>
        </div>
        <div className="rounded-2xl border border-[#d6bc8f]/40 bg-[#d6bc8f]/10 px-4 py-3 text-right">
          <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.2em]">
            UK Certification Mark
          </p>
          <p className="mt-1 font-semibold text-lg text-zinc-50">
            {bundle.cover_page.certification_mark}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#d6bc8f]/25 bg-[#0b1b2f] p-4">
          <p className="font-mono text-[#d6bc8f] text-[10px] uppercase tracking-[0.18em]">
            Classification
          </p>
          <p className="mt-2 text-sm leading-6">
            {bundle.cover_page.classification_summary}
          </p>
        </div>
        <div className="rounded-2xl border border-[#d6bc8f]/25 bg-[#0b1b2f] p-4">
          <p className="font-mono text-[#d6bc8f] text-[10px] uppercase tracking-[0.18em]">
            Challenge letters
          </p>
          <p className="mt-2 font-semibold text-2xl">
            {bundle.challenge_letters.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#d6bc8f]/25 bg-[#0b1b2f] p-4">
          <p className="font-mono text-[#d6bc8f] text-[10px] uppercase tracking-[0.18em]">
            Timeline events
          </p>
          <p className="mt-2 font-semibold text-2xl">
            {bundle.timeline.length}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <h3 className="font-semibold text-[#f8e7bd] text-lg">Timeline</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <tbody>
              {bundle.timeline.map((event) => (
                <tr
                  className="border-[#d6bc8f]/15 border-t"
                  key={`${event.date}-${event.label}-${event.detail}`}
                >
                  <th className="py-2 pr-3 font-mono text-[#d6bc8f] text-xs">
                    {event.date}
                  </th>
                  <td className="py-2 pr-3 text-zinc-100">{event.label}</td>
                  <td className="py-2 text-zinc-300">{event.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-5 rounded-2xl border border-[#d6bc8f]/20 bg-[#d6bc8f]/10 p-4 text-sm leading-6">
        {bundle.closing_statement}
      </p>
    </article>
  );
}

export default function CertificationPage() {
  const [intake, setIntake] = useState<CertificationIntake>(initialIntake);
  const [responses, setResponses] =
    useState<BinaryTestResponses>(initialResponses);
  const [records, setRecords] = useState<CertificationRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<CertificationRecord | null>(
    null
  );
  const [challenges, setChallenges] = useState<StatutoryChallengeRecord[]>([]);
  const [activeChallenge, setActiveChallenge] =
    useState<StatutoryChallengeRecord | null>(null);
  const [selectedChallengeTypes, setSelectedChallengeTypes] = useState<
    StatutoryChallengeType[]
  >([]);
  const [institutionAddress, setInstitutionAddress] = useState("");
  const [submissionDate, setSubmissionDate] = useState(todayIsoDate());
  const [preferredRemedy, setPreferredRemedy] =
    useState<PreferredRemedy>("combination");
  const [reasonableAdjustmentEmailOnly, setReasonableAdjustmentEmailOnly] =
    useState(false);
  const [registerFilter, setRegisterFilter] =
    useState<RegisterClassificationFilter>("all");
  const [selectedRegisterIds, setSelectedRegisterIds] = useState<string[]>([]);
  const [evidenceBundle, setEvidenceBundle] = useState<EvidenceBundle | null>(
    null
  );
  const [storageStatus, setStorageStatus] = useState(
    "Loading encrypted vault…"
  );

  useEffect(() => {
    Promise.all([loadCertificationRecords(), loadStatutoryChallenges()])
      .then(([loadedRecords, loadedChallenges]) => {
        const preferences = readPreferences();
        setRecords(loadedRecords);
        setActiveRecord(loadedRecords[0] ?? null);
        setSelectedRegisterIds(loadedRecords.map((record) => record.id));
        setChallenges(loadedChallenges);
        setActiveChallenge(loadedChallenges[0] ?? null);
        setReasonableAdjustmentEmailOnly(
          Boolean(preferences.reasonableAdjustmentEmailOnly)
        );
        setStorageStatus("Local AES-256-GCM vault ready");
      })
      .catch(() => {
        setStorageStatus("Unable to unlock local certification vault");
      });
  }, []);

  const classification = useMemo(
    () => classifyCertification(responses),
    [responses]
  );

  const updateResponse = (
    key: keyof BinaryTestResponses,
    patch: Partial<BinaryTestResponses[keyof BinaryTestResponses]>
  ) => {
    setResponses((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  };

  const completeCertification = async () => {
    const assessedAt = new Date().toISOString();
    const assessorReference =
      intake.assessorReference ||
      `IRIS-CERT-${Date.now().toString(36).toUpperCase()}`;
    const completeIntake = { ...intake, assessorReference };
    const summary = buildCertificationSummary({
      intake: completeIntake,
      responses,
      classification,
    });
    const payload = buildCommitmentPayload({
      intake: completeIntake,
      responses,
      classification,
      assessedAt,
    });
    const commitment = await createPersonGateCommitment(
      `Institutional certification: ${completeIntake.institutionName}`,
      payload
    );
    const record: CertificationRecord = {
      id: crypto.randomUUID(),
      intake: completeIntake,
      test: responses,
      classification,
      summary,
      assessedAt,
      signing: {
        commitment,
        algorithm: "SHA-256",
        provider: "PersonGate",
        label: "Commitment hash (PersonGate)",
        createdAt: assessedAt,
      },
    };
    const nextRecords = [record, ...records];
    await saveCertificationRecords(nextRecords);
    setRecords(nextRecords);
    setActiveRecord(record);
    setSelectedRegisterIds((current) => [record.id, ...current]);
    setStorageStatus("Certification saved locally with AES-256-GCM");
  };

  const canComplete =
    intake.institutionName.trim() &&
    intake.processAssessed.trim() &&
    intake.decisionDate.trim();

  const exportPrintable = (record: CertificationRecord) => {
    setActiveRecord(record);
    window.setTimeout(() => window.print(), 50);
  };

  const exportChallengePrintable = (challenge: StatutoryChallengeRecord) => {
    setActiveChallenge(challenge);
    window.setTimeout(() => window.print(), 50);
  };

  const toggleRegisterRecord = (recordId: string) => {
    setSelectedRegisterIds((current) =>
      current.includes(recordId)
        ? current.filter((item) => item !== recordId)
        : [...current, recordId]
    );
  };

  const filteredRegisterRecords = records.filter(
    (record) =>
      registerFilter === "all" || record.classification === registerFilter
  );
  const selectedRegisterRecords = filteredRegisterRecords.filter((record) =>
    selectedRegisterIds.includes(record.id)
  );

  const exportRegister = () => {
    downloadJson(
      "burgess-register-export.json",
      buildRegisterExport({ records: selectedRegisterRecords })
    );
  };

  const createEvidenceBundle = (record: CertificationRecord) => {
    const bundle = buildEvidenceBundle({
      record,
      challenges,
      producedAt: new Date().toISOString(),
      today: todayIsoDate(),
    });
    setEvidenceBundle(bundle);
    setActiveRecord(record);
  };

  const printEvidenceBundle = () => {
    window.setTimeout(() => window.print(), 50);
  };

  const toggleChallengeType = (challengeType: StatutoryChallengeType) => {
    setSelectedChallengeTypes((current) =>
      current.includes(challengeType)
        ? current.filter((item) => item !== challengeType)
        : [...current, challengeType]
    );
  };

  const generateChallenges = async () => {
    if (!activeRecord || !isChallengeable(activeRecord)) {
      return;
    }

    const createdAt = new Date().toISOString();
    const generated = selectedChallengeTypes.map((challengeType) =>
      buildChallengeRecord({
        id: crypto.randomUUID(),
        record: activeRecord,
        challengeType,
        submissionDate,
        institutionAddress,
        preferredRemedy,
        reasonableAdjustmentEmailOnly,
        createdAt,
      })
    );
    const nextChallenges = [...generated, ...challenges];
    await saveStatutoryChallenges(nextChallenges);
    setChallenges(nextChallenges);
    setActiveChallenge(generated[0] ?? null);
    setStorageStatus("Statutory challenge saved locally with AES-256-GCM");
  };

  const updateChallenge = async (
    challenge: StatutoryChallengeRecord,
    patch: Partial<StatutoryChallengeRecord>
  ) => {
    const nextChallenge = { ...challenge, ...patch };
    const nextChallenges = challenges.map((item) =>
      item.id === challenge.id ? nextChallenge : item
    );
    await saveStatutoryChallenges(nextChallenges);
    setChallenges(nextChallenges);
    setActiveChallenge((current) =>
      current?.id === challenge.id ? nextChallenge : current
    );
  };

  const activeDeadlines = challenges
    .filter(
      (challenge) => challenge.responseLog?.updatedFinding !== "SOVEREIGN"
    )
    .sort((left, right) =>
      left.statutoryDeadline.localeCompare(right.statutoryDeadline)
    );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-[#d6bc8f]/25 bg-[linear-gradient(135deg,rgba(8,8,12,0.96),rgba(15,118,110,0.16))] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.32em]">
              Sovereign institutional workflow
            </p>
            <h1 className="mt-3 font-semibold text-3xl text-zinc-50">
              Institutional Certification
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 leading-6">
              Run the Burgess Principle binary test locally, generate a
              printable certificate, and store completed assessments in an
              encrypted on-device vault. Nothing is transmitted externally.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#0f766e]/35 bg-[#0f766e]/10 px-4 py-3 text-[#8af5e8] text-sm">
            <ShieldCheckIcon className="size-5" />
            <span>{storageStatus}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="space-y-6 rounded-3xl border border-zinc-800 bg-card/50 p-5">
          <div>
            <h2 className="font-semibold text-xl">1. Certification intake</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Structured local-only case details. Required fields are marked.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2" htmlFor="institution-name">
              <span className="text-sm">Institution name *</span>
              <Input
                id="institution-name"
                onChange={(event) =>
                  setIntake({ ...intake, institutionName: event.target.value })
                }
                value={intake.institutionName}
              />
            </label>
            <label className="space-y-2" htmlFor="process-assessed">
              <span className="text-sm">Decision process being assessed *</span>
              <Input
                id="process-assessed"
                onChange={(event) =>
                  setIntake({ ...intake, processAssessed: event.target.value })
                }
                value={intake.processAssessed}
              />
            </label>
            <label className="space-y-2" htmlFor="decision-reference">
              <span className="text-sm">Decision reference</span>
              <Input
                id="decision-reference"
                onChange={(event) =>
                  setIntake({
                    ...intake,
                    decisionReference: event.target.value,
                  })
                }
                value={intake.decisionReference}
              />
            </label>
            <label className="space-y-2" htmlFor="decision-type">
              <span className="text-sm">Decision type</span>
              <select
                className="h-9 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                id="decision-type"
                onChange={(event) =>
                  setIntake({
                    ...intake,
                    decisionType: event.target.value as DecisionType,
                  })
                }
                value={intake.decisionType}
              >
                <option>PCN</option>
                <option>SAR</option>
                <option>credit marker</option>
                <option>warrant</option>
                <option>other</option>
              </select>
            </label>
            <label className="space-y-2" htmlFor="decision-date">
              <span className="text-sm">Date of decision *</span>
              <Input
                id="decision-date"
                onChange={(event) =>
                  setIntake({ ...intake, decisionDate: event.target.value })
                }
                type="date"
                value={intake.decisionDate}
              />
            </label>
            <label className="space-y-2" htmlFor="assessor-reference">
              <span className="text-sm">Assessor reference</span>
              <Input
                id="assessor-reference"
                onChange={(event) =>
                  setIntake({
                    ...intake,
                    assessorReference: event.target.value,
                  })
                }
                placeholder="Auto-generated if left blank"
                value={intake.assessorReference}
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-sm">
            <input
              checked={intake.namedIndividualIdentified}
              onChange={(event) => {
                setIntake({
                  ...intake,
                  namedIndividualIdentified: event.target.checked,
                });
                updateResponse("namedIndividual", {
                  answer: event.target.checked ? "yes" : "no",
                });
              }}
              type="checkbox"
            />
            A named individual has been identified
          </label>

          <div className="border-zinc-800 border-t pt-5">
            <h2 className="font-semibold text-xl">2. Binary test runner</h2>
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/35 p-4">
                <AnswerToggle
                  label="Can the exact decision point be identified?"
                  onChange={(answer) =>
                    updateResponse("decisionPoint", { answer })
                  }
                  value={responses.decisionPoint.answer}
                />
                <Textarea
                  className="mt-3"
                  onChange={(event) =>
                    updateResponse("decisionPoint", {
                      evidence: event.target.value,
                    })
                  }
                  placeholder="Optional evidence note"
                  value={responses.decisionPoint.evidence}
                />
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/35 p-4">
                <AnswerToggle
                  label="Has a named individual been identified?"
                  onChange={(answer) => {
                    updateResponse("namedIndividual", { answer });
                    setIntake({
                      ...intake,
                      namedIndividualIdentified: answer === "yes",
                    });
                  }}
                  value={responses.namedIndividual.answer}
                />
                <Textarea
                  className="mt-3"
                  onChange={(event) =>
                    updateResponse("namedIndividual", {
                      evidence: event.target.value,
                    })
                  }
                  placeholder="Optional evidence note, or confirmation of absence"
                  value={responses.namedIndividual.evidence}
                />
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/35 p-4">
                <AnswerToggle
                  label="Is there evidence of individual review of the specific facts?"
                  onChange={(answer) =>
                    updateResponse("specificFactsReview", { answer })
                  }
                  value={responses.specificFactsReview.answer}
                />
                <Textarea
                  className="mt-3"
                  onChange={(event) =>
                    updateResponse("specificFactsReview", {
                      evidence: event.target.value,
                    })
                  }
                  placeholder="Optional evidence note"
                  value={responses.specificFactsReview.evidence}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6bc8f]/25 bg-[#d6bc8f]/10 p-4">
            <div>
              <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.2em]">
                Current classification
              </p>
              <p className="mt-1 font-semibold text-2xl">{classification}</p>
            </div>
            <Button disabled={!canComplete} onClick={completeCertification}>
              Complete certification
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          {activeRecord ? (
            <>
              <Certificate record={activeRecord} />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => exportPrintable(activeRecord)}
                  variant="outline"
                >
                  <PrinterIcon className="size-4" />
                  Print / save PDF
                </Button>
                <Button
                  onClick={() =>
                    downloadJson(
                      `certification-${activeRecord.id}.json`,
                      activeRecord
                    )
                  }
                  variant="outline"
                >
                  <DownloadIcon className="size-4" />
                  Export record JSON
                </Button>
                <Button
                  onClick={() =>
                    downloadJson(
                      `ledger-${activeRecord.id}.json`,
                      buildLedgerEntry(activeRecord)
                    )
                  }
                  variant="outline"
                >
                  <FileJsonIcon className="size-4" />
                  Ledger JSON
                </Button>
                <Button
                  onClick={() => createEvidenceBundle(activeRecord)}
                  variant="outline"
                >
                  <FileJsonIcon className="size-4" />
                  Build Evidence Bundle
                </Button>
              </div>
              {isChallengeable(activeRecord) && (
                <div className="rounded-3xl border border-[#d6bc8f]/25 bg-[#08080c]/80 p-5">
                  <div>
                    <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.24em]">
                      Statutory challenge generator
                    </p>
                    <h2 className="mt-2 font-semibold text-xl">
                      Generate notices from this {activeRecord.classification}{" "}
                      certification
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Select one or more routes. Each route creates a separate
                      encrypted local record with plain text, printable HTML,
                      and JSON output.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {CHALLENGE_ROUTES.map((route) => (
                      <label
                        className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/35 p-3 text-sm transition hover:border-[#d6bc8f]/40"
                        key={route.type}
                      >
                        <input
                          checked={selectedChallengeTypes.includes(route.type)}
                          onChange={() => toggleChallengeType(route.type)}
                          type="checkbox"
                        />
                        <span>{route.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2" htmlFor="institution-address">
                      <span className="text-sm">Institution address</span>
                      <Textarea
                        id="institution-address"
                        onChange={(event) =>
                          setInstitutionAddress(event.target.value)
                        }
                        placeholder="Optional postal address"
                        value={institutionAddress}
                      />
                    </label>
                    <div className="grid gap-4">
                      <label className="space-y-2" htmlFor="submission-date">
                        <span className="text-sm">Submission date</span>
                        <Input
                          id="submission-date"
                          onChange={(event) =>
                            setSubmissionDate(event.target.value)
                          }
                          type="date"
                          value={submissionDate}
                        />
                      </label>
                      <label className="space-y-2" htmlFor="preferred-remedy">
                        <span className="text-sm">Preferred remedy</span>
                        <select
                          className="h-9 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          id="preferred-remedy"
                          onChange={(event) =>
                            setPreferredRemedy(
                              event.target.value as PreferredRemedy
                            )
                          }
                          value={preferredRemedy}
                        >
                          {remedyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/35 p-3 text-sm">
                    <input
                      checked={reasonableAdjustmentEmailOnly}
                      onChange={(event) =>
                        setReasonableAdjustmentEmailOnly(event.target.checked)
                      }
                      type="checkbox"
                    />
                    Reasonable adjustment on file: email only
                  </label>

                  {selectedChallengeTypes.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/35 p-3">
                      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.18em]">
                        Calculated deadlines
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-zinc-300">
                        {selectedChallengeTypes.map((type) => {
                          const route = CHALLENGE_ROUTES.find(
                            (item) => item.type === type
                          );
                          return (
                            <p key={type}>
                              {route?.label}:{" "}
                              {formatDate(
                                calculateStatutoryDeadline(submissionDate, type)
                              )}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    className="mt-4"
                    disabled={selectedChallengeTypes.length === 0}
                    onClick={generateChallenges}
                  >
                    Generate selected challenge documents
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-700 bg-card/30 p-8 text-center">
              <AwardIcon className="mx-auto size-10 text-[#d6bc8f]" />
              <p className="mt-3 text-zinc-300">
                No certificate generated yet.
              </p>
            </div>
          )}

          {activeChallenge && (
            <div className="space-y-4 rounded-3xl border border-zinc-800 bg-card/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.24em]">
                    Challenge output
                  </p>
                  <h2 className="mt-2 font-semibold text-xl">
                    {activeChallenge.challengeLabel}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Deadline: {formatDate(activeChallenge.statutoryDeadline)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => exportChallengePrintable(activeChallenge)}
                    variant="outline"
                  >
                    <PrinterIcon className="size-4" />
                    Print letter
                  </Button>
                  <Button
                    onClick={() => copyText(activeChallenge.plainText)}
                    variant="outline"
                  >
                    Copy plain text
                  </Button>
                  <Button
                    onClick={() =>
                      downloadJson(
                        `statutory-challenge-${activeChallenge.id}.json`,
                        activeChallenge
                      )
                    }
                    variant="outline"
                  >
                    <FileJsonIcon className="size-4" />
                    JSON
                  </Button>
                </div>
              </div>

              <ChallengeDocument challenge={activeChallenge} />

              <label className="block space-y-2" htmlFor="plain-text-copy">
                <span className="text-sm">Plain text copy</span>
                <Textarea
                  className="min-h-64 font-mono text-xs"
                  id="plain-text-copy"
                  readOnly
                  value={activeChallenge.plainText}
                />
              </label>
            </div>
          )}

          {evidenceBundle && (
            <div className="space-y-4 rounded-3xl border border-[#d6bc8f]/25 bg-card/50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.24em]">
                    Evidence bundle builder
                  </p>
                  <h2 className="mt-2 font-semibold text-xl">
                    {evidenceBundle.cover_page.institution_name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Printable HTML, browser PDF, and JSON export. All records
                    remain local.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={printEvidenceBundle} variant="outline">
                    <PrinterIcon className="size-4" />
                    Print / save PDF
                  </Button>
                  <Button
                    onClick={() =>
                      downloadText(
                        `evidence-bundle-${evidenceBundle.certification_record.id}.html`,
                        buildEvidenceBundleHtml(evidenceBundle),
                        "text/html"
                      )
                    }
                    variant="outline"
                  >
                    <DownloadIcon className="size-4" />
                    HTML
                  </Button>
                  <Button
                    onClick={() =>
                      downloadJson(
                        `evidence-bundle-${evidenceBundle.certification_record.id}.json`,
                        evidenceBundle
                      )
                    }
                    variant="outline"
                  >
                    <FileJsonIcon className="size-4" />
                    JSON
                  </Button>
                </div>
              </div>

              <EvidenceBundlePreview bundle={evidenceBundle} />
            </div>
          )}

          <div className="rounded-3xl border border-zinc-800 bg-card/50 p-5">
            <div>
              <h2 className="font-semibold text-xl">Deadline dashboard</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Active statutory challenges are sorted by urgency. Overdue
                deadlines are flagged in red.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {activeDeadlines.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No active statutory challenge deadlines.
                </p>
              ) : (
                activeDeadlines.map((challenge) => (
                  <div
                    className={`rounded-2xl border p-3 ${deadlineClass(
                      challenge.statutoryDeadline
                    )}`}
                    key={challenge.id}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setActiveChallenge(challenge)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {challenge.institutionName}
                          </p>
                          <p className="mt-1 text-sm opacity-80">
                            {challenge.challengeLabel}
                          </p>
                        </div>
                        <p className="font-mono text-xs uppercase tracking-[0.18em]">
                          {formatDate(challenge.statutoryDeadline)}
                        </p>
                      </div>
                    </button>

                    <div className="mt-3 grid gap-3 border-current/20 border-t pt-3 md:grid-cols-3">
                      <label
                        className="space-y-2"
                        htmlFor={`response-date-${challenge.id}`}
                      >
                        <span className="text-xs">Response date</span>
                        <Input
                          id={`response-date-${challenge.id}`}
                          onChange={(event) =>
                            updateChallenge(challenge, {
                              responseLog: {
                                responseDate: event.target.value,
                                responseType:
                                  challenge.responseLog?.responseType ??
                                  "substantive",
                                updatedFinding:
                                  challenge.responseLog?.updatedFinding ??
                                  "NULL",
                              },
                            })
                          }
                          type="date"
                          value={challenge.responseLog?.responseDate ?? ""}
                        />
                      </label>
                      <label
                        className="space-y-2"
                        htmlFor={`response-type-${challenge.id}`}
                      >
                        <span className="text-xs">Response type</span>
                        <select
                          className="h-9 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          id={`response-type-${challenge.id}`}
                          onChange={(event) =>
                            updateChallenge(challenge, {
                              responseLog: {
                                responseDate:
                                  challenge.responseLog?.responseDate ??
                                  todayIsoDate(),
                                responseType: event.target
                                  .value as ResponseType,
                                updatedFinding:
                                  challenge.responseLog?.updatedFinding ??
                                  "NULL",
                              },
                            })
                          }
                          value={
                            challenge.responseLog?.responseType ?? "substantive"
                          }
                        >
                          {responseTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label
                        className="space-y-2"
                        htmlFor={`updated-finding-${challenge.id}`}
                      >
                        <span className="text-xs">NULL finding updated</span>
                        <select
                          className="h-9 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          id={`updated-finding-${challenge.id}`}
                          onChange={(event) =>
                            updateChallenge(challenge, {
                              responseLog: {
                                responseDate:
                                  challenge.responseLog?.responseDate ??
                                  todayIsoDate(),
                                responseType:
                                  challenge.responseLog?.responseType ??
                                  "substantive",
                                updatedFinding: event.target.value as
                                  | "SOVEREIGN"
                                  | "NULL",
                              },
                            })
                          }
                          value={
                            challenge.responseLog?.updatedFinding ?? "NULL"
                          }
                        >
                          <option value="NULL">NULL maintained</option>
                          <option value="SOVEREIGN">
                            SOVEREIGN if resolved
                          </option>
                        </select>
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-card/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-xl">
                  History and case management
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Completed certifications are encrypted locally with
                  AES-256-GCM.
                </p>
              </div>
              <Button
                disabled={records.length === 0}
                onClick={() =>
                  downloadJson("all-institutional-certifications.json", records)
                }
                variant="outline"
              >
                Bulk export
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-[#d6bc8f]/25 bg-[#08080c]/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.24em]">
                    Institutional register export
                  </p>
                  <h3 className="mt-2 font-semibold text-lg">
                    Framer CMS-ready JSON
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Preview completed vault records, deselect entries, and
                    export burgess-register-export.json locally.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-9 rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    onChange={(event) =>
                      setRegisterFilter(
                        event.target.value as RegisterClassificationFilter
                      )
                    }
                    value={registerFilter}
                  >
                    <option value="all">All classifications</option>
                    <option value="SOVEREIGN">SOVEREIGN only</option>
                    <option value="NULL">NULL only</option>
                  </select>
                  <Button
                    disabled={selectedRegisterRecords.length === 0}
                    onClick={exportRegister}
                    variant="outline"
                  >
                    <DownloadIcon className="size-4" />
                    Export register
                  </Button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-zinc-800 border-b text-zinc-400">
                      <th className="py-2 pr-3">Include</th>
                      <th className="py-2 pr-3">Entity</th>
                      <th className="py-2 pr-3">Process</th>
                      <th className="py-2 pr-3">Classification</th>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegisterRecords.length === 0 ? (
                      <tr>
                        <td className="py-3 text-zinc-500" colSpan={6}>
                          No completed certifications match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRegisterRecords.map((record) => (
                        <tr
                          className="border-zinc-900 border-t"
                          key={record.id}
                        >
                          <td className="py-2 pr-3">
                            <input
                              checked={selectedRegisterIds.includes(record.id)}
                              onChange={() => toggleRegisterRecord(record.id)}
                              type="checkbox"
                            />
                          </td>
                          <td className="py-2 pr-3 text-zinc-200">
                            {record.intake.institutionName}
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">
                            {record.intake.processAssessed}
                          </td>
                          <td className="py-2 pr-3">
                            <span
                              className={`rounded-full border px-2 py-1 font-mono text-[10px] ${classificationClass(record.classification)}`}
                            >
                              {record.classification}
                            </span>
                          </td>
                          <td className="py-2 pr-3 font-mono text-zinc-400 text-xs">
                            {record.assessedAt.slice(0, 10)}
                          </td>
                          <td className="py-2 text-zinc-400">
                            {record.summary || registerSummary(record)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-zinc-500 text-xs">
                Export header includes timestamp and total count. No external
                transmission is performed.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {records.length === 0 ? (
                <p className="text-sm text-zinc-500">No saved assessments.</p>
              ) : (
                records.map((record) => (
                  <button
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/35 p-3 text-left transition hover:border-[#d6bc8f]/40"
                    key={record.id}
                    onClick={() => setActiveRecord(record)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-zinc-200">
                        {record.intake.institutionName}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-1 font-mono text-[10px] ${classificationClass(record.classification)}`}
                      >
                        {record.classification}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {record.intake.processAssessed} ·{" "}
                      {new Date(record.assessedAt).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
