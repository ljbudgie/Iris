/** Port of burgess-principle iris/loop_classifier.py. Advisory only. */
import { LOOP_DISCLAIMER } from "./disclaimer";
import type {
  ClassifyThreadInput,
  LoopDirection,
  LoopFinding,
  LoopMessageInput,
  LoopType,
} from "./types";

const PEOPLE = new Set(["individual", "user", "claimant", "customer", "you"]);
const INSUFFICIENT =
  /\b(?:not|isn't|is not|still not)\s+sufficient\b|\bprovide\s+(?:more|further|additional)\b/i;
const PRECONDITION = /\b(?:cannot|can't|unable to|won't)\b.{0,80}\buntil\b/i;
const IDENTITY =
  /\b(?:verify|verification|confirm)\b.{0,60}\b(?:identity|yourself|account)\b/i;
const CHANNEL = /\b(?:call|phone|telephone|visit|in person)\b/i;
const EMAIL_ONLY = /\b(?:email[- ]only|written[- ]only|do not (?:call|phone))\b/i;
const ID_DONE =
  /\b(?:identity|identification|id)\b.{0,60}\b(?:provided|confirmed|verified|supplied)\b|\b(?:provided|confirmed|verified|supplied)\b.{0,60}\b(?:identity|identification|id)\b/i;
const TEMPLATE = /\b(?:all points (?:have been )?addressed|standard response)\b/i;
const REFERRAL = /\b(?:contact|refer(?:red)? to|speak to)\s+([A-Z][\w&' -]{1,50})/i;

type Msg = {
  date: Date;
  sender: string;
  content_summary: string;
  direction: LoopDirection;
  reference: string;
};

export function sequenceMatcherRatio(a: string, b: string): number {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left === right) return 1;
  if (!left || !right) return 0;
  const grams = (value: string) => {
    const counts = new Map<string, number>();
    for (let i = 0; i < value.length - 1; i++) {
      const gram = value.slice(i, i + 2);
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
    }
    return counts;
  };
  const aGrams = grams(left);
  const bGrams = grams(right);
  let overlap = 0;
  for (const [gram, count] of aGrams) overlap += Math.min(count, bGrams.get(gram) ?? 0);
  return (2 * overlap) / (left.length - 1 + (right.length - 1));
}

function parseMessages(messages: LoopMessageInput[]): Msg[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages must be a non-empty array.");
  }
  if (messages.length > 500) throw new Error("messages must contain at most 500 items.");
  const parsed = messages.map((message, index) => {
    if (!message || typeof message !== "object") {
      throw new Error(`messages[${index}] must be an object.`);
    }
    const rawDate = message.date;
    const sender = message.sender;
    const content = message.content_summary;
    if (![rawDate, sender, content].every((v) => typeof v === "string" && v.trim())) {
      throw new Error(
        `messages[${index}] must include non-empty date, sender, and content_summary strings.`
      );
    }
    if (content.length > 20_000) throw new Error(`messages[${index}].content_summary is too long.`);
    const prefix = rawDate.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(prefix)) {
      throw new Error(`messages[${index}].date must start with an ISO-8601 date.`);
    }
    const date = new Date(`${prefix}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`messages[${index}].date must start with an ISO-8601 date.`);
    }
    let direction = String(message.direction ?? "").trim().toLowerCase();
    if (direction !== "institution" && direction !== "individual") {
      direction = PEOPLE.has(sender.trim().toLowerCase()) ? "individual" : "institution";
    }
    return {
      date,
      sender: sender.trim(),
      content_summary: content.trim(),
      direction: direction as LoopDirection,
      reference: String(message.reference || prefix).trim(),
    };
  });
  return parsed.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function countInsufficiency(messages: Msg[]): [number, number[]] {
  const flagged = messages.flatMap((m, i) =>
    m.direction === "institution" && INSUFFICIENT.test(m.content_summary) ? [i] : []
  );
  let cycles = 0;
  const evidence: number[] = [];
  for (let i = 0; i < flagged.length - 1; i++) {
    const first = flagged[i];
    const second = flagged[i + 1];
    if (messages.slice(first + 1, second).some((m) => m.direction === "individual")) {
      cycles += 1;
      evidence.push(first, second);
    }
  }
  return [cycles, evidence];
}

function countCircular(messages: Msg[]): [number, number[]] {
  const routes: Array<[string, number]> = [];
  messages.forEach((m, i) => {
    if (m.direction !== "institution") return;
    const match = m.content_summary.match(REFERRAL);
    if (match?.[1]) routes.push([match[1].trim().toLowerCase(), i]);
  });
  let cycles = 0;
  const evidence: number[] = [];
  for (let i = 0; i < routes.length - 2; i++) {
    const [a, ai] = routes[i];
    const [b, bi] = routes[i + 1];
    const [c, ci] = routes[i + 2];
    if (a === c && a !== b) {
      cycles += 1;
      evidence.push(ai, bi, ci);
    }
  }
  return [cycles, evidence];
}

function countPreconditions(messages: Msg[]): [number, number[]] {
  const evidence = messages.flatMap((m, i) =>
    m.direction === "institution" && PRECONDITION.test(m.content_summary) ? [i] : []
  );
  return [evidence.length, evidence];
}

function countTemplates(messages: Msg[]): [number, number[]] {
  const institutional = messages.flatMap((m, i) =>
    m.direction === "institution" ? [[i, m.content_summary] as const] : []
  );
  const evidence = new Set<number>();
  for (const [i, content] of institutional) {
    if (TEMPLATE.test(content)) evidence.add(i);
  }
  for (let i = 0; i < institutional.length; i++) {
    for (let j = i + 1; j < institutional.length; j++) {
      if (sequenceMatcherRatio(institutional[i][1], institutional[j][1]) >= 0.88) {
        evidence.add(institutional[i][0]);
        evidence.add(institutional[j][0]);
      }
    }
  }
  const sorted = [...evidence].sort((a, b) => a - b);
  return [sorted.length > 1 ? Math.floor(sorted.length / 2) : 0, sorted];
}

function countIdentity(messages: Msg[]): [number, number[]] {
  let confirmed = false;
  let cycles = 0;
  const evidence: number[] = [];
  messages.forEach((m, i) => {
    if (m.direction === "individual" && ID_DONE.test(m.content_summary)) confirmed = true;
    else if (confirmed && m.direction === "institution" && IDENTITY.test(m.content_summary)) {
      cycles += 1;
      evidence.push(i);
    }
  });
  return [cycles, evidence];
}

function countChannel(messages: Msg[]): [number, number[]] {
  let emailOnly = false;
  const evidence: number[] = [];
  messages.forEach((m, i) => {
    if (m.direction === "individual" && EMAIL_ONLY.test(m.content_summary)) emailOnly = true;
    else if (emailOnly && m.direction === "institution" && CHANNEL.test(m.content_summary)) {
      evidence.push(i);
    }
  });
  return [evidence.length, evidence];
}

export function classifyThread(input: ClassifyThreadInput): LoopFinding {
  const parsed = parseMessages(input.messages);
  const detectors: Record<LoopType, [number, number[]]> = {
    insufficiency: countInsufficiency(parsed),
    circular_referral: countCircular(parsed),
    precondition_stacking: countPreconditions(parsed),
    template_dismissal: countTemplates(parsed),
    identity_loop: countIdentity(parsed),
    channel_redirect: countChannel(parsed),
  };
  let loopType: LoopType | null = "insufficiency";
  let loopCount = -1;
  let evidence: number[] = [];
  for (const [type, [count, indexes]] of Object.entries(detectors) as Array<
    [LoopType, [number, number[]]]
  >) {
    if (count > loopCount) {
      loopType = type;
      loopCount = count;
      evidence = indexes;
    }
  }
  const loopDetected = loopCount > 0;
  const namedIndividual = input.named_individual?.trim() || null;
  const institution =
    input.institution?.trim() ||
    parsed.find((m) => m.direction === "institution")?.sender ||
    "Unspecified institution";
  const days = loopDetected
    ? Math.round((parsed.at(-1)!.date.getTime() - parsed[0].date.getTime()) / 86_400_000)
    : 0;
  const summary = loopDetected
    ? `LOOP DETECTED: ${institution} shows a ${loopType!.replaceAll("_", " ")} pattern across ${loopCount} cycle(s) over ${days} day(s), with ${namedIndividual ? `named individual ${namedIndividual}` : "no named individual"} identified.`
    : "NO LOOP: no classified delay pattern was detected in the supplied correspondence.";
  return {
    schema_version: 1,
    loop_detected: loopDetected,
    loop_type: loopDetected ? loopType : null,
    loop_count: loopDetected ? loopCount : 0,
    days_consumed: days,
    institution,
    named_individual: namedIndividual,
    correspondence_refs: [...new Set(evidence)].sort((a, b) => a - b).map((i) => parsed[i].reference),
    accountability_finding: namedIndividual ? "SOVEREIGN" : "NULL",
    summary,
    provisional: true,
    requires_human_confirmation: true,
    disclaimer: LOOP_DISCLAIMER,
  };
}
