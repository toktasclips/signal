"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateStatusSchema,
  markWonSchema,
  markLostSchema,
  updateValueSchema,
} from "@/lib/validations/pipeline";
import { trackEvent } from "@/lib/events/track";
import { analyzeAndSaveTags } from "@/lib/semantic/analyze";
import type { ActionState, LeadStatus } from "@/types";

const STAGE_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  offer_sent: "Offer Sent",
  won: "Won",
  lost: "Lost",
};

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidatePipeline() {
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/activity");
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = updateStatusSchema.safeParse({ status });
  if (!parsed.success) return { status: "error", error: "Invalid status." };

  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  const { data: lead } = await supabase
    .from("leads")
    .select("name")
    .eq("id", id)
    .single();

  trackEvent({
    userId: user.id,
    type: "lead_moved_stage",
    title: `${lead?.name ?? "Lead"} moved to ${STAGE_LABELS[status]}`,
    leadId: id,
    metadata: { status },
  });

  revalidatePipeline();
  return { status: "success" };
}

export async function markLeadWon(
  id: string,
  win_note?: string | null
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = markWonSchema.safeParse({ win_note });
  if (!parsed.success) return { status: "error", error: "Invalid data." };

  const { data: lead } = await supabase
    .from("leads")
    .select("name, company, value")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({
      status: "won",
      closed_at: new Date().toISOString(),
      win_note: parsed.data.win_note,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  trackEvent({
    userId: user.id,
    type: "lead_won",
    title: `Deal closed — won: ${lead?.name ?? "Lead"}`,
    description: lead?.value
      ? `${lead.name}${lead.company ? ` (${lead.company})` : ""} closed at $${lead.value.toLocaleString()}.`
      : `${lead?.name ?? "Lead"} marked as won.`,
    leadId: id,
    metadata: { value: lead?.value, win_note: parsed.data.win_note },
  });

  revalidatePipeline();
  return { status: "success" };
}

export async function markLeadLost(
  id: string,
  lost_reason?: string | null
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = markLostSchema.safeParse({ lost_reason });
  if (!parsed.success) return { status: "error", error: "Invalid data." };

  const { data: lead } = await supabase
    .from("leads")
    .select("name, company")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({
      status: "lost",
      closed_at: new Date().toISOString(),
      lost_reason: parsed.data.lost_reason,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };

  trackEvent({
    userId: user.id,
    type: "lead_lost",
    title: `Deal closed — lost: ${lead?.name ?? "Lead"}`,
    description: parsed.data.lost_reason
      ? `Reason: ${parsed.data.lost_reason}`
      : `${lead?.name ?? "Lead"} was marked as lost.`,
    leadId: id,
    metadata: { lost_reason: parsed.data.lost_reason },
  });

  // Analyze lost reason for semantic signals (fire-and-forget)
  analyzeAndSaveTags({
    userId: user.id,
    leadId: id,
    sourceType: "lost_reason",
    sourceId: id,
    text: parsed.data.lost_reason,
  });

  revalidatePipeline();
  return { status: "success" };
}

export async function updateLeadValue(
  id: string,
  value: number | null
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = updateValueSchema.safeParse({ value });
  if (!parsed.success) return { status: "error", error: "Invalid value." };

  const { error } = await supabase
    .from("leads")
    .update({ value: parsed.data.value })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };
  revalidatePipeline();
  return { status: "success" };
}
