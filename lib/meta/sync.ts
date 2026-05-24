import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION ?? "v20.0";

interface MetaInsightsRow {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  reach?: string;
  impressions?: string;
  cpm?: string;
  clicks?: string;
  ctr?: string;
}

interface MetaInsightsResponse {
  data?: MetaInsightsRow[];
  paging?: {
    next?: string;
  };
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
  campaigns: MetaCampaignSummary[];
}

export interface MetaCampaignSummary {
  campaignId: string;
  campaignName: string;
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

async function fetchMetaCampaignInsights(
  accessToken: string,
  adAccountId: string,
  periodStart: string,
  periodEnd: string
): Promise<MetaInsightsRow[]> {
  const until = ymd(addDays(new Date(`${periodEnd}T00:00:00.000Z`), -1));
  const params = new URLSearchParams({
    access_token: accessToken,
    level: "campaign",
    fields: "campaign_id,campaign_name,spend,reach,impressions,cpm,clicks,ctr",
    time_range: JSON.stringify({ since: periodStart, until }),
    limit: "500",
  });

  const rows: MetaInsightsRow[] = [];
  let nextUrl: string | null =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${adAccountPath(adAccountId)}/insights?${params.toString()}`;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    const payload = (await response.json()) as MetaInsightsResponse;

    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? "Meta campaign request failed.");
    }

    rows.push(...(payload.data ?? []));
    nextUrl = payload.paging?.next ?? null;
  }

  return rows;
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
      campaigns: [],
    }
  );
}

function summarizeCampaigns(rows: MetaInsightsRow[]): MetaCampaignSummary[] {
  return rows.map((row) => ({
    campaignId: row.campaign_id ?? "unknown",
    campaignName: row.campaign_name ?? "Unknown campaign",
    spend: numberFromMeta(row.spend),
    reach: numberFromMeta(row.reach),
    impressions: numberFromMeta(row.impressions),
    cpm: numberFromMeta(row.cpm),
    clicks: numberFromMeta(row.clicks),
    ctr: numberFromMeta(row.ctr),
  }));
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
  const [rows, campaignRows] = await Promise.all([
    fetchMetaInsights(accessToken, adAccountId, period.periodStart, period.periodEnd),
    fetchMetaCampaignInsights(accessToken, adAccountId, period.periodStart, period.periodEnd),
  ]);
  const summary = summarizeInsights(rows, period);
  summary.campaigns = summarizeCampaigns(campaignRows);
  const supabase = supabaseOverride ?? (await createClient());

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

  const { error: deleteError } = await supabase
    .from("meta_ads_campaign_insights")
    .delete()
    .eq("user_id", userId)
    .eq("period_start", summary.periodStart)
    .eq("period_end", summary.periodEnd);
  if (deleteError) throw new Error(deleteError.message);

  if (summary.campaigns.length > 0) {
    const { error: campaignError } = await supabase
      .from("meta_ads_campaign_insights")
      .insert(
        summary.campaigns.map((campaign) => ({
          user_id: userId,
          period_start: summary.periodStart,
          period_end: summary.periodEnd,
          campaign_id: campaign.campaignId,
          campaign_name: campaign.campaignName,
          spend: campaign.spend,
          reach: campaign.reach,
          impressions: campaign.impressions,
          cpm: campaign.cpm,
          clicks: campaign.clicks,
          ctr: campaign.ctr,
        }))
      );
    if (campaignError) throw new Error(campaignError.message);
  }

  return summary;
}
