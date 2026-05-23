"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hotLeadUpdateSchema, followUpDateSchema, quickNoteSchema } from "@/lib/validations/lead";
import { trackEvent } from "@/lib/events/track";
import type { ActionState, LeadPriority } from "@/types";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleHotLead(id: string, currentValue: boolean): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { data: lead } = await supabase
    .from("leads")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({ is_hot: !currentValue })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  await trackEvent({
    userId: user.id,
    type: currentValue ? "lead_removed_hot" : "lead_hot",
    title: currentValue
      ? `${lead?.name ?? "Lead"} removed from hot list`
      : `${lead?.name ?? "Lead"} added to hot list`,
    leadId: id,
  });

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

  const { data: lead } = await supabase
    .from("leads")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({ priority: parsed.data.priority })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  await trackEvent({
    userId: user.id,
    type: "priority_changed",
    title: `${lead?.name ?? "Lead"} priority set to ${priority}`,
    leadId: id,
    metadata: { priority },
  });

  revalidatePath("/hot-list");
  revalidatePath("/leads");
  return { status: "success" };
}

export async function updateFollowUpDate(id: string, date: string | null): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = followUpDateSchema.safeParse({ follow_up_date: date });
  if (!parsed.success) return { status: "error", error: "Invalid date." };

  const { data: lead } = await supabase
    .from("leads")
    .select("name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({ follow_up_date: parsed.data.follow_up_date })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  if (date) {
    await trackEvent({
      userId: user.id,
      type: "followup_scheduled",
      title: `Follow-up scheduled for ${lead?.name ?? "lead"}`,
      description: `Follow-up set for ${new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
      leadId: id,
      metadata: { date },
    });
  }

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
