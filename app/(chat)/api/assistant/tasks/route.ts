import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createAssistantTask,
  getAssistantTasksByUserId,
  updateAssistantTaskStatus,
} from "@/lib/db/queries";
import { IrisError } from "@/lib/errors";

const createTaskSchema = z.object({
  chatId: z.string().uuid().optional(),
  title: z.string().min(1).max(240),
  notes: z.string().max(4000).optional(),
  category: z
    .enum(["task", "reminder", "case", "goal", "contact"])
    .default("task"),
  dueAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "done", "archived"]),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "open";

  if (!["open", "done", "archived", "all"].includes(status)) {
    return new IrisError(
      "bad_request:api",
      "Invalid task status."
    ).toResponse();
  }

  const tasks = await getAssistantTasksByUserId({
    userId: session.user.id,
    status: status as "open" | "done" | "archived" | "all",
  });

  return Response.json(tasks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError("bad_request:api", "Invalid JSON body.").toResponse();
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        code: "bad_request:api",
        message: "Invalid task payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const task = await createAssistantTask({
    ...parsed.data,
    userId: session.user.id,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
  });

  return Response.json(task, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError("bad_request:api", "Invalid JSON body.").toResponse();
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        code: "bad_request:api",
        message: "Invalid task update payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const task = await updateAssistantTaskStatus({
    ...parsed.data,
    userId: session.user.id,
  });

  if (!task) {
    return new IrisError("not_found:database", "Task not found.").toResponse();
  }

  return Response.json(task);
}
