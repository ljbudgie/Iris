const CERTIFICATION_MARK = "UK00004343685";

const AMBIGUOUS_VALUES = new Set([
  "ambiguous",
  "n/a",
  "na",
  "not applicable",
  "not known",
  "not sure",
  "tbc",
  "to be confirmed",
  "unclear",
  "unknown",
  "?",
]);

function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normaliseText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isAmbiguousText(value) {
  const text = normaliseText(value).toLowerCase();
  return text.length === 0 || AMBIGUOUS_VALUES.has(text);
}

function hasUndefinedOrAmbiguousField(record) {
  if (!isPlainRecord(record)) {
    return true;
  }

  if (
    isAmbiguousText(record.institution) ||
    isAmbiguousText(record.decisionType) ||
    isAmbiguousText(record.evidenceNote)
  ) {
    return true;
  }

  if (
    !("namedIndividual" in record) ||
    !("reviewConfirmed" in record) ||
    !("specificFactsReviewed" in record)
  ) {
    return true;
  }

  if (
    record.namedIndividual !== null &&
    isAmbiguousText(record.namedIndividual)
  ) {
    return true;
  }

  return (
    typeof record.reviewConfirmed !== "boolean" ||
    typeof record.specificFactsReviewed !== "boolean"
  );
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(value);

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  }

  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

function classify(record) {
  if (hasUndefinedOrAmbiguousField(record)) {
    return "AMBIGUOUS";
  }

  if (
    record.namedIndividual === null ||
    record.reviewConfirmed === false ||
    record.specificFactsReviewed === false
  ) {
    return "NULL";
  }

  return "SOVEREIGN";
}

function buildReasoning(record, classification) {
  if (classification === "SOVEREIGN") {
    return `The Burgess Principle binary test passed for ${record.institution}: ${record.namedIndividual} was identified, personal review was confirmed, and the specific facts were reviewed.`;
  }

  if (classification === "NULL") {
    return "The Burgess Principle binary test failed because a named individual was absent, personal review was not confirmed, or review of the specific facts was not confirmed.";
  }

  return "The Burgess Principle binary test could not be completed because at least one required field was missing, undefined, or ambiguous.";
}

export async function burgessGate(decisionRecord) {
  const timestamp = new Date().toISOString();
  const classification = classify(decisionRecord);
  const commitment = await sha256Hex(stableStringify(decisionRecord));

  return {
    classification,
    reasoning: buildReasoning(decisionRecord ?? {}, classification),
    commitment,
    timestamp,
    mark: CERTIFICATION_MARK,
  };
}
