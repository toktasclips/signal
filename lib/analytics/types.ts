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
  youtube_watch_hours: number | null
  shares: number | null
  email_list: number | null
  software_expenses: number | null
  other_expenses: number | null
  profit: number | null
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
