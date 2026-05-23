"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskSchema } from "@/lib/validations/task";
import { trackEvent } from "@/lib/events/track";
import { analyzeAndSaveTags } from "@/lib/semantic/analyze";
import type { ActionState } from "@/types";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
}

export async function createTask(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data, error } = await supabase.from("tasks").insert({
    ...parsed.data,
    user_id: user.id,
  }).select("id").single();

  if (error) return { status: "error", error: "Failed to create task." };

  trackEvent({
    userId: user.id,
    type: "task_created",
    title: `Task created: ${parsed.data.title}`,
    taskId: data?.id,
    leadId: parsed.data.lead_id ?? null,
    metadata: { priority: parsed.data.priority, due_date: parsed.data.due_date },
  });

  if (data?.id && parsed.data.description) {
    analyzeAndSaveTags({
      userId: user.id,
      leadId: parsed.data.lead_id ?? null,
      sourceType: "task_description",
      sourceId: data.id,
      text: parsed.data.description,
    });
  }

  revalidateAll();
  return { status: "success" };
}

export async function updateTask(
  id: string,
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update task." };
  revalidateAll();
  return { status: "success" };
}

export async function deleteTask(id: string): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to delete task." };
  revalidateAll();
  return { status: "success" };
}

export async function completeTask(id: string): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { data: task } = await supabase
    .from("tasks")
    .select("title, lead_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to complete task." };

  trackEvent({
    userId: user.id,
    type: "task_completed",
    title: `Task completed: ${task?.title ?? "Task"}`,
    taskId: id,
    leadId: task?.lead_id ?? null,
  });

  revalidateAll();
  return { status: "success" };
}

export async function reopenTask(id: string): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .update({ status: "todo", completed_at: null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to reopen task." };
  revalidateAll();
  return { status: "success" };
}
