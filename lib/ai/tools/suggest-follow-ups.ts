import { tool } from "ai";
import { z } from "zod";

export const suggestFollowUps = tool({
  description:
    "Suggest 2-3 follow-up questions after every conversational response. Skip after artifact create/edit/update. Each suggestion must cover a distinct angle — never repeat or rephrase an earlier suggestion.",
  inputSchema: z.object({
    suggestions: z
      .array(z.string())
      .min(2)
      .max(3)
      .describe(
        "2-3 concise, natural follow-up questions. Each must explore a different topic or next step — no duplicates from this conversation."
      ),
  }),
  // Pass-through: the model generates suggestions via tool call and the UI
  // extracts them from the tool output to render as clickable chips.
  execute: ({ suggestions }) => {
    return { suggestions };
  },
});
