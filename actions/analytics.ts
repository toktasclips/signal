"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types";

const numericFields = [
  "total_goal",
  "new_deal_value",
  "monthly_recurring_revenue",
  "cash_collected",
  "profit",
  "ad_spend",
  "cpm",
  "roas",
  "instagram_reach",
  "instagram_impressions",
  "new_customers",
  "instagram_followers",
  "engagement",
  "profile_visits",
  "youtube_subscribers",
  "youtube_watch_hours",
  "shares",
  "email_list",
  "software_expenses",
  "other_expenses",
] as const;

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function textOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function saveMonthlyMetric(formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return { status: "error", error: "Invalid period." };
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    month,
    year,
    notes: textOrNull(formData.get("notes")),
  };

  for (const field of numericFields) {
    payload[field] = numberOrNull(formData.get(field));
  }

  const { error } = await supabase
    .from("monthly_metrics")
    .upsert(payload, { onConflict: "user_id,month,year" });

  if (error) return { status: "error", error: "Failed to save KPI data." };

  revalidatePath("/trend-dashboard");
  revalidatePath("/trends");
  revalidatePath("/kpi-entry");
  return { status: "success", message: "KPI data saved." };
}
