"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncMetaAdsCurrentPeriod } from "@/lib/meta/sync";
import type { ActionState } from "@/types";

interface MetaAdsSyncResult {
  period: string;
  spend: number;
  reach: number;
  impressions: number;
  cpm: number;
  clicks: number;
  ctr: number;
  currency: string;
}

export async function syncCurrentMetaAdsPeriod(
  _previousState: ActionState<MetaAdsSyncResult>
): Promise<ActionState<MetaAdsSyncResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  try {
    const summary = await syncMetaAdsCurrentPeriod(user.id);
    revalidatePath("/settings");
    revalidatePath("/trend-dashboard");
    revalidatePath("/trends");
    revalidatePath("/quarter-review");
    revalidatePath("/kpi-entry");

    return {
      status: "success",
      message: "Meta Ads data synced.",
      data: {
        period: `${summary.periodStart} - ${summary.periodEnd}`,
        spend: summary.spend,
        reach: summary.reach,
        impressions: summary.impressions,
        cpm: summary.cpm,
        clicks: summary.clicks,
        ctr: summary.ctr,
        currency: summary.currency,
      },
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Meta Ads sync failed.",
    };
  }
}
