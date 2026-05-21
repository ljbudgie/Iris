import type {
  CertificationClassification,
  CertificationRecord,
} from "@/lib/certification/workflow";

export type RegisterClassificationFilter = "all" | "SOVEREIGN" | "NULL";

export type RegisterExportEntry = {
  entity: string;
  process_assessed: string;
  classification: CertificationClassification;
  summary: string;
  date: string;
  commitment_hash: string;
};

export type RegisterExportFile = {
  exported_at: string;
  total_count: number;
  entries: RegisterExportEntry[];
};

function assessmentDate(record: CertificationRecord) {
  return record.assessedAt.slice(0, 10);
}

export function buildRegisterSummary(record: CertificationRecord) {
  const entity = record.intake.institutionName || "The institution";
  const process =
    record.intake.processAssessed || "the assessed decision process";
  const date = assessmentDate(record);

  return `${entity} was assessed under The Burgess Principle. The decision process ${process} was classified ${record.classification} on ${date}.`;
}

export function buildRegisterEntry(
  record: CertificationRecord
): RegisterExportEntry {
  return {
    entity: record.intake.institutionName,
    process_assessed: record.intake.processAssessed,
    classification: record.classification,
    summary: record.summary?.trim() || buildRegisterSummary(record),
    date: assessmentDate(record),
    commitment_hash: record.signing?.commitment ?? "",
  };
}

export function filterRegisterRecords(
  records: CertificationRecord[],
  filter: RegisterClassificationFilter
) {
  if (filter === "all") {
    return records;
  }

  return records.filter((record) => record.classification === filter);
}

export function buildRegisterExport({
  records,
  filter = "all",
  exportedAt = new Date().toISOString(),
}: {
  records: CertificationRecord[];
  filter?: RegisterClassificationFilter;
  exportedAt?: string;
}): RegisterExportFile {
  const entries = filterRegisterRecords(records, filter).map(
    buildRegisterEntry
  );

  return {
    exported_at: exportedAt,
    total_count: entries.length,
    entries,
  };
}
