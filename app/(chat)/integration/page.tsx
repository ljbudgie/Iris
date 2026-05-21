"use client";

import { CheckIcon, ClipboardIcon, ShieldCheckIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function buildSystemPrompt(institution: string, decisionTypes: string) {
  const institutionName = institution.trim() || "[Institution name]";
  const decisionScope = decisionTypes.trim() || "[decision types]";

  return `SYSTEM: For ${institutionName}, before any action affecting an identified individual in ${decisionScope}, run the Burgess Principle binary test — "Was a named human member of the team able to personally review the specific facts of this specific person's case?" — and classify the action as SOVEREIGN (yes, named individual confirmed), NULL (no individual review), or AMBIGUOUS (unclear). Do not proceed with NULL actions without escalation. UK Certification Mark UK00004343685.`;
}

export default function IntegrationPage() {
  const [institution, setInstitution] = useState("");
  const [decisionTypes, setDecisionTypes] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );

  const systemPrompt = useMemo(
    () => buildSystemPrompt(institution, decisionTypes),
    [institution, decisionTypes]
  );

  const copyPrompt = async () => {
    if (!navigator.clipboard) {
      setCopyStatus("failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(systemPrompt);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="rounded-3xl border border-[#d6bc8f]/25 bg-[linear-gradient(135deg,rgba(8,8,12,0.96),rgba(15,118,110,0.16))] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.32em]">
              Tier 1 Integration Package
            </p>
            <h1 className="mt-3 font-semibold text-3xl text-zinc-50">
              Burgess Principle AI Integration
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 leading-6">
              Generate a system prompt snippet that lets enterprise AI agents
              embed the Burgess Principle binary test inside their own decision
              pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#0f766e]/35 bg-[#0f766e]/10 px-4 py-3 text-[#8af5e8] text-sm">
            <ShieldCheckIcon className="size-5" />
            <span>Local-first · UK00004343685</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-5 rounded-3xl border border-zinc-800 bg-card/50 p-5">
          <div>
            <h2 className="font-semibold text-xl">System prompt generator</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Enter the institution and decision categories your AI agent
              handles. The generated text can be pasted into Claude, OpenAI,
              LangChain, AutoGen, Copilot, or a custom orchestrator.
            </p>
          </div>

          <label className="space-y-2" htmlFor="institution">
            <span className="text-sm">Institution name</span>
            <Input
              id="institution"
              onChange={(event) => setInstitution(event.target.value)}
              placeholder="Example Council"
              value={institution}
            />
          </label>

          <label className="space-y-2" htmlFor="decision-types">
            <span className="text-sm">Decision types</span>
            <Textarea
              id="decision-types"
              onChange={(event) => setDecisionTypes(event.target.value)}
              placeholder="hiring shortlists, credit markers, account closures"
              value={decisionTypes}
            />
          </label>

          <div className="rounded-2xl border border-[#d6bc8f]/25 bg-[#d6bc8f]/10 p-4">
            <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.2em]">
              Plain-English explanation
            </p>
            <p className="mt-2 text-sm text-zinc-300 leading-6">
              This snippet tells an AI system to stop before it takes or
              recommends an action about a real person, check whether a named
              human reviewed that person&apos;s specific facts, and escalate if
              the answer is no or unclear.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-[#d6bc8f]/25 bg-[#08080c]/90 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.2em]">
                Copy-ready snippet
              </p>
              <h2 className="mt-1 font-semibold text-xl">
                Custom system instruction
              </h2>
            </div>
            <Button onClick={copyPrompt} variant="outline">
              {copyStatus === "copied" ? (
                <CheckIcon className="size-4" />
              ) : (
                <ClipboardIcon className="size-4" />
              )}
              {copyStatus === "copied" ? "Copied" : "Copy"}
            </Button>
          </div>

          {copyStatus === "failed" && (
            <p className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-3 text-amber-100 text-sm">
              Copy failed. Please select the snippet and copy it manually.
            </p>
          )}

          <pre className="whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-200 leading-6">
            {systemPrompt}
          </pre>

          <div className="grid gap-3 text-sm md:grid-cols-3">
            {["SOVEREIGN", "NULL", "AMBIGUOUS"].map((classification) => (
              <div
                className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
                key={classification}
              >
                <p className="font-mono text-[#d6bc8f] text-xs uppercase tracking-[0.18em]">
                  {classification}
                </p>
                <p className="mt-2 text-zinc-400">
                  {classification === "SOVEREIGN"
                    ? "Named human review confirmed."
                    : classification === "NULL"
                      ? "No confirmed individual review."
                      : "The review position is unclear."}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
