export interface MonthlyMetric {
  id: string
  month: number
  year: number
  total_goal: number | null
  new_deal_value: number | null
  monthly_recurring_revenue: number | null
  cash_collected: number | null
  ad_spend: number | null
  instagram_reach: number | null
  instagram_impressions: number | null
  cpm: number | null
  roas: number | null
  new_customers: number | null
  instagram_followers: number | null
  engagement: number | null
  profile_visits: number | null
  youtube_subscribers: number | null
  youtube_views?: number | null
  youtube_watch_hours: number | null
  youtube_video_count?: number | null
  shares: number | null
  email_list: number | null
  software_expenses: number | null
  other_expenses: number | null
  profit: number | null
  stripe_gross_revenue?: number | null
  stripe_net_revenue?: number | null
  stripe_fees?: number | null
  stripe_refunds?: number | null
  stripe_charge_count?: number | null
  stripe_synced_at?: string | null
  stripe_period_start?: string | null
  stripe_period_end?: string | null
  meta_ad_spend?: number | null
  meta_reach?: number | null
  meta_impressions?: number | null
  meta_cpm?: number | null
  meta_clicks?: number | null
  meta_ctr?: number | null
  meta_synced_at?: string | null
  meta_period_start?: string | null
  meta_period_end?: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface QuarterReview {
  id: string
  quarter: number
  year: number
  wins: string | null
  bottlenecks: string | null
  opportunities: string | null
  next_focus: string | null
  created_at: string
  updated_at: string
}

export interface TrendData {
  label: string
  value: number
  change: number
  changePercent: number
  trend: "up" | "down" | "flat"
}

export interface ChartPoint {
  month: string
  value: number
}

export interface InsightCard {
  id: string
  title: string
  description: string
  type: "positive" | "warning" | "neutral"
}
