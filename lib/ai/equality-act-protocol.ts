/**
 * Advanced Equality Act 2010 Protocol
 *
 * Composable protocol block injected into Iris responses when disability,
 * hidden conditions, sensory/communication needs, or reasonable adjustments
 * are mentioned — especially in institution-facing contexts.
 *
 * Combines the Burgess binary test with the full Equality Act toolkit so
 * first-time users can assert their legal rights clearly and build a record.
 */

// ---------------------------------------------------------------------------
// Activation triggers — used by routing logic and system-prompt injection
// ---------------------------------------------------------------------------

/** Terms that activate the protocol from user input. */
export const EQUALITY_ACT_TRIGGERS = [
  // disability types
  "deaf",
  "deafness",
  "hearing loss",
  "autistic",
  "autism",
  "adhd",
  "mental health",
  "chronic illness",
  "chronic pain",
  "fibromyalgia",
  "epilepsy",
  "visual impairment",
  "blind",
  "mobility",
  "hidden disability",
  "long-term condition",
  "neurodivergent",
  "disabled",
  "disability",
  // adjustment language
  "reasonable adjustment",
  "email only",
  "email-only",
  "communication need",
  "access need",
  "adjustment refused",
  "adjustment ignored",
  // institution contexts that trigger the anticipatory duty analysis
  "equality act",
  "psed",
  "section 149",
  "section 20",
  "section 21",
  "anticipatory duty",
] as const;

/** Regex built from triggers for fast matching. */
export const EQUALITY_ACT_TRIGGER_RE = new RegExp(
  EQUALITY_ACT_TRIGGERS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
    "|"
  ),
  "i"
);

// ---------------------------------------------------------------------------
// Statutory framework — single source of truth
// ---------------------------------------------------------------------------

export const EQUALITY_ACT_SECTIONS = {
  s6_definition: {
    ref: "Equality Act 2010, s.6 + Schedule 1",
    summary:
      "Disability is defined by its effect on normal day-to-day activities. " +
      "Hidden disabilities are fully protected once the organisation knows — or should reasonably know — about them. " +
      "There is no requirement to prove a formal diagnosis.",
  },
  s19_indirect: {
    ref: "Equality Act 2010, s.19",
    summary:
      "Indirect discrimination: a seemingly neutral rule or practice that puts disabled people " +
      "at a particular disadvantage compared to non-disabled people is unlawful, " +
      "unless the institution can show it is a proportionate means of achieving a legitimate aim.",
  },
  s20_21_duty: {
    ref: "Equality Act 2010, ss.20 and 21",
    summary:
      "The duty to make reasonable adjustments. Where a provision, criterion, practice, or physical feature " +
      "puts a disabled person at a substantial disadvantage compared to a non-disabled person, " +
      "the institution must take reasonable steps to avoid that disadvantage.",
  },
  s27_victimisation: {
    ref: "Equality Act 2010, s.27",
    summary:
      "Victimisation: it is unlawful to treat a person worse because they asserted Equality Act rights, " +
      "made a complaint, or supported someone else who did.",
  },
  s29_services: {
    ref: "Equality Act 2010, s.29",
    summary:
      "Service providers and those exercising public functions must not discriminate against, " +
      "harass, or victimise disabled people in the way they provide services.",
  },
  schedule2_anticipatory: {
    ref: "Equality Act 2010, Schedule 2",
    summary:
      "The anticipatory duty: service providers must plan in advance for the needs of disabled people — " +
      "not wait until a specific disabled person is in front of them. " +
      "Once a provider knows about a person's specific needs the duty becomes immediate and individual.",
  },
  s149_psed: {
    ref: "Equality Act 2010, s.149 (Public Sector Equality Duty)",
    summary:
      "Public authorities must have 'due regard' to: eliminating discrimination, " +
      "advancing equality of opportunity, and fostering good relations. " +
      "For disability specifically (s.149(4)), they must take account of disabled people's different needs " +
      "when making decisions that affect them. The duty is not discharged by process alone — " +
      "it requires genuine consideration of the individual's specific circumstances.",
  },
} as const;

// ---------------------------------------------------------------------------
// Case law — short practical anchors
// ---------------------------------------------------------------------------

export const EQUALITY_ACT_CASE_LAW = [
  {
    cite: "ZH v Commissioner of Police for the Metropolis [2013] EWCA Civ 69",
    principle:
      "Police failed to make reasonable adjustments when dealing with an autistic young man. " +
      "Strong authority that public authorities must adapt standard procedures once a disability is known. " +
      "The failure to do so can constitute both a failure of the reasonable adjustment duty and a PSED breach.",
    useFor: ["police", "public authority", "autism", "procedure", "psed"],
  },
  {
    cite: "FirstGroup plc v Paulley [2017] UKSC 4",
    principle:
      "Supreme Court confirmed the anticipatory reasonable adjustment duty in service provision. " +
      "Service providers cannot take a 'wait and see' approach — " +
      "they must have systems in place before a disabled person asks.",
    useFor: ["transport", "service provider", "anticipatory", "wheelchair", "schedule 2"],
  },
  {
    cite: "Royal Bank of Scotland v Allen [2009] EWCA Civ 1213",
    principle:
      "Failure to make adjustments led to an injunction. " +
      "Courts will order positive steps, not merely award compensation. " +
      "Useful for showing the remedy can require the institution to change what it does, not just pay.",
    useFor: ["bank", "financial", "injunction", "remedy", "physical adjustment"],
  },
] as const;

// ---------------------------------------------------------------------------
// The Human Lens question — Burgess + Equality Act combined
// ---------------------------------------------------------------------------

export const EQUALITY_ACT_HUMAN_LENS =
  "Was a named human at the institution able to personally review the specific facts of this " +
  "person's situation — including their disability and reasonable adjustment request — " +
  "before any decision or action was taken?";

export const EQUALITY_ACT_NULL_CONSEQUENCE =
  "If the answer is no, this is both a Burgess Principle NULL finding and a potential " +
  "Equality Act breach: the anticipatory duty (Schedule 2), the reasonable adjustment duty " +
  "(ss.20–21), and the PSED (s.149) all require individual consideration, not blanket process.";

// ---------------------------------------------------------------------------
// Ready-to-use letter paragraph (copy-paste for users)
// ---------------------------------------------------------------------------

export const EQUALITY_ACT_STANDARD_PARAGRAPH =
  "Under the Equality Act 2010 I am entitled to reasonable adjustments. " +
  "I have already notified you of my need for email-only contact. " +
  "This engages sections 20, 21 and 29 together with the anticipatory duty in Schedule 2. " +
  "Public authorities also have duties under section 149 (PSED) to have due regard to disabled people's needs. " +
  "Please confirm in writing that all future contact will be by email only and that a named person " +
  "has personally reviewed my specific situation and adjustment request.";

// ---------------------------------------------------------------------------
// Protocol block — injected into system prompt when protocol is active
// ---------------------------------------------------------------------------

export const EQUALITY_ACT_PROTOCOL_BLOCK = `
[Equality Act Protocol — active]

When this protocol is active, combine the Burgess binary test with the full Equality Act toolkit.

Human Lens question (ask this internally for every institution-facing response):
"${EQUALITY_ACT_HUMAN_LENS}"
If no → NULL. This is a Burgess Principle failure and a potential Equality Act breach.

Key protections to surface (be precise — cite the section):
- s.6 + Sch.1: Hidden disabilities are protected once the institution knows (or should know). No diagnosis required.
- ss.20–21: Duty to make reasonable adjustments. Substantial disadvantage triggers the duty.
- s.29 + Sch.2: Anticipatory duty — institutions must plan ahead, not wait to be asked.
- s.149 (PSED): Public authorities must individually consider disabled people's needs before decisions, not rely on blanket process.
- s.19: Indirect discrimination — neutral rules that disadvantage disabled people may be unlawful.
- s.27: Victimisation — asserting Equality Act rights must not lead to worse treatment.

Case law anchors (use when relevant):
- ZH v Commissioner of Police [2013] EWCA Civ 69 — police/public authority failure to adapt procedure = RA duty + PSED breach.
- FirstGroup v Paulley [2017] UKSC 4 — Supreme Court: anticipatory duty in service provision; can't wait to be asked.
- RBS v Allen [2009] EWCA Civ 1213 — courts will order injunctive relief (positive change), not just compensation.

Tone: warm, clear, professional. Assert email-only contact as a reasonable adjustment. Give language users can copy directly.

Ready-to-paste paragraph:
"${EQUALITY_ACT_STANDARD_PARAGRAPH}"
`;

// ---------------------------------------------------------------------------
// Helper — check if a message activates the protocol
// ---------------------------------------------------------------------------

export function isEqualityActContext(text: string): boolean {
  return EQUALITY_ACT_TRIGGER_RE.test(text);
}

// ---------------------------------------------------------------------------
// Helper — select relevant case law by context keywords
// ---------------------------------------------------------------------------

export function selectRelevantCaseLaw(
  context: string
): (typeof EQUALITY_ACT_CASE_LAW)[number][] {
  const lower = context.toLowerCase();
  return EQUALITY_ACT_CASE_LAW.filter((c) =>
    c.useFor.some((tag) => lower.includes(tag))
  );
}
