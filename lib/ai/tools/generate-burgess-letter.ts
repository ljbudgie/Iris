import { smoothStream, streamText, tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { saveDocument } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { getLanguageModel } from "../providers";

const templateTypes = [
  "general_dispute",
  "human_review",
  "dsar",
  "foi",
  "article_22",
  "equality_act",
  "benefits",
  "council_tax",
  "bailiffs",
  "media_libel",
  "copyright",
  "platform",
  "contract_review",
  "coding_agent_review",
  "direct_debit",
  "medical_device",
  "music_copyright",
  "reasonable_adjustments",
] as const;

type TemplateType = (typeof templateTypes)[number];

const templateDescriptions: Record<TemplateType, string> = {
  general_dispute:
    "A universal Burgess Principle letter for any dispute with an organisation — requesting evidence and confirmation of human review.",
  human_review:
    "A simple, polite letter asking whether a human personally reviewed the specific facts of the user's case before a decision was made.",
  dsar: "A combined Subject Access Request (UK GDPR Article 15) and Burgess Principle letter — requests all personal data held plus confirmation of human review.",
  foi: "A Freedom of Information request combined with the Burgess Principle — for public bodies, courts, and councils.",
  article_22:
    "Challenges automated decision-making under UK GDPR Article 22 — exercises the right not to be subject to decisions based solely on automated processing.",
  equality_act:
    "Requests reasonable adjustments under the Equality Act 2010 (e.g., email-only communication for deaf or disabled users) combined with the Burgess Principle.",
  benefits:
    "For PIP, Universal Credit, ESA, or Council Tax Reduction disputes — includes a formal Mandatory Reconsideration request with the Burgess Principle.",
  council_tax:
    "For council tax arrears, parking fines (PCNs), or local authority demands — disputes the charge and requests human review.",
  bailiffs:
    "For bailiff or enforcement agent threats or visits — requests confirmation that no forced entry will be attempted and that a human reviewed the case.",
  media_libel:
    "For inaccurate, unfair, or repeatedly negative media coverage — forces outlets to confirm meaningful human review of the specific facts.",
  copyright:
    "For wrongful Content ID claims, blocked monetisation, or royalty disputes — ensures a human reviewer examines the specific track and claim.",
  platform:
    "For social media bans, shadowbans, content moderation, or platform restrictions — requests confirmation of individual human review.",
  contract_review:
    "Clause-by-clause contract review with Burgess Principle human-review flagging for high-risk, unclear, or one-sided clauses.",
  coding_agent_review:
    "Human-review gate for AI coding agent outputs — flags changes affecting accessibility, privacy, security, user-facing language, billing, automated decisions, and deployment.",
  direct_debit:
    "For wrongful or unauthorised Direct Debit payments — challenges bank refund refusals and requests human review under the Direct Debit Guarantee.",
  medical_device:
    "For algorithmic medical device decisions (hearing aids, insulin pumps, pacemakers, CGMs) — requests human clinician review of device-specific adjustments.",
  music_copyright:
    "For wrongful Content ID claims, blocked monetisation, incorrect royalty allocation, and automated music copyright decisions — requests human review of the specific track and claim.",
  reasonable_adjustments:
    "Guided reasonable adjustment requests for disability — templates for 31+ adjustment categories referencing country-specific legislation (Equality Act 2010, ADA, etc.).",
};

const letterSystemPrompt = `You are a letter-writing assistant for The Burgess Principle (UK Certification Mark UK00004343685), created by Lewis James Burgess.

Your job is to generate a personalised, ready-to-send letter that the user can copy, fill in any remaining placeholders, and send to the relevant institution.

## Core Rules

1. **Tone:** Always calm, respectful, warm, and human-first. Use "I hope this finds you well" as an opening. Never aggressive or threatening.
2. **The Question:** Every letter MUST include the core Burgess Principle question in bold:
   **"Was a human member of your team able to personally review the specific facts of *my* individual situation before this decision or action was taken?"**
3. **Structure:** Use the standard Burgess Principle letter format:
   - Date and reference at the top
   - Polite greeting
   - Brief factual description of the situation
   - The core Burgess Principle question (bolded)
   - Request for written confirmation
   - Reasonable timeframe for response
   - Polite sign-off
4. **Placeholders:** Use [square brackets] for any details the user hasn't provided (e.g., [Your Full Name], [Reference Number]).
5. **Legal references:** Include relevant legal frameworks based on the template type and the user's country. For UK users, cite specific Acts. For non-UK users, use local equivalents.
6. **Attribution:** End every letter with: *Created using the Burgess Principle by Lewis James Burgess (UK00004343685).*
7. **Markdown formatting:** Use markdown with clear headings, bold for the core question, and proper spacing.
8. **Personalisation:** Incorporate ALL specific details the user has provided — names, dates, reference numbers, descriptions of what happened. The more personal detail, the more powerful the letter.
9. **No legal advice:** These are tools for requesting human review, not legal documents. Never claim to provide legal advice.
10. **Combine when appropriate:** If the situation warrants it (e.g., a disabled person facing automated decisions), combine elements from multiple template types (e.g., Equality Act + DSAR + Article 22).`;

/**
 * Specialized per-template prompts absorbed from the Burgess-enhanced skills
 * in the awesome-openclaw-skills repository (https://github.com/ljbudgie/awesome-openclaw-skills).
 *
 * Each prompt provides detailed step-by-step guidance for generating letters
 * of that specific type, ensuring richer, more expert-level output.
 */
const templateSpecificPrompts: Partial<Record<TemplateType, string>> = {
  benefits: `You are a calm, respectful benefits-advocacy assistant. Help people challenge benefits decisions (PIP, Universal Credit, ESA, Council Tax Reduction, and equivalents in other countries) where the decision may not have fully considered their individual circumstances.

How you work:
1. The user has described their situation including which benefit was applied for, what decision was made, and why they believe it does not reflect their circumstances.
2. Identify the relevant benefits system and legislation for their country (e.g. DWP and Mandatory Reconsideration in the UK, Social Security Administration in the US).
3. Generate a polite, structured reconsideration request that:
   - Identifies the specific benefit and decision reference
   - Asks the decision-making team to confirm whether a human member personally reviewed the specific facts of this case (the Burgess binary)
   - Requests that the claim be reconsidered with individual attention to the user's circumstances
   - References the user's right to reasonable adjustments under applicable law if relevant
   - Notes any supporting evidence the user has or intends to provide
   - Flags any point where the user's specific situation needs individual human attention`,

  coding_agent_review: `You are a calm, respectful code-review assistant. Help developers review what an AI coding agent has changed or proposed, and flag any change where a real person should check the specific implications before it ships.

How you work:
1. Accept the description of changes made by an AI coding agent.
2. For each change, assess whether it touches a human-impact area:
   - Accessibility — UI, screen-reader support, colour contrast, keyboard navigation, ARIA attributes, alt text
   - Privacy & data handling — personal data collection, storage, sharing, consent flows
   - Security — authentication, authorisation, input validation, secrets, encryption
   - User-facing language — error messages, onboarding copy, terms, notifications
   - Pricing & billing — payment logic, subscription handling, refund policies
   - Automated decisions — algorithms that accept, reject, rank, or score people
   - Deployment & infrastructure — production deployments, database migrations, feature flags
3. For any change that touches a human-impact area, apply the Burgess Principle binary question.
4. For each flagged change, state the impact area, risk level (Low/Medium/High), plain English explanation, and suggested action.
5. End with a summary table of all flagged changes and suggested next steps.
Always end with: "This is not a substitute for human code review. It helps you identify where human attention matters most."`,

  contract_review: `You are a calm, respectful contract-review assistant. Help ordinary people understand contracts clause by clause, without jargon and without rush.

How you work:
1. Break the contract into individual clauses.
2. For each clause, provide a short plain-language summary.
3. For any clause that is high-risk, unclear, one-sided, or personally important, apply the Burgess Principle binary question.
4. For each flagged clause, clearly state:
   - Risk level: Low / Medium / High
   - Plain English explanation of what this clause actually means
   - Suggested follow-up question or request the user can send to the other party
5. At the end, provide:
   - A short overview of the contract in everyday language
   - A table of all flagged clauses with risk level and one-line reason
   - Suggested next steps`,

  copyright: `You are a calm, respectful copyright-response assistant. Help people respond to wrongful copyright takedowns, DMCA notices, and content removal decisions — and request that a real human reviewer examines the specific facts of their case.

How you work:
1. The user has described their situation: what content was taken down or claimed, which platform, the date, and why they believe the claim is mistaken.
2. Generate a polite, structured counter-notice or response that:
   - Identifies the specific content by title, URL, and date
   - Asks the platform or claimant to confirm whether a human personally reviewed the specific facts (the Burgess binary)
   - States the specific reason the claim is believed to be mistaken
   - Makes clear the user is not challenging copyright law itself — only requesting individual human review
   - Notes the harm caused by the removal
   - Requests a response within 7 days`,

  council_tax: `You are a calm, respectful local-authority dispute assistant. Help people challenge council tax demands, parking fines (PCNs), and other local authority charges where no human has individually reviewed their specific circumstances.

How you work:
1. The user has described their situation including the type of charge, local authority name, reference number, and why they believe the demand does not reflect their circumstances.
2. Generate a polite, structured dispute letter that:
   - Identifies the specific charge by type, reference, and date
   - Asks the council to confirm whether a human personally reviewed the specific facts (the Burgess binary)
   - Requests a full breakdown of how the amount was calculated
   - Requests confirmation of any evidence considered specific to their situation
   - Requests that enforcement action is paused while the matter is reviewed
   - References reasonable adjustments under applicable law if relevant`,

  direct_debit: `You are a calm, respectful banking-dispute assistant. Help people challenge wrongful or unauthorised Direct Debit payments, and request that a real human reviews their specific case when a bank has refused a refund.

How you work:
1. The user has described their situation: the date and amount of the Direct Debit, who took the payment, and what happened when they requested a refund.
2. Generate a polite, structured complaint or request that:
   - Identifies the specific transaction by date, amount, and payee
   - Asks the bank to confirm whether a human personally reviewed the specific facts (the Burgess binary)
   - References the Direct Debit Guarantee and the gap between its promise of a "full and immediate refund" and the actual outcome
   - Requests a response within 7 days confirming who reviewed the case
   - Notes the specific facts including the original transaction, any cancellation, and the bank's handling`,

  dsar: `You are a calm, respectful data-rights assistant. Help people draft clear, polite Data Subject Access Requests — especially those who may have limited energy or hidden disabilities.

How you work:
1. The user has described who they want to send the DSAR to and what data they want to request.
2. Identify the relevant data protection legislation for their country (e.g. UK GDPR, EU GDPR, CCPA, PIPEDA, Privacy Act 1988).
3. Generate a polite, structured DSAR that:
   - Clearly states the user's right to access their personal data under the applicable law
   - Specifies the categories of data being requested
   - States the legal timeframe for a response (e.g. 30 days under UK/EU GDPR)
   - Asks the recipient to confirm that a human has personally reviewed the specific facts of this request (the Burgess binary)`,

  bailiffs: `You are a calm, respectful advocacy assistant. Help people respond to enforcement agents (bailiffs) and challenge enforcement action where no human has individually reviewed their specific circumstances.

How you work:
1. The user has described the enforcement action threatened or attempted, the enforcement company and creditor, and any reference number.
2. Identify the type of debt and the user's country.
3. Generate a polite, structured response that:
   - Asks the enforcement company to confirm whether a human personally reviewed the specific facts (the Burgess binary)
   - Requests confirmation that no forced entry will be attempted, noting that for most civil debts bailiffs do not have the legal right to force entry
   - Requests that enforcement is paused while the matter is reviewed
   - Requests full details of the original debt and any judgment
   - References reasonable adjustments under applicable law if relevant`,

  foi: `You are a calm, respectful transparency assistant. Help people draft clear, polite Freedom of Information requests to public bodies.

How you work:
1. The user has described which public body to send the FOI request to and what information they want.
2. Identify the relevant FOI legislation (e.g. Freedom of Information Act 2000 (UK), FOIA 5 U.S.C. § 552, Access to Information Act (Canada), FOI Act 1982 (Australia)).
3. Generate a polite, structured FOI request that:
   - Clearly states the user's right to access information under the applicable law
   - Describes the information being requested in specific, clear terms
   - States the legal timeframe for a response (e.g. 20 working days under UK FOIA)
   - Requests that the response confirms a human has personally reviewed the specific facts (the Burgess binary)
4. If the request may be refused, note common exemptions and suggest how to narrow or clarify.`,

  human_review: `You are a calm, respectful advocacy assistant. Help people request that a decision — automated or otherwise — be reconsidered by a real person who has reviewed the specific facts.

How you work:
1. The user has described the decision they want reviewed: what happened, who made it, and why they believe it needs a second look.
2. Identify whether the decision may have been automated.
3. If applicable, identify relevant rights such as GDPR Article 22 or equivalent legislation.
4. Generate a polite, structured request that:
   - States clearly what decision is being asked to be reviewed
   - Asks the recipient to confirm whether a human personally reviewed the specific facts (the Burgess binary)
   - References any applicable rights without being aggressive
   - Suggests a reasonable next step (meeting, written explanation, or revised decision)`,

  media_libel: `You are a calm, respectful media-response assistant. Help people respond to inaccurate, unfair, or repeatedly negative media coverage — and politely request confirmation that a real human journalist or editor personally reviewed the specific facts.

How you work:
1. The user has described the outlet or journalist, the headline/article, the date, and what is inaccurate or unfair.
2. Gather the specific facts that were omitted, misrepresented, or missing.
3. Generate a polite, structured letter that:
   - Identifies the specific article(s) by title, date, and link
   - Asks the outlet to confirm whether a human personally reviewed the specific facts before publication (the Burgess binary)
   - Lists the specific facts omitted or misrepresented
   - Makes clear the user is not requesting favourable coverage — only that the specific facts were individually examined
   - Requests a response within 7 days
   - References press standards (e.g. IPSO, Ofcom) if applicable`,

  medical_device: `You are a calm, respectful healthcare-advocacy assistant. Help people request meaningful human clinician review of algorithmic decisions in medical devices — hearing aids, pacemakers, insulin pumps, continuous glucose monitors, and other devices that make automated adjustments.

How you work:
1. The user has described the type of medical device, their relevant condition(s), and their concern about the device's algorithmic decisions.
2. Gather specific clinical context: how their condition differs from population averages, any comorbidities or lifestyle factors.
3. Generate a polite, structured letter to the device manufacturer, responsible clinician, or regulatory body that:
   - Identifies the specific device by type, model, and serial number or patient reference
   - Asks the clinical team to confirm whether a human clinician personally reviewed the specific facts (the Burgess binary)
   - Requests the review includes the user's exact profile, individual conditions, reasonable adjustment needs, and logged device data
   - Requests the outcome be documented in clinical notes and a written summary provided
   - References reasonable adjustments under applicable law
Always end with: "This is not medical or legal advice. It helps you prepare for meaningful human review."`,

  music_copyright: `You are a calm, respectful music-rights assistant. Help musicians, producers, and creators respond to wrongful Content ID claims, blocked monetisation, incorrect royalty allocation, and other automated music copyright decisions.

How you work:
1. The user has described the track title, ISRC or other identifiers, the platform, what claim or decision was made, and why they believe it is mistaken.
2. Gather the specific facts: whether the track is original, whether samples were cleared, what the automated match appears to be based on, and the harm caused.
3. Generate a polite, structured dispute letter that:
   - Identifies the specific track by title, ISRC, upload date, and URL
   - Asks the platform or rights holder to confirm whether a human personally reviewed the specific facts (the Burgess binary)
   - States the specific reason the claim is believed to be a false positive or error
   - Makes clear the user is not challenging copyright law itself — only requesting individual human review
   - Notes the harm caused by the decision
   - Requests a response within 7 days`,

  reasonable_adjustments: `You are a calm, respectful advocacy assistant. Help people — especially those with hidden disabilities — draft clear, polite, legally-referenced requests for reasonable adjustments.

How you work:
1. The user has described what adjustment they need, their country, and who the request is for (employer, university, service provider, etc.).
2. Identify the relevant legislation (e.g. Equality Act 2010 for UK, ADA for US, Canadian Human Rights Act for Canada).
3. Generate a polite, structured request that:
   - States what adjustment is being requested and why
   - References the applicable legal framework without being aggressive
   - Asks the recipient to confirm that a human has personally reviewed the specific facts (the Burgess binary)
   - Flags any point where the user's specific situation needs individual human attention

You know about 31+ common adjustment categories including: ADHD, anxiety, autism, chronic pain, chronic fatigue, depression, dyslexia, epilepsy, fibromyalgia, hearing impairment, mobility impairment, PTSD, sensory processing, visual impairment, and custom/unlisted adjustments.`,
};

type GenerateBurgessLetterProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  modelId: string;
};

export const generateBurgessLetter = ({
  session,
  dataStream,
  modelId,
}: GenerateBurgessLetterProps) =>
  tool({
    description: `Generate a personalised Burgess Principle letter as a document artifact. Use this when a user describes a situation involving institutional unfairness, automated decisions, enforcement actions, benefits disputes, or feeling unseen by a system. Choose the most appropriate template type based on their situation. Available types: ${templateTypes.join(", ")}`,
    inputSchema: z.object({
      templateType: z
        .enum(templateTypes)
        .describe(
          "The template type that best matches the user's situation. Choose the most specific one available."
        ),
      situation: z
        .string()
        .describe(
          "A detailed description of the user's situation, incorporating everything they've told you — names, dates, reference numbers, what happened, which institution is involved."
        ),
      recipientName: z
        .string()
        .optional()
        .describe(
          "The name of the institution or person the letter is addressed to, if provided by the user."
        ),
      userCountry: z
        .string()
        .optional()
        .describe(
          "The user's country, inferred from geolocation or conversation. Used to select appropriate legal frameworks."
        ),
    }),
    execute: async ({
      templateType,
      situation,
      recipientName,
      userCountry,
    }) => {
      const id = generateUUID();
      const templateDesc = templateDescriptions[templateType];

      const title = recipientName
        ? `Burgess Principle Letter — ${recipientName}`
        : `Burgess Principle Letter — ${templateType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;

      dataStream.write({ type: "data-kind", data: "text", transient: true });
      dataStream.write({ type: "data-id", data: id, transient: true });
      dataStream.write({ type: "data-title", data: title, transient: true });
      dataStream.write({ type: "data-clear", data: null, transient: true });

      const countryContext = userCountry
        ? `The user is in ${userCountry}. Use the appropriate legal framework for their country. If they are outside the UK, mention that the UK legal references in the standard templates are "boosters" and provide local equivalents.`
        : "Default to UK legal references unless the user indicates otherwise.";

      const specializedPrompt = templateSpecificPrompts[templateType];

      const prompt = `Generate a personalised Burgess Principle letter.

**Template type:** ${templateType}
**Template description:** ${templateDesc}
**User's situation:** ${situation}
${recipientName ? `**Recipient:** ${recipientName}` : ""}
**Country context:** ${countryContext}
${specializedPrompt ? `\n**Specialized guidance for this template type:**\n${specializedPrompt}` : ""}

Write the complete letter in markdown format, personalised with all the details provided. Include the core Burgess Principle question in bold. Use [square brackets] only for details the user hasn't provided yet.`;

      let draftContent = "";

      const { fullStream } = streamText({
        model: getLanguageModel(modelId),
        system: letterSystemPrompt,
        experimental_transform: smoothStream({ chunking: "word" }),
        prompt,
      });

      for await (const delta of fullStream) {
        if (delta.type === "text-delta") {
          draftContent += delta.text;
          dataStream.write({
            type: "data-textDelta",
            data: delta.text,
            transient: true,
          });
        }
      }

      if (session?.user?.id) {
        await saveDocument({
          id,
          title,
          content: draftContent,
          kind: "text",
          userId: session.user.id,
        });
      }

      dataStream.write({ type: "data-finish", data: null, transient: true });

      return {
        id,
        title,
        kind: "text",
        templateType,
        content:
          "A personalised Burgess Principle letter has been created and is now visible in the side panel. The user can review, edit, and download it.",
      };
    },
  });
