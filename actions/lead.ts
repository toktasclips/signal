"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { leadSchema } from "@/lib/validations/lead";
import type { ActionState } from "@/types";

export async function createLead(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { error } = await supabase.from("leads").insert({
    ...parsed.data,
    user_id: user.id,
  });

  if (error) return { status: "error", error: "Failed to create lead. Please try again." };

  revalidatePath("/leads");
  revalidatePath("/campaigns");
  return { status: "success", message: "Lead created." };
}

export async function updateLead(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { error } = await supabase
    .from("leads")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update lead. Please try again." };

  revalidatePath("/leads");
  revalidatePath("/campaigns");
  return { status: "success", message: "Lead updated." };
}

export async function deleteLead(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to delete lead." };

  revalidatePath("/leads");
  return { status: "success" };
}
