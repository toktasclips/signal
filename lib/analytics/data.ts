import { createClient } from "@/lib/supabase/server";
import { mockMetrics, mockQuarterReviews } from "./mock-data";
import type { MonthlyMetric, QuarterReview } from "./types";

type MetricRow = MonthlyMetric & { user_id?: string };
type QuarterRow = QuarterReview & { user_id?: string };

function normalizeMetric(row: MetricRow): MonthlyMetric {
  return {
    id: row.id,
    month: Number(row.month),
    year: Number(row.year),
    total_goal: toNullableNumber(row.total_goal),
    new_deal_value: toNullableNumber(row.new_deal_value),
    monthly_recurring_revenue: toNullableNumber(row.monthly_recurring_revenue),
    cash_collected: toNullableNumber(row.cash_collected),
    ad_spend: toNullableNumber(row.ad_spend),
    instagram_reach: toNullableNumber(row.instagram_reach),
    instagram_impressions: toNullableNumber(row.instagram_impressions),
    cpm: toNullableNumber(row.cpm),
    roas: toNullableNumber(row.roas),
    new_customers: toNullableNumber(row.new_customers),
    instagram_followers: toNullableNumber(row.instagram_followers),
    engagement: toNullableNumber(row.engagement),
    profile_visits: toNullableNumber(row.profile_visits),
    youtube_subscribers: toNullableNumber(row.youtube_subscribers),
    youtube_views: toNullableNumber(row.youtube_views),
    youtube_watch_hours: toNullableNumber(row.youtube_watch_hours),
    youtube_video_count: toNullableNumber(row.youtube_video_count),
    shares: toNullableNumber(row.shares),
    email_list: toNullableNumber(row.email_list),
    software_expenses: toNullableNumber(row.software_expenses),
    other_expenses: toNullableNumber(row.other_expenses),
    profit: toNullableNumber(row.profit),
    stripe_gross_revenue: toNullableNumber(row.stripe_gross_revenue),
    stripe_net_revenue: toNullableNumber(row.stripe_net_revenue),
    stripe_fees: toNullableNumber(row.stripe_fees),
    stripe_refunds: toNullableNumber(row.stripe_refunds),
    stripe_charge_count: toNullableNumber(row.stripe_charge_count),
    stripe_synced_at: row.stripe_synced_at ?? null,
    stripe_period_start: row.stripe_period_start ?? null,
    stripe_period_end: row.stripe_period_end ?? null,
    meta_ad_spend: toNullableNumber(row.meta_ad_spend),
    meta_reach: toNullableNumber(row.meta_reach),
    meta_impressions: toNullableNumber(row.meta_impressions),
    meta_cpm: toNullableNumber(row.meta_cpm),
    meta_clicks: toNullableNumber(row.meta_clicks),
    meta_ctr: toNullableNumber(row.meta_ctr),
    meta_synced_at: row.meta_synced_at ?? null,
    meta_period_start: row.meta_period_start ?? null,
    meta_period_end: row.meta_period_end ?? null,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeQuarter(row: QuarterRow): QuarterReview {
  return {
    id: row.id,
    quarter: Number(row.quarter),
    year: Number(row.year),
    wins: row.wins,
    bottlenecks: row.bottlenecks,
    opportunities: row.opportunities,
    next_focus: row.next_focus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getMonthlyMetrics(userId: string): Promise<MonthlyMetric[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  if (error || !data?.length) return mockMetrics;
  return (data as MetricRow[]).map(normalizeMetric);
}

export async function getQuarterReviews(userId: string): Promise<QuarterReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quarter_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("year", { ascending: true })
    .order("quarter", { ascending: true });

  if (error || !data?.length) return mockQuarterReviews;
  return (data as QuarterRow[]).map(normalizeQuarter);
}
