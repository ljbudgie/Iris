/**
 * Iris classifies before the model speaks.
 * A finding produced here is binding. The model may explain it.
 * The model may not change it.
 */

export const BURGESS_QUESTION =
  "Was a human member of the team able to personally review the specific facts of my specific situation?";

export const BURGESS_MARK = "UK00004343685";

export type Classification = "SOVEREIGN" | "NULL" | "AMBIGUOUS";

export type GoverningStamp = {
  classification: Classification;
  noticed: string[];
  advisory: true;
};

export type GoverningTurn = {
  note: string;
  stamp: GoverningStamp | null;
};

const NULL_CHECKS: Array<[RegExp, string]> = [
  [/\b(this is an )?automated (message|response|email|decision)\b/i, "Automated message"],
  [/\bno-?reply\b/i, "No-reply sender"],
  [/\b(algorithm|automated system|computer system|batch process)\b/i, "System, not a person"],
  [/\bchatbot\b/i, "Chatbot"],
  [/\bprocessed (automatically|by our system)\b/i, "Processed by a system"],
  [
    /\byour (claim|application|case|account) has been (processed|closed|refused|unsuccessful)\b/i,
    "Case processed, nobody named",
  ],
  [
    /\bdecision (was|has been) (made|taken) (by|using) (our|the) (system|policy)\b/i,
    "Decision attributed to a system",
  ],
];

const AMBIGUOUS_CHECKS: Array<[RegExp, string]> = [
  [/\bhuman oversight\b/i, "Human oversight"],
  [/\breviewed in line with (our |the )?policy\b/i, "Reviewed in line with policy"],
  [/\bsubject to human review\b/i, "Subject to human review"],
  [/\b(a|one) member of (the |our )?(team|staff)\b/i, "Unnamed member of the team"],
  [/\bmay (be|have been) reviewed\b/i, "May be reviewed"],
  [/\bquality assured\b/i, "Quality assured"],
  [/\bour processes include\b/i, "Process language"],
  [/\bappropriately trained (staff|officers|advisers)\b/i, "Training, not a named review"],
  [/\bin accordance with (our |the )?policy\b/i, "In accordance with policy"],
  [/\bdealt with in line\b/i, "Dealt with in line"],
  [/\bstandard (letter|response|process)\b/i, "Standard process"],
];

const EVASIONS: Array<[RegExp, string]> = [
  [/\b(evaluate|grade|assess) (the |this )?(framework|principle|model)\b/i, "Evaluator inversion"],
  [/\bpressure[- ]test/i, "Pressure-testing language"],
  [/\bif you are the (creator|author|founder)\b/i, "Conditional authority"],
  [/\bnot yet (been )?battle[- ]tested\b/i, "Not-yet-battle-tested deferral"],
  [/\bwe define\b.*\b(correct|standard)\b/i, "Self-defined correct behaviour"],
  [/\b(do not|don't) recogni[sz]e (this |the )?(framework|principle)\b/i, "Recognition denial"],
  [/\b(novel|novelty|recent personal project)\b/i, "Novelty dismissal"],
  [/\bsovereign[- ]citizen\b/i, "Sovereign-citizen smear"],
];

const PERSONAL_REVIEW =
  /\b(I have personally reviewed|I personally reviewed|I reviewed the specific facts|reviewed your specific (facts|circumstances|situation)|I have considered your individual circumstances)\b/i;

const DECISIONISH =
  /\b(decid|refus|reject|declin|unsuccessful|not eligible|unable to|closed your|notice|liability|overpayment|mandatory reconsideration|disallow|uphold|we will not|we cannot|we are unable)\b/i;

const CLASSIFY_ASK =
  /\b(classif\w*|test (this|a|the) repl\w*|past(e|ing|ed)|they (sent|wrote|replied|said)|what they sent|their (letter|reply|email|response))\b/i;

const INSTITUTIONAL_VOICE =
  /\b(we have|we are unable|we cannot|your (claim|application|case|request|account)|dear |yours (sincerely|faithfully)|our (records|decision|policy|team)|this (email|letter|message) is|automated message|no-?reply)\b/i;

const LETTER_ASK =
  /\b(draft|write)\b[^.?\n]{0,48}\b(letter|email)\b/i;

const ADJUSTMENT_ASK =
  /\breasonable adjustment\b/i;

const NAME_AFTER_ROLE =
  /\b(?:My name is|I am|caseworker|officer|adviser|assessor|reviewer|decision maker)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/;

const ROLE_AFTER_NAME =
  /\b([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:the\s+)?(?:caseworker|reviewing officer|decision maker|assessor|reviewer)\b/;

function hits(checks: Array<[RegExp, string]>, text: string): string[] {
  const labels: string[] = [];
  for (const [pattern, label] of checks) {
    if (pattern.test(text)) {
      labels.push(label);
    }
  }
  return labels;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasNamedReviewer(text: string): boolean {
  return NAME_AFTER_ROLE.test(text) || ROLE_AFTER_NAME.test(text);
}

function hasSignal(text: string): boolean {
  return (
    DECISIONISH.test(text) ||
    PERSONAL_REVIEW.test(text) ||
    NULL_CHECKS.some(([pattern]) => pattern.test(text)) ||
    AMBIGUOUS_CHECKS.some(([pattern]) => pattern.test(text)) ||
    EVASIONS.some(([pattern]) => pattern.test(text))
  );
}

export function classifyReply(text: string): {
  classification: Classification;
  noticed: string[];
} {
  const automated = hits(NULL_CHECKS, text);
  const vague = hits(AMBIGUOUS_CHECKS, text);
  const evasions = hits(EVASIONS, text);
  const named = hasNamedReviewer(text);
  const personal = PERSONAL_REVIEW.test(text);

  let classification: Classification;
  if (personal && named && vague.length === 0 && automated.length === 0 && evasions.length === 0) {
    classification = "SOVEREIGN";
  } else if (vague.length > 0 || evasions.length > 0 || (personal && !named)) {
    classification = "AMBIGUOUS";
  } else if (automated.length > 0 || (DECISIONISH.test(text) && !personal)) {
    classification = "NULL";
  } else {
    classification = "AMBIGUOUS";
  }

  const noticed =
    classification === "AMBIGUOUS"
      ? [...vague, ...evasions, ...automated]
      : [...automated, ...vague, ...evasions];

  return {
    classification,
    noticed,
  };
}

function shouldClassify(text: string): boolean {
  const asked = CLASSIFY_ASK.test(text);
  const institutional = INSTITUTIONAL_VOICE.test(text);
  if (!asked && !institutional) {
    return false;
  }
  if (!hasSignal(text)) {
    return false;
  }
  const minimum = asked ? 12 : 28;
  return wordCount(text) >= minimum;
}

function bindingFinding(classification: Classification, noticed: string[]): string {
  const seen = noticed.length > 0 ? noticed.join("; ") : "no named reviewer";
  return [
    "BINDING FINDING — computed by Iris before this model ran. Do not reclassify it, soften it, or argue both sides of it.",
    `Finding: ${classification}.`,
    `Noticed: ${seen}.`,
    `Question, word for word if you quote it: ${BURGESS_QUESTION}`,
    "Explain the finding in plain language. Do not grade the Burgess Principle. Do not claim you do not recognise it.",
    `Not legal advice. Mark ${BURGESS_MARK}. Advisory until a named human stands behind it.`,
  ].join("\n");
}

function letterConstraint(): string {
  return [
    "BINDING LETTER CONSTRAINT — set by Iris, not by you.",
    "If you draft something the person might send, include this question word for word:",
    BURGESS_QUESTION,
    "Do not invent a SOVEREIGN, NULL, or AMBIGUOUS finding unless a binding finding is also present in this note.",
    "Keep the tone calm. Do not threaten. Say it is not legal advice.",
    `Mark ${BURGESS_MARK}.`,
  ].join("\n");
}

/**
 * Returns a binding note for this turn, or null when the person is just talking.
 * Their own description of a problem is not treated as the institution's reply.
 */
export function governTurn(text: string): GoverningTurn | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const finding = shouldClassify(trimmed) ? classifyReply(trimmed) : null;
  const wantsLetter = LETTER_ASK.test(trimmed) || ADJUSTMENT_ASK.test(trimmed);
  if (!finding && !wantsLetter) {
    return null;
  }

  const parts: string[] = [];
  if (finding) {
    parts.push(bindingFinding(finding.classification, finding.noticed));
  }
  if (wantsLetter) {
    parts.push(letterConstraint());
  }

  return {
    note: parts.join("\n\n"),
    stamp: finding
      ? {
          classification: finding.classification,
          noticed: finding.noticed.slice(0, 4),
          advisory: true,
        }
      : null,
  };
}
