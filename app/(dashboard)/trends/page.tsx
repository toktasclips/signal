import Link from "next/link"
import { redirect } from "next/navigation"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { TrendCard } from "@/components/analytics/trend-card"
import { InsightCard } from "@/components/analytics/insight-card"
import { TURKISH_MONTHS } from "@/lib/analytics/mock-data"
import { getMonthlyMetrics } from "@/lib/analytics/data"
import { calcChange, calcTrend } from "@/lib/analytics/calculations"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import type { InsightCard as InsightCardType, MonthlyMetric } from "@/lib/analytics/types"

export const metadata: Metadata = { title: "Trend Analizi" }

type RangeKey = "1" | "3" | "6" | "all"

interface TrendsPageProps {
  searchParams?: Promise<{
    period?: string
    range?: string
  }>
}

interface MetricDefinition {
  label: string
  key: string
  prefix: string
  suffix: string
  decimals: number
  getValue: (metric: MonthlyMetric) => number
  higherIsBetter?: boolean
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
  "youtube_views",
  "youtube_watch_hours",
  "youtube_video_count",
  "email_list",
  "software_expenses",
  "profit",
]

const rangeOptions: Array<{ key: RangeKey; label: string; description: string }> = [
  { key: "1", label: "Bu Ay", description: "Seçili ay vs önceki ay" },
  { key: "3", label: "Son 3 Ay", description: "Kısa dönem momentum" },
  { key: "6", label: "Son 6 Ay", description: "Orta dönem trend" },
  { key: "all", label: "Tüm Dönem", description: "Eylül 2025'ten beri" },
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
  { label: "YouTube İzlenme", key: "youtube_views", prefix: "", suffix: "", decimals: 0, getValue: valueOf("youtube_views") },
]

const momentumRows: MetricDefinition[] = [
  ...trendCards,
  { label: "Reklam Harcaması", key: "ad_spend", prefix: "₺", suffix: "", decimals: 0, getValue: valueOf("ad_spend"), higherIsBetter: false },
  { label: "Instagram Reach", key: "instagram_reach", prefix: "", suffix: "", decimals: 0, getValue: valueOf("instagram_reach") },
  { label: "Instagram Takipçi", key: "instagram_followers", prefix: "", suffix: "", decimals: 0, getValue: valueOf("instagram_followers") },
  { label: "E-posta Listesi", key: "email_list", prefix: "", suffix: "", decimals: 0, getValue: valueOf("email_list") },
]

function hasBusinessData(metric: MonthlyMetric): boolean {
  return businessMetricKeys.some(
    (key) => metric[key] !== null && metric[key] !== undefined
  )
}

function periodKey(metric: MonthlyMetric): string {
  return `${metric.year}-${String(metric.month).padStart(2, "0")}`
}

function periodLabel(metric: MonthlyMetric): string {
  return `${TURKISH_MONTHS[metric.month - 1]} ${metric.year}`
}

function formatVal(val: number, prefix: string, suffix: string, decimals: number): string {
  if (prefix === "₺" && Math.abs(val) >= 1000) return `₺${(val / 1000).toFixed(1)}K`
  if (Math.abs(val) >= 1000 && suffix === "") return `${(val / 1000).toFixed(1)}K`
  return `${prefix}${val.toLocaleString("tr-TR", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals > 0 ? decimals : 0,
  })}${suffix}`
}

function rangeWindow(
  sorted: MonthlyMetric[],
  selectedIndex: number,
  range: RangeKey
): MonthlyMetric[] {
  if (range === "all") return sorted.slice(0, selectedIndex + 1)
  const count = Number(range)
  return sorted.slice(Math.max(0, selectedIndex - count + 1), selectedIndex + 1)
}

function sumFor(metrics: MonthlyMetric[], key: keyof MonthlyMetric): number {
  return metrics.reduce((sum, metric) => sum + Number(metric[key] ?? 0), 0)
}

function averageFor(metrics: MonthlyMetric[], getValue: (metric: MonthlyMetric) => number): number {
  if (metrics.length === 0) return 0
  return metrics.reduce((sum, metric) => sum + getValue(metric), 0) / metrics.length
}

function buildHref(period: string, range: RangeKey): string {
  return `/trends?period=${period}&range=${range}`
}

function buildTrendInsights(
  selected: MonthlyMetric,
  prev: MonthlyMetric,
  windowMetrics: MonthlyMetric[],
  previousWindow: MonthlyMetric[],
  range: RangeKey
): InsightCardType[] {
  const revenue = Number(selected.cash_collected ?? 0)
  const prevRevenue = Number(prev.cash_collected ?? 0)
  const revenueChange = calcChange(revenue, prevRevenue)
  const rangeRevenue = sumFor(windowMetrics, "cash_collected")
  const previousRangeRevenue = sumFor(previousWindow, "cash_collected")
  const rangeRevenueChange = calcChange(rangeRevenue, previousRangeRevenue)
  const profit = sumFor(windowMetrics, "profit")
  const margin = rangeRevenue === 0 ? 0 : (profit / rangeRevenue) * 100
  const adSpend = sumFor(windowMetrics, "ad_spend")
  const roasAverage = averageFor(windowMetrics, valueOf("roas"))
  const watchHours = sumFor(windowMetrics, "youtube_watch_hours")
  const youtubeViews = sumFor(windowMetrics, "youtube_views")
  const rangeLabel = range === "1" ? "seçili ay" : range === "all" ? "tüm dönem" : `son ${range} ay`

  return [
    {
      id: "selected-month",
      title: revenueChange >= 0 ? "Bu ay ivme yukarı" : "Bu ay geçen aya göre zayıf",
      description:
        revenueChange >= 0
          ? `${periodLabel(selected)} geliri geçen aya göre %${Math.abs(revenueChange).toFixed(1)} arttı. Bu artışı kâr ve ROAS ile birlikte okumak gerekir.`
          : `${periodLabel(selected)} geliri geçen aya göre %${Math.abs(revenueChange).toFixed(1)} geriledi. Teklif, kampanya ve satış aksiyonları kontrol edilmeli.`,
      type: revenueChange >= 0 ? "positive" : "warning",
    },
    {
      id: "range-revenue",
      title:
        rangeRevenueChange >= 0
          ? `${rangeLabel} geliri güçleniyor`
          : `${rangeLabel} gelirinde düşüş var`,
      description:
        previousWindow.length > 0
          ? `${rangeLabel} toplam geliri ${formatVal(rangeRevenue, "₺", "", 0)}. Bir önceki eş dönemle fark %${Math.abs(rangeRevenueChange).toFixed(1)}.`
          : `${rangeLabel} toplam geliri ${formatVal(rangeRevenue, "₺", "", 0)}. Karşılaştırma için daha eski eş dönem yok.`,
      type: rangeRevenueChange >= 0 ? "positive" : "warning",
    },
    {
      id: "profitability",
      title:
        margin >= 70
          ? "Kârlılık güçlü"
          : margin >= 40
          ? "Kârlılık sağlıklı fakat izlenmeli"
          : "Kârlılık baskı altında",
      description: `${rangeLabel} kârlılık oranı %${margin.toFixed(1)}. Toplam kâr ${formatVal(profit, "₺", "", 0)} seviyesinde.`,
      type: margin >= 40 ? "positive" : "warning",
    },
    {
      id: "ad-efficiency",
      title: "Reklam verimliliği kontrol noktası",
      description:
        adSpend > 0
          ? `${rangeLabel} reklam harcaması ${formatVal(adSpend, "₺", "", 0)}, ortalama ROAS ${roasAverage.toFixed(2)}x. Gelir katkısı dönem bazında izlenmeli.`
          : `${rangeLabel} içinde reklam harcaması kaydı yok. Eğer harcama olduysa KPI Girişi tarafında tamamlanmalı.`,
      type: adSpend > 0 ? "neutral" : "warning",
    },
    {
      id: "watchtime",
      title: watchHours > 0 || youtubeViews > 0 ? "İçerik motoru takip edilebilir" : "YouTube verisi eksik",
      description:
        watchHours > 0 || youtubeViews > 0
          ? `${rangeLabel} toplam izlenme ${formatVal(youtubeViews, "", "", 0)}, watch time ${formatVal(watchHours, "", " sa", 0)}. İkisini gelirle birlikte okumak daha doğru.`
          : `${rangeLabel} için YouTube izlenme kaydı yok. İçerik etkisini analiz etmek için bu alanları doldurmak gerekir.`,
      type: watchHours > 0 || youtubeViews > 0 ? "positive" : "neutral",
    },
  ]
}

export default async function TrendsPage({ searchParams }: TrendsPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const allMetrics = await getMonthlyMetrics(user.id)
  const businessMetrics = allMetrics.filter(hasBusinessData)
  const sorted = [...businessMetrics].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )

  if (sorted.length === 0) {
    return (
      <div className="min-h-full bg-background">
        <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trend Analizi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Henüz analiz edilecek KPI kaydı yok.</p>
        </div>
      </div>
    )
  }

  const requestedPeriod = params?.period
  const selectedIndexFromParam = requestedPeriod
    ? sorted.findIndex((metric) => periodKey(metric) === requestedPeriod)
    : -1
  const selectedIndex =
    selectedIndexFromParam >= 0 ? selectedIndexFromParam : sorted.length - 1
  const selected = sorted[selectedIndex]
  const prev = selectedIndex > 0 ? sorted[selectedIndex - 1] : selected
  const range: RangeKey = ["1", "3", "6", "all"].includes(params?.range ?? "")
    ? (params?.range as RangeKey)
    : "3"
  const currentWindow = rangeWindow(sorted, selectedIndex, range)
  const previousWindow =
    range === "all"
      ? []
      : sorted.slice(
          Math.max(0, selectedIndex - Number(range) * 2 + 1),
          Math.max(0, selectedIndex - Number(range) + 1)
        )
  const selectedPeriod = periodKey(selected)
  const getVals = (metric: MetricDefinition) => currentWindow.map(metric.getValue)
  const insights = buildTrendInsights(selected, prev, currentWindow, previousWindow, range)
  const rangeTitle =
    range === "1"
      ? `${periodLabel(selected)} özeti`
      : range === "all"
      ? `${periodLabel(sorted[0])} - ${periodLabel(selected)}`
      : `Son ${range} ay: ${periodLabel(currentWindow[0])} - ${periodLabel(selected)}`

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trend Analizi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistem başlangıcı: {periodLabel(sorted[0])} · Seçili dönem: {periodLabel(selected)}
        </p>
      </div>

      <div className="space-y-8 px-6 py-8 lg:px-10">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Dönem Karşılaştırması</h2>
              <p className="mt-1 text-sm text-muted-foreground">{rangeTitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((option) => (
                <Link
                  key={option.key}
                  href={buildHref(selectedPeriod, option.key)}
                  className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                    range === option.key
                      ? "border-primary/20 bg-primary/8 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-[11px] opacity-75">{option.description}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {sorted.map((metric) => (
              <Link
                key={periodKey(metric)}
                href={buildHref(periodKey(metric), range)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  periodKey(metric) === selectedPeriod
                    ? "border-primary/20 bg-primary/8 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {periodLabel(metric)}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">KPI Trend Kartları</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {trendCards.map((card) => {
              const allVals = getVals(card)
              const current = card.getValue(selected)
              const prevVal = card.getValue(prev)
              return (
                <TrendCard
                  key={card.key}
                  label={card.label}
                  currentValue={
                    card.decimals > 0
                      ? current.toLocaleString("tr-TR", {
                          maximumFractionDigits: card.decimals,
                          minimumFractionDigits: card.decimals,
                        })
                      : current
                  }
                  change={calcChange(current, prevVal)}
                  sparklineData={allVals}
                  prefix={card.prefix}
                  suffix={card.suffix}
                />
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">Otomatik Analiz</h2>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">Dönem Bazlı</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
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
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Son Dönem Ort.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Değişim</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {momentumRows.map((row, idx) => {
                    const current = row.getValue(selected)
                    const prevVal = row.getValue(prev)
                    const change = calcChange(current, prevVal)
                    const values = getVals(row)
                    const trend = calcTrend(values)
                    const avg = averageFor(currentWindow, row.getValue)
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
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{formatVal(avg, row.prefix, row.suffix, row.decimals)}</td>
                        <td className={`px-4 py-3 text-right font-medium tabular-nums ${changeColor}`}>{change === 0 ? "–" : `${isPos ? "+" : ""}${change.toFixed(1)}%`}</td>
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
