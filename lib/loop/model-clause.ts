/**
 * Canonical Model Clause text for Iris letter generation.
 * Limbs (a)–(d) must not be paraphrased in generated adoption letters.
 */

export const MODEL_CLAUSE_MARK = "UK00004343685";

export const MODEL_CLAUSE_STATUS =
  "UK Certification Mark UK00004343685 was accepted by the UK IPO on 21 July 2026. Publication, opposition period, and registration are pending.";

export const MODEL_CLAUSE_TEXT = `Before any automated decision, demand, fee, penalty, enforcement action, or recovery step is issued against an identified individual, a named officer with authority must have:

(a) reviewed the specific facts of the specific case — not a bulk schedule, not a category, not a template;

(b) confirmed that any recorded reasonable adjustment has been applied;

(c) confirmed that the action is not subject to an active complaint, appeal, or legal proceeding that should pause or modify it; and

(d) recorded their name, role, and the date of the review in a form that can be disclosed to the individual on request.

Where no such review is evidenced, the action is NULL and must not proceed.

Where the action has already proceeded without such review, the individual may require the organisation to identify the named officer who authorised it. If no officer can be identified, the action is presumed to have been taken without individual human consideration and the organisation bears the burden of proving otherwise.`;

export const MODEL_CLAUSE_DOES_NOT_REQUIRE = [
  "It does not require every decision to be made slowly.",
  "It does not prohibit automation — it requires a human checkpoint before automation acts on an individual.",
  "It does not require senior officer involvement in routine matters — a named officer at any appropriate level satisfies the clause.",
  "It does not create a right of appeal — it creates a right to know who decided.",
];

export const MODEL_CLAUSE_LETTER_PROMPT = `You are drafting an adoption letter for the Burgess Principle Model Clause (${MODEL_CLAUSE_MARK}).

This is not a dispute letter. It asks an organisation to insert the clause into standing orders, procurement specifications, complaints procedures, regulatory licence conditions, or court/tribunal protocols.

Rules:
1. Include the Model Clause text VERBATIM. Do not soften or paraphrase limbs (a), (b), (c), or (d).
2. Include the NULL / burden-of-proof paragraphs verbatim.
3. Include the \"what this clause does NOT require\" list so the recipient cannot claim it demands slowness or senior-officer review of every routine act.
4. State the certification-mark status exactly: ${MODEL_CLAUSE_STATUS}
5. Keep the tone calm and institutional.
6. End with: Lewis James Burgess · The Burgess Principle Ltd (Co. No. 17199287) · ${MODEL_CLAUSE_MARK}
7. End drafts with: This is not legal advice. It helps you prepare for meaningful human review.

Verbatim clause:

${MODEL_CLAUSE_TEXT}
`;
