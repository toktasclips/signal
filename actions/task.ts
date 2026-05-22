"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { taskSchema } from "@/lib/validations/task";
import type { ActionState } from "@/types";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
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

  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    user_id: user.id,
  });

  if (error) return { status: "error", error: "Failed to create task." };
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

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to complete task." };
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
