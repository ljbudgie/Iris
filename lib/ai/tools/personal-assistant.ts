import { tool } from "ai";
import { z } from "zod";
import {
  createAssistantTask,
  getAssistantTasksByUserId,
  updateAssistantTaskStatus,
} from "@/lib/db/queries";

type AssistantToolContext = {
  session: {
    user?: {
      id?: string;
    };
  };
};

function requireUserId(ctx: AssistantToolContext) {
  const userId = ctx.session.user?.id;
  if (!userId) {
    throw new Error("Assistant task tools require an authenticated user.");
  }
  return userId;
}

export function createAssistantTaskTool(ctx: AssistantToolContext) {
  return tool({
    description:
      "Create a personal assistant task, reminder, case tracker, goal, or institution/contact record for the user. Use when the user asks Iris to remember an action, track a case, prepare a next step, or remind them.",
    inputSchema: z.object({
      title: z.string().min(1).max(240),
      notes: z.string().max(4000).optional(),
      category: z
        .enum(["task", "reminder", "case", "goal", "contact"])
        .default("task"),
      dueAt: z
        .string()
        .datetime()
        .optional()
        .describe(
          "Optional ISO 8601 due date/time for reminders or deadlines."
        ),
      metadata: z.record(z.unknown()).optional(),
    }),
    execute: async ({ title, notes, category, dueAt, metadata }) => {
      const task = await createAssistantTask({
        userId: requireUserId(ctx),
        title,
        notes,
        category,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        metadata,
      });

      return {
        status: "created",
        task,
      };
    },
  });
}

export function listAssistantTasksTool(ctx: AssistantToolContext) {
  return tool({
    description:
      "List the user's personal assistant tasks, reminders, tracked cases, goals, and contacts. Use when the user asks what needs attention, what is pending, or what Iris is tracking.",
    inputSchema: z.object({
      status: z.enum(["open", "done", "archived", "all"]).default("open"),
    }),
    execute: async ({ status }) => {
      const tasks = await getAssistantTasksByUserId({
        userId: requireUserId(ctx),
        status,
      });

      return {
        status: "ok",
        tasks,
      };
    },
  });
}

export function updateAssistantTaskTool(ctx: AssistantToolContext) {
  return tool({
    description:
      "Update a personal assistant task status. Use when the user says a tracked item is done, should be reopened, or should be archived.",
    inputSchema: z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "done", "archived"]),
    }),
    execute: async ({ id, status }) => {
      const task = await updateAssistantTaskStatus({
        id,
        status,
        userId: requireUserId(ctx),
      });

      return {
        status: task ? "updated" : "not_found",
        task,
      };
    },
  });
}
