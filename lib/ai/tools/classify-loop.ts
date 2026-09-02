import { tool } from "ai";
import { z } from "zod";
import { classifyThread } from "@/lib/loop";

export const classifyLoop = tool({
  description:
    "Classify a local correspondence thread for a provisional institutional delay pattern. Returns LOOP DETECTED or NO LOOP, the applicable type, and a separate SOVEREIGN/NULL accountability signal. Advisory only — a named human must confirm any finding before it is recorded. Use when the user pastes a back-and-forth with an institution, or says they are being sent in circles, asked for the same evidence twice, redirected between teams, stuck in identity verification, or told to phone after requesting email-only contact.",
  inputSchema: z.object({
    institution: z.string().optional().describe("Institution name, if known."),
    named_individual: z
      .string()
      .nullable()
      .optional()
      .describe(
        "Named officer who personally reviewed the specific facts, if one has been identified. Leave null when no name exists."
      ),
    messages: z
      .array(
        z.object({
          date: z.string().describe("ISO-8601 date or datetime of the message."),
          sender: z.string().describe("Who sent the message."),
          content_summary: z
            .string()
            .describe(
              "Short summary of the message. Do not paste unnecessary raw personal facts."
            ),
          direction: z.enum(["institution", "individual"]).optional(),
          reference: z.string().optional(),
        })
      )
      .min(1)
      .max(500),
  }),
  execute: async ({ institution, named_individual, messages }) => {
    return classifyThread({
      institution,
      named_individual,
      messages,
    });
  },
});
