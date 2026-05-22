"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hotLeadUpdateSchema, followUpDateSchema, quickNoteSchema } from "@/lib/validations/lead";
import type { ActionState, LeadPriority } from "@/types";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleHotLead(id: string, currentValue: boolean): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { error } = await supabase
    .from("leads")
    .update({ is_hot: !currentValue })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  revalidatePath("/hot-list");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { status: "success" };
}

export async function updateLeadPriority(id: string, priority: LeadPriority): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = hotLeadUpdateSchema.safeParse({ priority });
  if (!parsed.success) return { status: "error", error: "Invalid priority." };

  const { error } = await supabase
    .from("leads")
    .update({ priority: parsed.data.priority })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  revalidatePath("/hot-list");
  revalidatePath("/leads");
  return { status: "success" };
}

export async function updateFollowUpDate(id: string, date: string | null): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = followUpDateSchema.safeParse({ follow_up_date: date });
  if (!parsed.success) return { status: "error", error: "Invalid date." };

  const { error } = await supabase
    .from("leads")
    .update({ follow_up_date: parsed.data.follow_up_date })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  revalidatePath("/hot-list");
  revalidatePath("/dashboard");
  return { status: "success" };
}

export async function updateQuickNote(id: string, note: string): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = quickNoteSchema.safeParse({ quick_note: note || null });
  if (!parsed.success) return { status: "error", error: "Invalid note." };

  const { error } = await supabase
    .from("leads")
    .update({ quick_note: parsed.data.quick_note })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  revalidatePath("/hot-list");
  return { status: "success" };
}
