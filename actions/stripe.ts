"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isStripeSyncOwner } from "@/lib/integrations/access";
import { syncStripeCurrentPeriod } from "@/lib/stripe/sync";
import type { ActionState } from "@/types";

interface StripeSyncResult {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  refunds: number;
  chargeCount: number;
}

export async function syncCurrentStripePeriod(
  _previousState: ActionState<StripeSyncResult>
): Promise<ActionState<StripeSyncResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };
  if (!isStripeSyncOwner(user.email)) {
    return {
      status: "error",
      error: "Stripe sync is only available for the configured owner account.",
    };
  }

  try {
    const summary = await syncStripeCurrentPeriod(user.id);
    revalidatePath("/settings");
    revalidatePath("/source-data");
    revalidatePath("/kpi-entry");

    return {
      status: "success",
      message: "Stripe data synced.",
      data: {
        period: `${summary.periodStart} - ${summary.periodEnd}`,
        grossRevenue: summary.grossRevenue,
        netRevenue: summary.netRevenue,
        fees: summary.fees,
        refunds: summary.refunds,
        chargeCount: summary.chargeCount,
      },
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Stripe sync failed.",
    };
  }
}
