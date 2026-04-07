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

      const prompt = `Generate a personalised Burgess Principle letter.

**Template type:** ${templateType}
**Template description:** ${templateDesc}
**User's situation:** ${situation}
${recipientName ? `**Recipient:** ${recipientName}` : ""}
**Country context:** ${countryContext}

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
