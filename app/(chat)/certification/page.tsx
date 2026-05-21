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
  createPersonGateCommitment,
  loadCertificationRecords,
  saveCertificationRecords,
} from "@/lib/certification/local-vault";
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

export default function CertificationPage() {
  const [intake, setIntake] = useState<CertificationIntake>(initialIntake);
  const [responses, setResponses] =
    useState<BinaryTestResponses>(initialResponses);
  const [records, setRecords] = useState<CertificationRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<CertificationRecord | null>(
    null
  );
  const [storageStatus, setStorageStatus] = useState(
    "Loading encrypted vault…"
  );

  useEffect(() => {
    loadCertificationRecords()
      .then((loaded) => {
        setRecords(loaded);
        setActiveRecord(loaded[0] ?? null);
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
                className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-700 bg-card/30 p-8 text-center">
              <AwardIcon className="mx-auto size-10 text-[#d6bc8f]" />
              <p className="mt-3 text-zinc-300">
                No certificate generated yet.
              </p>
            </div>
          )}

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
