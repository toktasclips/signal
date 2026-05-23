import { MonthlyMetric, ChartPoint } from "./types"
import { TURKISH_MONTH_ABBR } from "./mock-data"

export function calcChange(current: number, prev: number): number {
  if (prev === 0) return 0
  return ((current - prev) / Math.abs(prev)) * 100
}

export function calcTrend(values: number[]): "up" | "down" | "flat" {
  if (values.length < 2) return "flat"
  const last = values.slice(-3)
  const avg = last.slice(0, -1).reduce((a, b) => a + b, 0) / (last.length - 1)
  const latest = last[last.length - 1]
  const diff = latest - avg
  const threshold = Math.abs(avg) * 0.02
  if (diff > threshold) return "up"
  if (diff < -threshold) return "down"
  return "flat"
}

export function getMonthLabel(month: number): string {
  if (month < 1 || month > 12) return ""
  return TURKISH_MONTH_ABBR[month - 1]
}

export function buildChartData(
  metrics: MonthlyMetric[],
  key: keyof MonthlyMetric
): ChartPoint[] {
  const years = new Set(metrics.map((m) => m.year))
  return metrics.map((m) => ({
    month:
      years.size > 1
        ? `${getMonthLabel(m.month)} ${String(m.year).slice(-2)}`
        : getMonthLabel(m.month),
    value: Number(m[key] ?? 0),
  }))
}

export interface KpiSummaryItem {
  key: string
  label: string
  value: number
  prevValue: number
  change: number
  prefix: string
  suffix: string
  trend: "up" | "down" | "flat"
}

export function calcKpiSummary(metrics: MonthlyMetric[]): KpiSummaryItem[] {
  if (metrics.length === 0) return []

  const sorted = [...metrics].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )

  const latest = sorted[sorted.length - 1]
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null

  const getVal = (m: MonthlyMetric | null, key: keyof MonthlyMetric): number =>
    m ? Number(m[key] ?? 0) : 0

  const items: Array<{
    key: keyof MonthlyMetric
    label: string
    prefix: string
    suffix: string
  }> = [
    { key: "cash_collected", label: "Toplam Gelir", prefix: "₺", suffix: "" },
    { key: "profit", label: "Kâr", prefix: "₺", suffix: "" },
    { key: "roas", label: "ROAS", prefix: "", suffix: "x" },
    {
      key: "monthly_recurring_revenue",
      label: "MRR",
      prefix: "₺",
      suffix: "",
    },
    {
      key: "youtube_watch_hours",
      label: "Watch Time",
      prefix: "",
      suffix: " sa",
    },
    { key: "instagram_reach", label: "Reach", prefix: "", suffix: "" },
  ]

  return items.map((item) => {
    const value = getVal(latest, item.key)
    const prevValue = getVal(prev, item.key)
    const allValues = sorted.map((m) => getVal(m, item.key))
    return {
      key: item.key as string,
      label: item.label,
      value,
      prevValue,
      change: calcChange(value, prevValue),
      prefix: item.prefix,
      suffix: item.suffix,
      trend: calcTrend(allValues),
    }
  })
}

export function calcKpiSummaryForPeriod(
  metrics: MonthlyMetric[],
  selected: MonthlyMetric
): KpiSummaryItem[] {
  const sorted = [...metrics].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )
  const selectedIndex = sorted.findIndex(
    (m) => m.month === selected.month && m.year === selected.year
  )
  const prev = selectedIndex > 0 ? sorted[selectedIndex - 1] : null
  const getVal = (m: MonthlyMetric | null, key: keyof MonthlyMetric): number =>
    m ? Number(m[key] ?? 0) : 0

  const items: Array<{
    key: keyof MonthlyMetric
    label: string
    prefix: string
    suffix: string
  }> = [
    { key: "cash_collected", label: "Toplam Gelir", prefix: "₺", suffix: "" },
    { key: "profit", label: "Kâr", prefix: "₺", suffix: "" },
    { key: "roas", label: "ROAS", prefix: "", suffix: "x" },
    {
      key: "monthly_recurring_revenue",
      label: "MRR",
      prefix: "₺",
      suffix: "",
    },
    {
      key: "youtube_watch_hours",
      label: "Watch Time",
      prefix: "",
      suffix: " sa",
    },
    { key: "instagram_reach", label: "Reach", prefix: "", suffix: "" },
  ]

  return items.map((item) => {
    const value = getVal(selected, item.key)
    const prevValue = getVal(prev, item.key)
    const allValues = sorted
      .slice(0, selectedIndex + 1)
      .map((m) => getVal(m, item.key))
    return {
      key: item.key as string,
      label: item.label,
      value,
      prevValue,
      change: calcChange(value, prevValue),
      prefix: item.prefix,
      suffix: item.suffix,
      trend: calcTrend(allValues),
    }
  })
}
