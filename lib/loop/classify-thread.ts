/**
 * Local-first, advisory classifier for recurring institutional delay patterns.
 *
 * Ported from burgess-principle iris/loop_classifier.py. Runs entirely
 * in-process — it never sends correspondence content anywhere and never
 * writes to the live findings ledger. Every finding is provisional and
 * requires a named human to confirm it before it is recorded, published,
 * or relied upon.
 */
import { LOOP_DISCLAIMER } from "./disclaimer";
import type {
  ClassifyThreadInput,
  LoopFinding,
  LoopMessageInput,
  LoopType,
} from "./types";

const INDIVIDUAL_SENDERS = new Set([
  "individual",
  "user",
  "claimant",
  "customer",
  "you",
]);

const INSUFFICIENT_RE =
  /\b(?:not|isn't|is not|still not)\s+sufficient\b|\bprovide\s+(?:more|further|additional)\b/i;
const PRECONDITION_RE = /\b(?:cannot|can't|unable to|won't)\b.{0,80}\buntil\b/i;
const IDENTITY_RE =
  /\b(?:verify|verification|confirm)\b.{0,60}\b(?:identity|yourself|account)\b/i;
const CHANNEL_RE = /\b(?:call|phone|telephone|visit|in person)\b/i;
const EMAIL_ONLY_RE =
  /\b(?:email[- ]only|written[- ]only|do not (?:call|phone))\b/i;
const IDENTITY_CONFIRMED_RE =
  /\b(?:identity|identification|id)\b.{0,60}\b(?:provided|confirmed|verified|supplied)\b|\b(?:provided|confirmed|verified|supplied)\b.{0,60}\b(?:identity|identification|id)\b/i;
const TEMPLATE_RE =
  /\b(?:all points (?:have been )?addressed|standard response)\b/i;
const REFERRAL_RE =
  /\b(?:contact|refer(?:red)? to|speak to)\s+([A-Z][\w&' -]{1,50})/i;

const MAX_MESSAGES = 500;
const MAX_CONTENT_LENGTH = 20_000;
const TEMPLATE_SIMILARITY_THRESHOLD = 0.88;

type ParsedMessage = {
  date: string;
  dateMs: number;
  sender: string;
  content_summary: string;
  direction: "institution" | "individual";
  reference: string;
};

type DetectorResult = [count: number, evidence: number[]];

/**
 * Ratcliff/Obershelp ratio, matching the behaviour of Python's
 * difflib.SequenceMatcher(None, a, b).ratio() (without the autojunk
 * heuristic, which only affects very long, highly repetitive sequences).
 */
export function sequenceMatcherRatio(a: string, b: string): number {
  const matches = matchingBlocksSize(a, b);
  const length = a.length + b.length;
  return length === 0 ? 1 : (2 * matches) / length;
}

type MatchBlock = { a: number; b: number; size: number };

function buildB2j(b: string): Map<string, number[]> {
  const b2j = new Map<string, number[]>();
  for (let i = 0; i < b.length; i++) {
    const char = b[i];
    const list = b2j.get(char);
    if (list) {
      list.push(i);
    } else {
      b2j.set(char, [i]);
    }
  }
  return b2j;
}

function findLongestMatch(
  a: string,
  b: string,
  alo: number,
  ahi: number,
  blo: number,
  bhi: number,
  b2j: Map<string, number[]>
): MatchBlock {
  let besti = alo;
  let bestj = blo;
  let bestsize = 0;
  let j2len = new Map<number, number>();

  for (let i = alo; i < ahi; i++) {
    const newj2len = new Map<number, number>();
    const indices = b2j.get(a[i]);
    if (indices) {
      for (const j of indices) {
        if (j < blo) {
          continue;
        }
        if (j >= bhi) {
          break;
        }
        const k = (j2len.get(j - 1) ?? 0) + 1;
        newj2len.set(j, k);
        if (k > bestsize) {
          besti = i - k + 1;
          bestj = j - k + 1;
          bestsize = k;
        }
      }
    }
    j2len = newj2len;
  }

  return { a: besti, b: bestj, size: bestsize };
}

function getMatchingBlocks(a: string, b: string): MatchBlock[] {
  const b2j = buildB2j(b);
  const queue: Array<[number, number, number, number]> = [
    [0, a.length, 0, b.length],
  ];
  const blocks: MatchBlock[] = [];

  while (queue.length > 0) {
    const [alo, ahi, blo, bhi] = queue.pop() as [
      number,
      number,
      number,
      number,
    ];
    const match = findLongestMatch(a, b, alo, ahi, blo, bhi, b2j);
    if (match.size > 0) {
      blocks.push(match);
      if (alo < match.a && blo < match.b) {
        queue.push([alo, match.a, blo, match.b]);
      }
      if (match.a + match.size < ahi && match.b + match.size < bhi) {
        queue.push([match.a + match.size, ahi, match.b + match.size, bhi]);
      }
    }
  }

  blocks.sort((x, y) => x.a - y.a || x.b - y.b);
  return blocks;
}

function matchingBlocksSize(a: string, b: string): number {
  let total = 0;
  for (const block of getMatchingBlocks(a, b)) {
    total += block.size;
  }
  return total;
}

function parseIsoDatePrefix(raw: string): string {
  const prefix = raw.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(prefix);
  if (!match) {
    throw new Error("messages[].date must start with an ISO-8601 date.");
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("messages[].date must start with an ISO-8601 date.");
  }
  return prefix;
}

function parseMessages(messages: LoopMessageInput[]): ParsedMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array.");
  }
  if (messages.length > MAX_MESSAGES) {
    throw new Error("messages must contain at most 500 items.");
  }

  const parsed: ParsedMessage[] = messages.map((message, index) => {
    if (!message || typeof message !== "object") {
      throw new Error(`messages[${index}] must be an object.`);
    }
    const rawDate = message.date;
    const sender = message.sender;
    const content = message.content_summary;
    const allStrings = [rawDate, sender, content].every(
      (value) => typeof value === "string" && value.trim().length > 0
    );
    if (!allStrings) {
      throw new Error(
        `messages[${index}] must include non-empty date, sender, and content_summary strings.`
      );
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new Error(`messages[${index}].content_summary is too long.`);
    }

    let datePrefix: string;
    try {
      datePrefix = parseIsoDatePrefix(rawDate);
    } catch {
      throw new Error(
        `messages[${index}].date must start with an ISO-8601 date.`
      );
    }

    let direction = String(message.direction ?? "")
      .trim()
      .toLowerCase();
    if (direction !== "institution" && direction !== "individual") {
      direction = INDIVIDUAL_SENDERS.has(sender.trim().toLowerCase())
        ? "individual"
        : "institution";
    }
    const reference = String(message.reference || datePrefix).trim();

    return {
      date: datePrefix,
      dateMs: Date.parse(`${datePrefix}T00:00:00Z`),
      sender: sender.trim(),
      content_summary: content.trim(),
      direction: direction as "institution" | "individual",
      reference,
    };
  });

  return parsed
    .map((message, index) => ({ message, index }))
    .sort((x, y) => x.message.dateMs - y.message.dateMs || x.index - y.index)
    .map(({ message }) => message);
}

function countInsufficiency(messages: ParsedMessage[]): DetectorResult {
  const flagged: number[] = [];
  messages.forEach((message, index) => {
    if (
      message.direction === "institution" &&
      INSUFFICIENT_RE.test(message.content_summary)
    ) {
      flagged.push(index);
    }
  });
  let cycles = 0;
  const evidence: number[] = [];
  for (let i = 0; i < flagged.length - 1; i++) {
    const first = flagged[i];
    const second = flagged[i + 1];
    const hasIndividualBetween = messages
      .slice(first + 1, second)
      .some((message) => message.direction === "individual");
    if (hasIndividualBetween) {
      cycles += 1;
      evidence.push(first, second);
    }
  }
  return [cycles, evidence];
}

function countCircularReferral(messages: ParsedMessage[]): DetectorResult {
  const routes: Array<[string, number]> = [];
  messages.forEach((message, index) => {
    if (message.direction === "institution") {
      const match = REFERRAL_RE.exec(message.content_summary);
      if (match) {
        routes.push([match[1].trim().toLowerCase(), index]);
      }
    }
  });
  let cycles = 0;
  const evidence: number[] = [];
  for (let i = 0; i < routes.length - 2; i++) {
    const [firstRoute, firstIndex] = routes[i];
    const [secondRoute, secondIndex] = routes[i + 1];
    const [thirdRoute, thirdIndex] = routes[i + 2];
    if (firstRoute === thirdRoute && firstRoute !== secondRoute) {
      cycles += 1;
      evidence.push(firstIndex, secondIndex, thirdIndex);
    }
  }
  return [cycles, evidence];
}

function countPreconditions(messages: ParsedMessage[]): DetectorResult {
  const evidence: number[] = [];
  messages.forEach((message, index) => {
    if (
      message.direction === "institution" &&
      PRECONDITION_RE.test(message.content_summary)
    ) {
      evidence.push(index);
    }
  });
  return [evidence.length, evidence];
}

function countTemplates(messages: ParsedMessage[]): DetectorResult {
  const institutional: Array<[number, string]> = [];
  messages.forEach((message, index) => {
    if (message.direction === "institution") {
      institutional.push([index, message.content_summary]);
    }
  });

  let evidenceSet = new Set<number>();
  for (const [index, content] of institutional) {
    if (TEMPLATE_RE.test(content)) {
      evidenceSet.add(index);
    }
  }

  for (let position = 0; position < institutional.length; position++) {
    const [index, content] = institutional[position];
    for (let other = position + 1; other < institutional.length; other++) {
      const [otherIndex, otherContent] = institutional[other];
      if (
        sequenceMatcherRatio(
          content.toLowerCase(),
          otherContent.toLowerCase()
        ) >= TEMPLATE_SIMILARITY_THRESHOLD
      ) {
        evidenceSet.add(index);
        evidenceSet.add(otherIndex);
      }
    }
  }

  const evidence = Array.from(evidenceSet).sort((x, y) => x - y);
  const count = evidence.length > 1 ? Math.floor(evidence.length / 2) : 0;
  return [count, evidence];
}

function countIdentity(messages: ParsedMessage[]): DetectorResult {
  let identityConfirmed = false;
  let cycles = 0;
  const evidence: number[] = [];
  messages.forEach((message, index) => {
    if (
      message.direction === "individual" &&
      IDENTITY_CONFIRMED_RE.test(message.content_summary)
    ) {
      identityConfirmed = true;
    } else if (
      identityConfirmed &&
      message.direction === "institution" &&
      IDENTITY_RE.test(message.content_summary)
    ) {
      cycles += 1;
      evidence.push(index);
    }
  });
  return [cycles, evidence];
}

function countChannelRedirect(messages: ParsedMessage[]): DetectorResult {
  let emailOnlySeen = false;
  const evidence: number[] = [];
  messages.forEach((message, index) => {
    if (
      message.direction === "individual" &&
      EMAIL_ONLY_RE.test(message.content_summary)
    ) {
      emailOnlySeen = true;
    } else if (
      emailOnlySeen &&
      message.direction === "institution" &&
      CHANNEL_RE.test(message.content_summary)
    ) {
      evidence.push(index);
    }
  });
  return [evidence.length, evidence];
}

export function classifyThread(input: ClassifyThreadInput): LoopFinding {
  const { messages, institution, named_individual } = input;
  const parsed = parseMessages(messages ?? []);

  if (institution != null && typeof institution !== "string") {
    throw new Error("institution must be a string or null.");
  }
  if (named_individual != null && typeof named_individual !== "string") {
    throw new Error("named_individual must be a string or null.");
  }

  const detectors: Record<LoopType, DetectorResult> = {
    insufficiency: countInsufficiency(parsed),
    circular_referral: countCircularReferral(parsed),
    precondition_stacking: countPreconditions(parsed),
    template_dismissal: countTemplates(parsed),
    identity_loop: countIdentity(parsed),
    channel_redirect: countChannelRedirect(parsed),
  };

  let bestType: LoopType | null = null;
  let bestCount = -1;
  let bestEvidence: number[] = [];
  for (const [type, [count, evidence]] of Object.entries(detectors) as Array<
    [LoopType, DetectorResult]
  >) {
    if (count > bestCount) {
      bestType = type;
      bestCount = count;
      bestEvidence = evidence;
    }
  }

  const loopDetected = bestCount > 0;
  const refs = Array.from(new Set(bestEvidence))
    .sort((x, y) => x - y)
    .map((index) => parsed[index].reference);

  const resolvedNamedIndividual = named_individual?.trim() || null;
  const resolvedInstitution =
    (institution ?? "").trim() ||
    parsed.find((message) => message.direction === "institution")?.sender ||
    "Unspecified institution";

  const accountability: "SOVEREIGN" | "NULL" = resolvedNamedIndividual
    ? "SOVEREIGN"
    : "NULL";

  const days = loopDetected
    ? Math.round(
        (parsed.at(-1)!.dateMs - parsed[0].dateMs) / (24 * 60 * 60 * 1000)
      )
    : 0;

  let loopType: LoopType | null = bestType;
  let summary: string;
  if (loopDetected) {
    const accountable = resolvedNamedIndividual
      ? `named individual ${resolvedNamedIndividual}`
      : "no named individual";
    summary =
      `LOOP DETECTED: ${resolvedInstitution} shows a ${(loopType as LoopType).replace(/_/g, " ")} ` +
      `pattern across ${bestCount} cycle(s) over ${days} day(s), with ${accountable} identified.`;
  } else {
    loopType = null;
    summary =
      "NO LOOP: no classified delay pattern was detected in the supplied correspondence.";
  }

  return {
    schema_version: 1,
    loop_detected: loopDetected,
    loop_type: loopType,
    loop_count: loopDetected ? bestCount : 0,
    days_consumed: days,
    institution: resolvedInstitution,
    named_individual: resolvedNamedIndividual,
    correspondence_refs: refs,
    accountability_finding: accountability,
    summary,
    provisional: true,
    requires_human_confirmation: true,
    disclaimer: LOOP_DISCLAIMER,
  };
}
