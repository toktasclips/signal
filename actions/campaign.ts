"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  assignLeadSchema,
  campaignCalendarItemSchema,
  campaignLaunchPlanSchema,
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
  revalidatePath("/launch-plans");
  revalidatePath("/story-sales");
  revalidatePath("/leads");
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

  if (error) {
    return {
      status: "error",
      error: `Failed to create campaign plan: ${error.message}`,
    };
  }

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

  if (error) {
    return {
      status: "error",
      error: `Failed to update campaign plan: ${error.message}`,
    };
  }

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

export async function deleteStorySalesItems(formData: FormData): Promise<void> {
  const { supabase, user } = await getAuthUser();
  if (!user) return;

  const ids = formData
    .getAll("item_id")
    .map((id) => String(id))
    .filter(Boolean);

  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("campaign_calendar_items")
    .delete()
    .eq("user_id", user.id)
    .eq("channel", "Story Sales")
    .in("id", ids);

  if (error) return;

  revalidateAll();
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function createCampaignLaunchPlan(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", error: "Launch cards could not be read." };
  }

  const raw = {
    launch_name: formData.get("launch_name"),
    duration: formData.get("duration"),
    start_date: formData.get("start_date"),
    target_segment: formData.get("target_segment"),
    channel: formData.get("channel"),
    items,
  };

  const parsed = campaignLaunchPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const launchItems = parsed.data.items.slice(0, parsed.data.duration);
  if (launchItems.length !== parsed.data.duration) {
    return {
      status: "error",
      error: `Launch plan must include ${parsed.data.duration} cards.`,
    };
  }

  const { error } = await supabase.from("campaign_calendar_items").insert(
    launchItems.map((item) => {
      const plannedDate = addDays(parsed.data.start_date, item.day - 1);

      return {
        user_id: user.id,
        title: `${parsed.data.launch_name} · Gün ${item.day}: ${item.title}`,
        target_segment: parsed.data.target_segment,
        offer: item.offer,
        channel: parsed.data.channel,
        planned_date: plannedDate,
        end_date: plannedDate,
        expected_revenue: item.expected_revenue,
        status: "planned",
        notes: [
          `Lansman: ${parsed.data.launch_name}`,
          `Gün ${item.day}/${parsed.data.duration}`,
          item.notes,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    })
  );

  if (error) {
    return {
      status: "error",
      error: `Failed to create launch plan: ${error.message}`,
    };
  }

  trackEvent({
    userId: user.id,
    type: "campaign_calendar_created",
    title: `Launch plan created: ${parsed.data.launch_name}`,
    description: `${parsed.data.duration} günlük ${parsed.data.channel} planı ${parsed.data.start_date} tarihinde başlıyor.`,
    metadata: {
      channel: parsed.data.channel,
      duration: parsed.data.duration,
      target_segment: parsed.data.target_segment,
    },
  });

  revalidateAll();
  return { status: "success" };
}

export async function createStorySalesPlan(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  let items: unknown = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { status: "error", error: "Story cards could not be read." };
  }

  const raw = {
    launch_name: formData.get("story_name"),
    duration: formData.get("duration"),
    start_date: formData.get("start_date"),
    target_segment: formData.get("target_segment"),
    channel: "Story Sales",
    items,
  };

  const parsed = campaignLaunchPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const storyItems = parsed.data.items.slice(0, parsed.data.duration);
  if (storyItems.length !== parsed.data.duration) {
    return {
      status: "error",
      error: `Story akışı ${parsed.data.duration} kart içermeli.`,
    };
  }

  const { error } = await supabase.from("campaign_calendar_items").insert(
    storyItems.map((item) => {
      const plannedDate = addDays(parsed.data.start_date, item.day - 1);

      return {
        user_id: user.id,
        title: `${parsed.data.launch_name} · Story ${item.day}: ${item.title}`,
        target_segment: parsed.data.target_segment,
        offer: item.offer,
        channel: "Story Sales",
        planned_date: plannedDate,
        end_date: plannedDate,
        expected_revenue: item.expected_revenue,
        status: "planned",
        notes: [
          `Hikayeden Satış: ${parsed.data.launch_name}`,
          `Story ${item.day}/${parsed.data.duration}`,
          item.notes,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    })
  );

  if (error) {
    return {
      status: "error",
      error: `Hikayeden satış akışı oluşturulamadı: ${error.message}`,
    };
  }

  trackEvent({
    userId: user.id,
    type: "campaign_calendar_created",
    title: `Story sales plan created: ${parsed.data.launch_name}`,
    description: `${parsed.data.duration} story kartı ${parsed.data.start_date} tarihinde başlıyor.`,
    metadata: {
      channel: "Story Sales",
      duration: parsed.data.duration,
      target_segment: parsed.data.target_segment,
    },
  });

  revalidateAll();
  return { status: "success" };
}

export async function updateLaunchPlanItemContent(
  id: string,
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const titleInput = String(formData.get("title") ?? "").trim();
  const titlePrefix = String(formData.get("title_prefix") ?? "").trim();
  const offer = String(formData.get("offer") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const systemNotes = String(formData.get("system_notes") ?? "").trim();

  if (!titleInput) {
    return { status: "error", error: "Başlık boş kalamaz." };
  }

  if (!offer) {
    return { status: "error", error: "İçerik metni boş kalamaz." };
  }

  const { error } = await supabase
    .from("campaign_calendar_items")
    .update({
      title: titlePrefix ? `${titlePrefix}: ${titleInput}` : titleInput,
      offer,
      notes: [systemNotes, notes].filter(Boolean).join("\n") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("channel", "Platform Launch");

  if (error) {
    return {
      status: "error",
      error: `Lansman içeriği kaydedilemedi: ${error.message}`,
    };
  }

  revalidatePath("/launch-plans");
  revalidatePath(`/launch-plans/${id}`);
  return { status: "success" };
}

export async function updateStorySalesItemContent(
  id: string,
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const titleInput = String(formData.get("title") ?? "").trim();
  const titlePrefix = String(formData.get("title_prefix") ?? "").trim();
  const offer = String(formData.get("offer") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const systemNotes = String(formData.get("system_notes") ?? "").trim();

  if (!titleInput) {
    return { status: "error", error: "Başlık boş kalamaz." };
  }

  if (!offer) {
    return { status: "error", error: "Story metni boş kalamaz." };
  }

  const { error } = await supabase
    .from("campaign_calendar_items")
    .update({
      title: titlePrefix ? `${titlePrefix}: ${titleInput}` : titleInput,
      offer,
      notes: [systemNotes, notes].filter(Boolean).join("\n") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("channel", "Story Sales");

  if (error) {
    return {
      status: "error",
      error: `Story içeriği kaydedilemedi: ${error.message}`,
    };
  }

  revalidatePath("/story-sales");
  revalidatePath(`/story-sales/${id}`);
  return { status: "success" };
}
