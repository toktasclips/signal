import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const META_SYNC_START = "2026-05-25";
const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION ?? "v20.0";

interface MetaInsightsRow {
  spend?: string;
  reach?: string;
  impressions?: string;
  cpm?: string;
  clicks?: string;
  ctr?: string;
}

interface MetaInsightsResponse {
  data?: MetaInsightsRow[];
  error?: {
    message?: string;
  };
}

export interface MetaAdsSummary {
  periodStart: string;
  periodEnd: string;
  month: number;
  year: number;
  currency: string;
  spend: number;
  reach: number;
  impressions: number;
  cpm: number;
  clicks: number;
  ctr: number;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getCurrentMetaPeriod(now = new Date()): {
  periodStart: string;
  periodEnd: string;
  month: number;
  year: number;
} {
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const periodEnd =
    base.getUTCDate() >= 25
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
  return periodStart < META_SYNC_START;
}

function numberFromMeta(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function adAccountPath(adAccountId: string): string {
  return adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
}

async function fetchMetaInsights(
  accessToken: string,
  adAccountId: string,
  periodStart: string,
  periodEnd: string
): Promise<MetaInsightsRow[]> {
  const until = ymd(addDays(new Date(`${periodEnd}T00:00:00.000Z`), -1));
  const params = new URLSearchParams({
    access_token: accessToken,
    level: "account",
    fields: "spend,reach,impressions,cpm,clicks,ctr",
    time_range: JSON.stringify({ since: periodStart, until }),
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${adAccountPath(adAccountId)}/insights?${params.toString()}`
  );
  const payload = (await response.json()) as MetaInsightsResponse;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "Meta Ads request failed.");
  }

  return payload.data ?? [];
}

function summarizeInsights(
  rows: MetaInsightsRow[],
  period: ReturnType<typeof getCurrentMetaPeriod>
): MetaAdsSummary {
  return rows.reduce<MetaAdsSummary>(
    (summary, row) => ({
      ...summary,
      spend: summary.spend + numberFromMeta(row.spend),
      reach: summary.reach + numberFromMeta(row.reach),
      impressions: summary.impressions + numberFromMeta(row.impressions),
      cpm: summary.cpm + numberFromMeta(row.cpm),
      clicks: summary.clicks + numberFromMeta(row.clicks),
      ctr: summary.ctr + numberFromMeta(row.ctr),
    }),
    {
      ...period,
      currency: process.env.META_AD_CURRENCY ?? "TRY",
      spend: 0,
      reach: 0,
      impressions: 0,
      cpm: 0,
      clicks: 0,
      ctr: 0,
    }
  );
}

export async function syncMetaAdsCurrentPeriod(
  userId: string,
  supabaseOverride?: SupabaseClient
): Promise<MetaAdsSummary> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken) throw new Error("META_ACCESS_TOKEN is not configured.");
  if (!adAccountId) throw new Error("META_AD_ACCOUNT_ID is not configured.");

  const period = getCurrentMetaPeriod();
  if (isBeforeSyncStart(period.periodStart)) {
    throw new Error("Meta Ads sync Mayıs sonrası başlar. İlk dönem 2026-05-25 - 2026-06-25.");
  }

  const rows = await fetchMetaInsights(
    accessToken,
    adAccountId,
    period.periodStart,
    period.periodEnd
  );
  const summary = summarizeInsights(rows, period);
  const supabase = supabaseOverride ?? (await createClient());

  const { data: existingMetric, error: lookupError } = await supabase
    .from("monthly_metrics")
    .select("id, ad_spend, instagram_reach, instagram_impressions, cpm")
    .eq("user_id", userId)
    .eq("month", summary.month)
    .eq("year", summary.year)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  const metaPayload = {
    user_id: userId,
    month: summary.month,
    year: summary.year,
    meta_ad_spend: summary.spend,
    meta_reach: summary.reach,
    meta_impressions: summary.impressions,
    meta_cpm: summary.cpm,
    meta_clicks: summary.clicks,
    meta_ctr: summary.ctr,
    meta_period_start: summary.periodStart,
    meta_period_end: summary.periodEnd,
    meta_synced_at: new Date().toISOString(),
  };

  const { error } = existingMetric?.id
    ? await supabase
        .from("monthly_metrics")
        .update({
          ...metaPayload,
          ...(existingMetric.ad_spend === null ? { ad_spend: summary.spend } : {}),
          ...(existingMetric.instagram_reach === null ? { instagram_reach: summary.reach } : {}),
          ...(existingMetric.instagram_impressions === null
            ? { instagram_impressions: summary.impressions }
            : {}),
          ...(existingMetric.cpm === null ? { cpm: summary.cpm } : {}),
        })
        .eq("id", existingMetric.id)
        .eq("user_id", userId)
    : await supabase.from("monthly_metrics").insert({
        ...metaPayload,
        ad_spend: summary.spend,
        instagram_reach: summary.reach,
        instagram_impressions: summary.impressions,
        cpm: summary.cpm,
      });

  if (error) throw new Error(error.message);

  const { error: runError } = await supabase.from("meta_ads_sync_runs").insert({
    user_id: userId,
    period_start: summary.periodStart,
    period_end: summary.periodEnd,
    spend: summary.spend,
    reach: summary.reach,
    impressions: summary.impressions,
    cpm: summary.cpm,
    clicks: summary.clicks,
    ctr: summary.ctr,
  });
  if (runError) throw new Error(runError.message);

  return summary;
}
