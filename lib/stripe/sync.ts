import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const STRIPE_SYNC_START = "2026-04-25";

interface StripeBalanceTransaction {
  id: string;
  amount: number;
  fee: number;
  net: number;
  type: string;
  reporting_category?: string;
  created: number;
}

interface StripeListResponse {
  data: StripeBalanceTransaction[];
  has_more: boolean;
}

export interface StripePeriodSummary {
  periodStart: string;
  periodEnd: string;
  month: number;
  year: number;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  refunds: number;
  chargeCount: number;
}

function toUnix(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00.000Z`).getTime() / 1000);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getCurrentStripePeriod(now = new Date()): {
  periodStart: string;
  periodEnd: string;
  month: number;
  year: number;
} {
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = base.getUTCDate();
  const periodEnd =
    day >= 25
      ? new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 25))
      : new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 25));
  const periodStart = addMonths(periodEnd, -1);

  return {
    periodStart: ymd(periodStart),
    periodEnd: ymd(periodEnd),
    month: periodEnd.getUTCMonth() + 1,
    year: periodEnd.getUTCFullYear(),
  };
}

function isBeforeSyncStart(periodStart: string): boolean {
  return periodStart < STRIPE_SYNC_START;
}

function amountToMajor(amount: number): number {
  return amount / 100;
}

async function listStripeBalanceTransactions(
  secretKey: string,
  periodStart: string,
  periodEnd: string
): Promise<StripeBalanceTransaction[]> {
  const transactions: StripeBalanceTransaction[] = [];
  let startingAfter: string | null = null;

  do {
    const params = new URLSearchParams({
      limit: "100",
      "created[gte]": String(toUnix(periodStart)),
      "created[lt]": String(toUnix(periodEnd)),
    });
    if (startingAfter) params.set("starting_after", startingAfter);

    const response = await fetch(
      `https://api.stripe.com/v1/balance_transactions?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Stripe request failed: ${message}`);
    }

    const payload = (await response.json()) as StripeListResponse;
    transactions.push(...payload.data);
    startingAfter = payload.has_more
      ? payload.data[payload.data.length - 1]?.id ?? null
      : null;
  } while (startingAfter);

  return transactions;
}

function summarizeTransactions(
  transactions: StripeBalanceTransaction[],
  period: ReturnType<typeof getCurrentStripePeriod>
): StripePeriodSummary {
  let grossRevenue = 0;
  let netRevenue = 0;
  let fees = 0;
  let refunds = 0;
  let chargeCount = 0;

  for (const tx of transactions) {
    if (tx.reporting_category === "charge" || tx.type === "charge") {
      grossRevenue += amountToMajor(tx.amount);
      netRevenue += amountToMajor(tx.net);
      fees += amountToMajor(tx.fee);
      chargeCount += 1;
    } else if (tx.reporting_category === "refund" || tx.type === "refund") {
      refunds += Math.abs(amountToMajor(tx.amount));
      netRevenue += amountToMajor(tx.net);
    }
  }

  return {
    ...period,
    grossRevenue,
    netRevenue,
    fees,
    refunds,
    chargeCount,
  };
}

export async function syncStripeCurrentPeriod(
  userId: string,
  supabaseOverride?: SupabaseClient
): Promise<StripePeriodSummary> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const period = getCurrentStripePeriod();
  if (isBeforeSyncStart(period.periodStart)) {
    throw new Error("Stripe sync is configured to start from 2026-04-25.");
  }

  const transactions = await listStripeBalanceTransactions(
    secretKey,
    period.periodStart,
    period.periodEnd
  );
  const summary = summarizeTransactions(transactions, period);

  const supabase = supabaseOverride ?? (await createClient());
  const basePayload = {
    user_id: userId,
    month: summary.month,
    year: summary.year,
    stripe_gross_revenue: summary.grossRevenue,
    stripe_net_revenue: summary.netRevenue,
    stripe_fees: summary.fees,
    stripe_refunds: summary.refunds,
    stripe_charge_count: summary.chargeCount,
    stripe_period_start: summary.periodStart,
    stripe_period_end: summary.periodEnd,
    stripe_synced_at: new Date().toISOString(),
  };

  const { data: existingMetric, error: lookupError } = await supabase
    .from("monthly_metrics")
    .select("id")
    .eq("user_id", userId)
    .eq("month", summary.month)
    .eq("year", summary.year)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  const { error } = existingMetric?.id
    ? await supabase
        .from("monthly_metrics")
        .update(basePayload)
        .eq("id", existingMetric.id)
        .eq("user_id", userId)
    : await supabase.from("monthly_metrics").insert({
        ...basePayload,
        cash_collected: summary.grossRevenue,
        profit: summary.netRevenue,
      });

  if (error) throw new Error(error.message);

  const { error: runError } = await supabase.from("stripe_sync_runs").insert({
    user_id: userId,
    period_start: summary.periodStart,
    period_end: summary.periodEnd,
    gross_revenue: summary.grossRevenue,
    net_revenue: summary.netRevenue,
    fees: summary.fees,
    refunds: summary.refunds,
    charge_count: summary.chargeCount,
  });
  if (runError) throw new Error(runError.message);

  return summary;
}
