"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentKpiPeriod } from "@/lib/analytics/period";
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
  "youtube_views",
  "youtube_watch_hours",
  "youtube_video_count",
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

  const period = getCurrentKpiPeriod();
  const month = period.month;
  const year = period.year;

  const { data: existing } = await supabase
    .from("monthly_metrics")
    .select("id")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (existing?.id) {
    return {
      status: "error",
      error: "Bu KPI dönemi zaten kaydedilmiş. Her 25-25 dönemi için sadece bir kayıt açılır.",
    };
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
    .insert(payload);

  if (error) return { status: "error", error: "Failed to save KPI data." };

  revalidatePath("/trend-dashboard");
  revalidatePath("/trends");
  revalidatePath("/kpi-entry");
  return { status: "success", message: "KPI data saved." };
}
