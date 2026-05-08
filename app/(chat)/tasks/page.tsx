"use client";

import { CheckCircle2Icon, CircleIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AssistantTask } from "@/lib/db/schema";

export default function AssistantTasksPage() {
  const [tasks, setTasks] = useState<AssistantTask[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<AssistantTask["category"]>("task");
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/assistant/tasks?status=all`
      );
      if (!res.ok) {
        throw new Error("Failed to load tasks");
      }
      setTasks(await res.json());
    } catch {
      toast.error("Failed to load assistant tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = async () => {
    if (!title.trim()) {
      return;
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/assistant/tasks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category }),
      }
    );
    if (!res.ok) {
      toast.error("Could not create task.");
      return;
    }
    setTitle("");
    toast.success("Iris is tracking it.");
    loadTasks();
  };

  const updateStatus = async (
    id: string,
    status: "open" | "done" | "archived"
  ) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/assistant/tasks`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      }
    );
    if (!res.ok) {
      toast.error("Could not update task.");
      return;
    }
    loadTasks();
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-semibold text-xl">Personal Assistant</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Tasks, reminders, tracked cases, goals, and institution contacts that
          Iris is helping you manage.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card/40 p-4 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What should Iris track?"
          value={title}
        />
        <select
          className="rounded-lg border bg-background px-3 py-2 text-sm"
          onChange={(event) =>
            setCategory(event.target.value as AssistantTask["category"])
          }
          value={category}
        >
          <option value="task">Task</option>
          <option value="reminder">Reminder</option>
          <option value="case">Case</option>
          <option value="goal">Goal</option>
          <option value="contact">Contact</option>
        </select>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm disabled:opacity-40"
          disabled={!title.trim()}
          onClick={createTask}
          type="button"
        >
          <PlusIcon className="size-4" />
          Track
        </button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground text-sm">
          Loading assistant tasks…
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground text-sm">
          Nothing tracked yet. Ask Iris to remember a deadline, track a case, or
          prepare a next step.
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div
              className="flex items-start gap-3 rounded-2xl border bg-card/40 p-4"
              key={task.id}
            >
              <button
                className="mt-0.5 text-muted-foreground hover:text-primary"
                onClick={() =>
                  updateStatus(
                    task.id,
                    task.status === "done" ? "open" : "done"
                  )
                }
                type="button"
              >
                {task.status === "done" ? (
                  <CheckCircle2Icon className="size-5 text-primary" />
                ) : (
                  <CircleIcon className="size-5" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
                    {task.category}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                    {task.status}
                  </span>
                </div>
                {task.notes && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    {task.notes}
                  </p>
                )}
              </div>
              {task.status !== "archived" && (
                <button
                  className="rounded-lg px-2 py-1 text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
                  onClick={() => updateStatus(task.id, "archived")}
                  type="button"
                >
                  Archive
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
