"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  assignLeadSchema,
  campaignCalendarItemSchema,
  campaignSchema,
} from "@/lib/validations/campaign";
import { trackEvent } from "@/lib/events/track";
import type { ActionState } from "@/types";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/campaigns");
  revalidatePath("/campaign-calendar");
  revalidatePath("/leads");
  revalidatePath("/activity");
}

export async function createCampaign(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    source: formData.get("source"),
    budget: formData.get("budget"),
    notes: formData.get("notes"),
  };

  const parsed = campaignSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data, error } = await supabase.from("campaigns").insert({
    ...parsed.data,
    user_id: user.id,
  }).select("id").single();

  if (error) return { status: "error", error: "Failed to create campaign." };

  trackEvent({
    userId: user.id,
    type: "campaign_created",
    title: `Campaign launched: ${parsed.data.name}`,
    description: `${parsed.data.type} campaign created${parsed.data.budget ? ` with $${Number(parsed.data.budget).toLocaleString()} budget` : ""}.`,
    campaignId: data?.id,
    metadata: { type: parsed.data.type, budget: parsed.data.budget },
  });

  revalidateAll();
  return { status: "success" };
}

export async function updateCampaign(
  id: string,
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    source: formData.get("source"),
    budget: formData.get("budget"),
    notes: formData.get("notes"),
  };

  const parsed = campaignSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from("campaigns")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update campaign." };
  revalidateAll();
  return { status: "success" };
}

export async function deleteCampaign(id: string): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to delete campaign." };
  revalidateAll();
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return { status: "success" };
}

export async function assignLeadToCampaign(
  leadId: string,
  campaignId: string | null
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = assignLeadSchema.safeParse({ campaign_id: campaignId });
  if (!parsed.success) return { status: "error", error: "Invalid campaign." };

  if (campaignId) {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();
    if (!campaign) return { status: "error", error: "Campaign not found." };

    const { data: lead } = await supabase
      .from("leads")
      .select("name")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .single();

    const { error } = await supabase
      .from("leads")
      .update({ campaign_id: parsed.data.campaign_id })
      .eq("id", leadId)
      .eq("user_id", user.id);

    if (error) return { status: "error", error: "Failed to assign." };

    trackEvent({
      userId: user.id,
      type: "campaign_assigned",
      title: `${lead?.name ?? "Lead"} assigned to "${campaign.name}"`,
      leadId,
      campaignId,
    });
  } else {
    const { error } = await supabase
      .from("leads")
      .update({ campaign_id: null })
      .eq("id", leadId)
      .eq("user_id", user.id);

    if (error) return { status: "error", error: "Failed to assign." };
  }

  revalidatePath("/campaigns");
  revalidatePath("/leads");
  return { status: "success" };
}

export async function createCampaignCalendarItem(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = {
    title: formData.get("title"),
    target_segment: formData.get("target_segment"),
    offer: formData.get("offer"),
    channel: formData.get("channel"),
    planned_date: formData.get("planned_date"),
    end_date: formData.get("end_date"),
    expected_revenue: formData.get("expected_revenue"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  };

  const parsed = campaignCalendarItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from("campaign_calendar_items")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { status: "error", error: "Failed to create campaign plan." };

  trackEvent({
    userId: user.id,
    type: "campaign_calendar_created",
    title: `Campaign plan scheduled: ${parsed.data.title}`,
    description: `${parsed.data.channel} plan for ${parsed.data.target_segment} on ${parsed.data.planned_date}.`,
    metadata: {
      channel: parsed.data.channel,
      status: parsed.data.status,
      expected_revenue: parsed.data.expected_revenue,
    },
  });

  revalidateAll();
  return { status: "success" };
}

export async function updateCampaignCalendarItem(
  id: string,
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = {
    title: formData.get("title"),
    target_segment: formData.get("target_segment"),
    offer: formData.get("offer"),
    channel: formData.get("channel"),
    planned_date: formData.get("planned_date"),
    end_date: formData.get("end_date"),
    expected_revenue: formData.get("expected_revenue"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  };

  const parsed = campaignCalendarItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from("campaign_calendar_items")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update campaign plan." };

  revalidateAll();
  return { status: "success" };
}

export async function deleteCampaignCalendarItem(id: string): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { error } = await supabase
    .from("campaign_calendar_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to delete campaign plan." };

  revalidateAll();
  return { status: "success" };
}
