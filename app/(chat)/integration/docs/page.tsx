const PROMPT_SNIPPET =
  'SYSTEM: Before any action affecting an identified individual, run the Burgess Principle binary test — "Was a named human member of the team able to personally review the specific facts of this specific person\'s case?" — and classify the action as SOVEREIGN (yes, named individual confirmed), NULL (no individual review), or AMBIGUOUS (unclear). Do not proceed with NULL actions without escalation. UK Certification Mark UK00004343685.';

const codeBlockClass =
  "whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 font-mono text-xs text-zinc-200 leading-6";

export default function IntegrationDocsPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 print:max-w-none print:bg-white print:text-black">
      <header className="rounded-3xl border border-[#d6bc8f]/25 bg-[linear-gradient(135deg,rgba(8,8,12,0.96),rgba(15,118,110,0.16))] p-6 print:border-zinc-300 print:bg-white">
        <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.32em]">
          Formal Integration Brief
        </p>
        <h1 className="mt-3 font-semibold text-3xl text-zinc-50 print:text-black">
          Burgess Principle Tier 1 Integration Reference
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400 leading-6 print:text-zinc-700">
          Technical and legal reference for embedding the Burgess Principle
          binary test into enterprise AI decision pipelines.
        </p>
      </header>

      <section className="rounded-3xl border border-zinc-800 bg-card/50 p-6 print:border-zinc-300 print:bg-white">
        <h2 className="font-semibold text-2xl">1. Purpose of the binary test</h2>
        <p className="mt-3 text-sm text-zinc-300 leading-6 print:text-zinc-700">
          The Burgess Principle binary test asks whether a named human member of
          the team was able to personally review the specific facts of the
          specific person&apos;s case before an action affecting that person was
          taken or recommended. It converts that oversight position into a
          simple operational classification: SOVEREIGN where review is
          confirmed, NULL where it is absent, and AMBIGUOUS where the position is
          unclear.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-card/50 p-6 print:border-zinc-300 print:bg-white">
        <h2 className="font-semibold text-2xl">2. burgess-gate.js API reference</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-lg">Input schema</h3>
            <pre className={codeBlockClass}>{`{
  institution: string,
  decisionType: string,
  namedIndividual: string | null,
  reviewConfirmed: boolean,
  specificFactsReviewed: boolean,
  evidenceNote: string
}`}</pre>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Output schema</h3>
            <pre className={codeBlockClass}>{`{
  classification: "SOVEREIGN" | "NULL" | "AMBIGUOUS",
  reasoning: string,
  commitment: sha256_hash,
  timestamp: ISO8601,
  mark: "UK00004343685"
}`}</pre>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-[#d6bc8f]/25 bg-[#d6bc8f]/10 p-4">
          <h3 className="font-semibold text-lg">Classification logic</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300 print:text-zinc-700">
            <li>
              If any required field is undefined, missing, or ambiguous, the
              result is AMBIGUOUS.
            </li>
            <li>
              If the named individual is null, review is not confirmed, or
              specific facts review is not confirmed, the result is NULL.
            </li>
            <li>
              If a named individual, review confirmation, and specific facts
              review are all confirmed, the result is SOVEREIGN.
            </li>
            <li>
              The commitment is a SHA-256 PersonGate commitment generated from
              the supplied input record without transmitting data externally.
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-card/50 p-6 print:border-zinc-300 print:bg-white">
        <h2 className="font-semibold text-2xl">3. System prompt snippet</h2>
        <pre className={`${codeBlockClass} mt-4`}>{PROMPT_SNIPPET}</pre>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-card/50 p-6 print:border-zinc-300 print:bg-white">
        <h2 className="font-semibold text-2xl">
          4. Worked example: AI hiring tool
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-300 leading-6 print:text-zinc-700">
          <li>
            The hiring platform identifies a decision point: shortlist,
            rejection, interview invitation, or ranking recommendation.
          </li>
          <li>
            Before the decision is actioned, the orchestrator calls
            burgessGate() with the employer name, decision type, named reviewer,
            review confirmation, specific facts confirmation, and evidence note.
          </li>
          <li>
            If the result is SOVEREIGN, the platform may proceed and store the
            returned commitment alongside the decision audit record.
          </li>
          <li>
            If the result is NULL, the platform must escalate to an accountable
            human review route before proceeding.
          </li>
          <li>
            If the result is AMBIGUOUS, the platform must clarify the review
            evidence before presenting the decision as compliant.
          </li>
        </ol>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-card/50 p-6 print:border-zinc-300 print:bg-white">
        <h2 className="font-semibold text-2xl">5. Legal and regulatory basis</h2>
        <p className="mt-3 text-sm text-zinc-300 leading-6 print:text-zinc-700">
          The integration package is designed to support documented human
          oversight for decisions affecting identified individuals, including
          the Data (Use and Access) Act 2025 Articles 22A–22D and EU AI Act
          high-risk system oversight expectations. It is an operational
          compliance control and does not replace legal advice.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-card/50 p-6 print:border-zinc-300 print:bg-white">
        <h2 className="font-semibold text-2xl">
          6. Certification mark usage terms
        </h2>
        <p className="mt-3 text-sm text-zinc-300 leading-6 print:text-zinc-700">
          Licensees may display UK Certification Mark UK00004343685 only in
          connection with assessed systems, workflows, or institutional
          materials that meet the applicable Burgess Principle certification
          terms. The mark should be shown with the relevant classification,
          assessment date, and a link to the public institutional register. It
          must not be used to imply legal advice, regulatory approval, or
          certification of unrelated products or processes.
        </p>
      </section>

      <footer className="rounded-3xl border border-[#d6bc8f]/25 bg-[#08080c]/90 p-6 print:border-zinc-300 print:bg-white">
        <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.24em]">
          Contact
        </p>
        <p className="mt-2 text-sm text-zinc-300 print:text-zinc-700">
          lewisjames@theburgessprinciple.com
        </p>
      </footer>
    </main>
  );
}
