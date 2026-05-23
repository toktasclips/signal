import { TrendCard } from "@/components/analytics/trend-card"
import { InsightCard } from "@/components/analytics/insight-card"
import { TURKISH_MONTHS } from "@/lib/analytics/mock-data"
import { getMonthlyMetrics } from "@/lib/analytics/data"
import { calcChange, calcTrend } from "@/lib/analytics/calculations"
import { createClient } from "@/lib/supabase/server"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import type { InsightCard as InsightCardType, MonthlyMetric } from "@/lib/analytics/types"

export const metadata: Metadata = { title: "Trend Analizi" }

interface MetricDefinition {
  label: string
  key: string
  prefix: string
  suffix: string
  decimals: number
  getValue: (metric: MonthlyMetric) => number
}

const businessMetricKeys: Array<keyof MonthlyMetric> = [
  "total_goal",
  "new_deal_value",
  "cash_collected",
  "ad_spend",
  "instagram_reach",
  "instagram_impressions",
  "roas",
  "new_customers",
  "instagram_followers",
  "engagement",
  "youtube_subscribers",
  "youtube_watch_hours",
  "email_list",
  "software_expenses",
]

function valueOf(key: keyof MonthlyMetric): (metric: MonthlyMetric) => number {
  return (metric) => Number(metric[key] ?? 0)
}

function profitMargin(metric: MonthlyMetric): number {
  const revenue = Number(metric.cash_collected ?? 0)
  if (revenue === 0) return 0
  return (Number(metric.profit ?? 0) / revenue) * 100
}

const trendCards: MetricDefinition[] = [
  { label: "Toplam Gelir", key: "cash_collected", prefix: "₺", suffix: "", decimals: 0, getValue: valueOf("cash_collected") },
  { label: "Kâr", key: "profit", prefix: "₺", suffix: "", decimals: 0, getValue: valueOf("profit") },
  { label: "Kârlılık", key: "profit_margin", prefix: "", suffix: "%", decimals: 1, getValue: profitMargin },
  { label: "ROAS", key: "roas", prefix: "", suffix: "x", decimals: 2, getValue: valueOf("roas") },
  { label: "Yeni Müşteri", key: "new_customers", prefix: "", suffix: "", decimals: 0, getValue: valueOf("new_customers") },
  { label: "Watch Hours", key: "youtube_watch_hours", prefix: "", suffix: " sa", decimals: 0, getValue: valueOf("youtube_watch_hours") },
]

const momentumRows: MetricDefinition[] = [
  ...trendCards,
  { label: "Reklam Harcaması", key: "ad_spend", prefix: "₺", suffix: "", decimals: 0, getValue: valueOf("ad_spend") },
  { label: "Instagram Takipçi", key: "instagram_followers", prefix: "", suffix: "", decimals: 0, getValue: valueOf("instagram_followers") },
  { label: "E-posta Listesi", key: "email_list", prefix: "", suffix: "", decimals: 0, getValue: valueOf("email_list") },
]

function hasBusinessData(metric: MonthlyMetric): boolean {
  return businessMetricKeys.some(
    (key) => metric[key] !== null && metric[key] !== undefined
  )
}

function formatVal(val: number, prefix: string, suffix: string, decimals: number): string {
  if (prefix === "₺" && val >= 1000) return `₺${(val / 1000).toFixed(1)}K`
  if (val >= 1000 && suffix === "") return `${(val / 1000).toFixed(1)}K`
  return `${prefix}${val.toLocaleString("tr-TR", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals > 0 ? decimals : 0,
  })}${suffix}`
}

function buildTrendInsights(
  latest: MonthlyMetric,
  prev: MonthlyMetric,
  sorted: MonthlyMetric[]
): InsightCardType[] {
  const revenue = Number(latest.cash_collected ?? 0)
  const prevRevenue = Number(prev.cash_collected ?? 0)
  const adSpend = Number(latest.ad_spend ?? 0)
  const watchHours = Number(latest.youtube_watch_hours ?? 0)
  const prevWatchHours = Number(prev.youtube_watch_hours ?? 0)
  const margin = profitMargin(latest)
  const revenueChange = calcChange(revenue, prevRevenue)
  const watchChange = calcChange(watchHours, prevWatchHours)
  const latestThreeRevenue = sorted.slice(-3).map((m) => Number(m.cash_collected ?? 0))

  return [
    {
      id: "revenue-momentum",
      title:
        revenueChange >= 0
          ? "Gelir ivmesi pozitif"
          : "Gelir ivmesi yavaşlıyor",
      description:
        revenueChange >= 0
          ? `Toplam gelir geçen aya göre %${Math.abs(revenueChange).toFixed(1)} arttı. Bu ivmeyi kârlılıkla birlikte korumaya odaklanabilirsiniz.`
          : `Toplam gelir geçen aya göre %${Math.abs(revenueChange).toFixed(1)} geriledi. Satış ve kampanya kaynaklarını tekrar kontrol etmek iyi olur.`,
      type: revenueChange >= 0 ? "positive" : "warning",
    },
    {
      id: "profitability",
      title:
        margin >= 70
          ? "Kârlılık güçlü"
          : margin >= 40
          ? "Kârlılık sağlıklı fakat izlenmeli"
          : "Kârlılık baskı altında",
      description: `Seçili ayda kârlılık oranı %${margin.toFixed(1)}. Reklam ve operasyon giderleriyle birlikte takip edilmeli.`,
      type: margin >= 40 ? "positive" : "warning",
    },
    {
      id: "watchtime-revenue",
      title:
        watchChange >= 0
          ? "Watch time gelirle birlikte izlenebilir"
          : "Watch time tarafında düşüş var",
      description:
        watchChange >= 0
          ? `Watch time geçen aya göre %${Math.abs(watchChange).toFixed(1)} arttı. Bunu toplam gelir grafiğiyle birlikte takip etmek daha anlamlı.`
          : `Watch time geçen aya göre %${Math.abs(watchChange).toFixed(1)} geriledi. İçerik üretimi ve satış etkisi birlikte incelenmeli.`,
      type: watchChange >= 0 ? "positive" : "neutral",
    },
    {
      id: "ad-efficiency",
      title: "Reklam verimliliği kontrol noktası",
      description:
        adSpend > 0
          ? `Bu ay reklam harcaması ${formatVal(adSpend, "₺", "", 0)}. ROAS ve toplam gelirle birlikte gerçek katkısı izlenmeli.`
          : "Bu ay reklam harcaması kaydı yok. Eğer reklam çalıştıysa KPI Girişi üzerinden tamamlanmalı.",
      type: adSpend > 0 ? "neutral" : "warning",
    },
    {
      id: "three-month-trend",
      title:
        calcTrend(latestThreeRevenue) === "up"
          ? "Son dönem trendi yukarı"
          : calcTrend(latestThreeRevenue) === "down"
          ? "Son dönem trendi aşağı"
          : "Son dönem trendi yatay",
      description: "Son üç dolu ayın toplam gelir hareketine göre momentum özeti.",
      type: calcTrend(latestThreeRevenue) === "down" ? "warning" : "neutral",
    },
  ]
}

export default async function TrendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const allMetrics = await getMonthlyMetrics(user.id)
  const businessMetrics = allMetrics.filter(hasBusinessData)
  const metrics = businessMetrics.length ? businessMetrics : allMetrics
  const sorted = [...metrics].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  const latest = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2] ?? latest
  const getVals = (metric: MetricDefinition) => sorted.map(metric.getValue)
  const insights = buildTrendInsights(latest, prev, sorted)

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trend Analizi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Son dolu dönem: {TURKISH_MONTHS[latest.month - 1]} {latest.year}
        </p>
      </div>

      <div className="space-y-8 px-6 py-8 lg:px-10">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">KPI Trend Kartları</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trendCards.map((card) => {
              const allVals = getVals(card)
              const current = card.getValue(latest)
              const prevVal = card.getValue(prev)
              return (
                <TrendCard key={card.key} label={card.label} currentValue={current} change={calcChange(current, prevVal)} sparklineData={allVals.slice(-6)} prefix={card.prefix} suffix={card.suffix} />
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">Otomatik Analiz</h2>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">AI Destekli</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight) => (<InsightCard key={insight.id} insight={insight} />))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Momentum Analizi</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/35">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Metrik</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Bu Ay</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Geçen Ay</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Değişim</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {momentumRows.map((row, idx) => {
                    const current = row.getValue(latest)
                    const prevVal = row.getValue(prev)
                    const change = calcChange(current, prevVal)
                    const trend = calcTrend(getVals(row))
                    const isPos = change > 0
                    const isNeg = change < 0
                    const changeColor = isPos ? "text-emerald-700" : isNeg ? "text-red-700" : "text-muted-foreground"
                    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
                    const trendColor = trend === "up" ? "text-emerald-700" : trend === "down" ? "text-red-700" : "text-muted-foreground"
                    return (
                      <tr key={row.key} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"}`}>
                        <td className="px-5 py-3 font-medium text-foreground">{row.label}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">{formatVal(current, row.prefix, row.suffix, row.decimals)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{formatVal(prevVal, row.prefix, row.suffix, row.decimals)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-medium ${changeColor}`}>{change === 0 ? "–" : `${isPos ? "+" : ""}${change.toFixed(1)}%`}</td>
                        <td className="px-4 py-3 text-center"><TrendIcon size={15} className={`inline-block ${trendColor}`} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <div className="pb-8" />
      </div>
    </div>
  )
}
