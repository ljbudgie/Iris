"use client";

import { FileTextIcon } from "lucide-react";

const templates = [
  {
    id: "general_dispute",
    name: "General Dispute",
    description:
      "A universal Burgess Principle letter for any dispute with an organisation — requesting evidence and confirmation of human review.",
  },
  {
    id: "human_review",
    name: "Human Review",
    description:
      "A simple, polite letter asking whether a human personally reviewed the specific facts of the user's case before a decision was made.",
  },
  {
    id: "dsar",
    name: "Data Subject Access Request",
    description:
      "A combined Subject Access Request (UK GDPR Article 15) and Burgess Principle letter — requests all personal data held plus confirmation of human review.",
  },
  {
    id: "foi",
    name: "Freedom of Information",
    description:
      "A Freedom of Information request combined with the Burgess Principle — for public bodies, courts, and councils.",
  },
  {
    id: "article_22",
    name: "Article 22 — Automated Decisions",
    description:
      "Challenges automated decision-making under UK GDPR Article 22 — exercises the right not to be subject to decisions based solely on automated processing.",
  },
  {
    id: "equality_act",
    name: "Equality Act 2010",
    description:
      "Requests reasonable adjustments under the Equality Act 2010 (e.g., email-only communication for deaf or disabled users) combined with the Burgess Principle.",
  },
  {
    id: "benefits",
    name: "Benefits Dispute",
    description:
      "For PIP, Universal Credit, ESA, or Council Tax Reduction disputes — includes a formal Mandatory Reconsideration request with the Burgess Principle.",
  },
  {
    id: "council_tax",
    name: "Council Tax / Parking",
    description:
      "For council tax arrears, parking fines (PCNs), or local authority demands — disputes the charge and requests human review.",
  },
  {
    id: "bailiffs",
    name: "Bailiff / Enforcement",
    description:
      "For bailiff or enforcement agent threats or visits — requests confirmation that no forced entry will be attempted and that a human reviewed the case.",
  },
  {
    id: "media_libel",
    name: "Media / Libel",
    description:
      "For inaccurate, unfair, or repeatedly negative media coverage — forces outlets to confirm meaningful human review of the specific facts.",
  },
  {
    id: "copyright",
    name: "Copyright Dispute",
    description:
      "For wrongful Content ID claims, blocked monetisation, or royalty disputes — ensures a human reviewer examines the specific track and claim.",
  },
  {
    id: "platform",
    name: "Platform Moderation",
    description:
      "For social media bans, shadowbans, content moderation, or platform restrictions — requests confirmation of individual human review.",
  },
  {
    id: "contract_review",
    name: "Contract Review",
    description:
      "Clause-by-clause contract review with Burgess Principle human-review flagging for high-risk, unclear, or one-sided clauses.",
  },
  {
    id: "coding_agent_review",
    name: "Coding Agent Review",
    description:
      "Human-review gate for AI coding agent outputs — flags changes affecting accessibility, privacy, security, user-facing language, billing, automated decisions, and deployment.",
  },
  {
    id: "direct_debit",
    name: "Direct Debit Dispute",
    description:
      "For wrongful or unauthorised Direct Debit payments — challenges bank refund refusals and requests human review under the Direct Debit Guarantee.",
  },
  {
    id: "medical_device",
    name: "Medical Device",
    description:
      "For algorithmic medical device decisions (hearing aids, insulin pumps, pacemakers, CGMs) — requests human clinician review of device-specific adjustments.",
  },
  {
    id: "music_copyright",
    name: "Music Copyright",
    description:
      "For wrongful Content ID claims, blocked monetisation, incorrect royalty allocation, and automated music copyright decisions — requests human review of the specific track and claim.",
  },
  {
    id: "reasonable_adjustments",
    name: "Reasonable Adjustments",
    description:
      "Guided reasonable adjustment requests for disability — templates for 31+ adjustment categories referencing country-specific legislation (Equality Act 2010, ADA, etc.).",
  },
] as const;

export default function TemplatesPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">Burgess Principle Templates</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {templates.length} letter templates powered by The Burgess Principle
          (UK Certification Mark UK00004343685). Ask Iris to generate any of
          these during a conversation.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <div
            className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/30"
            key={template.id}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileTextIcon className="size-3.5" />
              </div>
              <span className="font-medium text-sm">{template.name}</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {template.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
