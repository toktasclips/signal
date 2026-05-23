import { KpiCard } from "@/components/analytics/kpi-card"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { ProfitChart } from "@/components/analytics/profit-chart"
import { ReachCustomersChart } from "@/components/analytics/reach-customers-chart"
import { WatchtimeChart } from "@/components/analytics/watchtime-chart"
import { TURKISH_MONTHS } from "@/lib/analytics/mock-data"
import { getMonthlyMetrics } from "@/lib/analytics/data"
import { createClient } from "@/lib/supabase/server"
import { buildChartData, calcKpiSummaryForPeriod } from "@/lib/analytics/calculations"
import { DollarSign, TrendingUp, Target, Percent, Youtube } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import type { MonthlyMetric } from "@/lib/analytics/types"

export const metadata: Metadata = { title: "Trend Dashboard" }

function formatValue(value: number, prefix: string, suffix: string): string {
  if (prefix === "₺") {
    if (value >= 1000) return `₺${(value / 1000).toFixed(0)}K`
    return `₺${value.toLocaleString("tr-TR")}`
  }
  if (suffix === "%") return `${value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`
  return `${prefix}${value.toLocaleString("tr-TR")}${suffix}`
}

const kpiIcons = [
  <DollarSign key="dollar" size={16} />,
  <TrendingUp key="trend" size={16} />,
  <Percent key="margin" size={16} />,
  <Target key="target" size={16} />,
  <Youtube key="youtube" size={16} />,
]

const businessMetricKeys: Array<keyof MonthlyMetric> = [
  "total_goal",
  "new_deal_value",
  "monthly_recurring_revenue",
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
]

function hasBusinessData(metric: MonthlyMetric): boolean {
  return businessMetricKeys.some(
    (key) => metric[key] !== null && metric[key] !== undefined
  )
}

function periodKey(metric: { month: number; year: number }) {
  return `${metric.year}-${String(metric.month).padStart(2, "0")}`
}

export default async function TrendDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const metrics = await getMonthlyMetrics(user.id)
  const sortMetrics = (items: MonthlyMetric[]) =>
    [...items].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    )
  const businessMetrics = metrics.filter(hasBusinessData)
  const sortedMetrics = sortMetrics(businessMetrics.length ? businessMetrics : metrics)
  const params = await searchParams
  const selectedMetric =
    sortedMetrics.find((metric) => periodKey(metric) === params?.period) ??
    sortedMetrics[sortedMetrics.length - 1]
  const selectedIndex = sortedMetrics.findIndex(
    (metric) => periodKey(metric) === periodKey(selectedMetric)
  )
  const chartMetrics = sortedMetrics.slice(0, selectedIndex + 1)
  const latestMetric = selectedMetric
  const firstMetric = sortedMetrics[0]
  const yearLabel =
    firstMetric.year === latestMetric.year
      ? `${latestMetric.year}`
      : `${firstMetric.year}-${latestMetric.year}`
  const kpiSummary = calcKpiSummaryForPeriod(sortedMetrics, selectedMetric)
  const revenueData = buildChartData(chartMetrics, "cash_collected")
  const profitData = buildChartData(chartMetrics, "profit")
  const reachCustomersData = chartMetrics.map((m) => ({
    month: `${TURKISH_MONTHS[m.month - 1].slice(0, 3)} ${String(m.year).slice(-2)}`,
    reach: m.instagram_reach ?? 0,
    customers: m.new_customers ?? 0,
  }))
  const watchtimeData = chartMetrics.map((m) => ({
    month: `${TURKISH_MONTHS[m.month - 1].slice(0, 3)} ${String(m.year).slice(-2)}`,
    watchHours: m.youtube_watch_hours ?? 0,
    revenue: m.cash_collected ?? 0,
  }))

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Trend Dashboard
          </h1>
          <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-card">
            {TURKISH_MONTHS[latestMetric.month - 1]} {latestMetric.year}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Seçili dönem: {TURKISH_MONTHS[latestMetric.month - 1]} {latestMetric.year}
        </p>
      </div>

      <div className="space-y-8 px-6 py-8 lg:px-10">
        <section className="space-y-3">
          <SectionHeader
            title="Dönem Seçimi"
            description="Sistem başlangıcı Eylül 2025. Her ayı bir önceki dolu ayla karşılaştırabilirsiniz."
          />
          <div className="flex flex-wrap gap-2">
            {sortedMetrics.map((metric) => {
              const active = periodKey(metric) === periodKey(selectedMetric)
              return (
                <Link
                  key={periodKey(metric)}
                  href={`/trend-dashboard?period=${periodKey(metric)}`}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {TURKISH_MONTHS[metric.month - 1]} {metric.year}
                </Link>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            title="Temel Metrikler"
            description="Gelir, karlılık ve kanal performansı için executive görünüm."
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {kpiSummary.map((kpi, i) => (
              <KpiCard
                key={kpi.key}
                title={kpi.label}
                value={formatValue(kpi.value, kpi.prefix, kpi.suffix)}
                change={kpi.change}
                icon={kpiIcons[i]}
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartPanel
            title="Gelir Trendi"
            description={`Aylık nakit tahsilat (${yearLabel})`}
          >
            <RevenueChart data={revenueData} />
          </ChartPanel>
          <ChartPanel
            title="Kâr Trendi"
            description={`Aylık net kâr (${yearLabel})`}
          >
            <ProfitChart data={profitData} />
          </ChartPanel>
          <ChartPanel
            title="Reach vs Müşteri"
            description="Instagram erişim ve yeni müşteri kazanımı"
          >
            <ReachCustomersChart data={reachCustomersData} />
          </ChartPanel>
          <ChartPanel
            title="Watch Time vs Toplam Gelir"
            description="YouTube izlenme süresi ve aylık nakit tahsilat"
          >
            <WatchtimeChart data={watchtimeData} />
          </ChartPanel>
        </div>

        <MetricLogPanel metric={selectedMetric} />

        <div className="text-center py-4 pb-8">
          <p className="text-xs text-muted-foreground">
            Veriler Supabase üzerinden okunuyor. KPI Girişi sayfasındaki kayıtlar bu dashboard'a yansır.
          </p>
        </div>
      </div>
    </div>
  )
}

const metricLogGroups: Array<{
  title: string
  items: Array<{
    label: string
    key: keyof MonthlyMetric
    format: "currency" | "number" | "decimal" | "hours" | "ratio" | "text"
  }>
}> = [
  {
    title: "Finansal",
    items: [
      { label: "Hedeflenen Gelir", key: "total_goal", format: "currency" },
      { label: "Yeni Deal Value", key: "new_deal_value", format: "currency" },
      { label: "Toplam Gelir", key: "cash_collected", format: "currency" },
      { label: "Kâr", key: "profit", format: "currency" },
      { label: "Stripe Brüt Gelir", key: "stripe_gross_revenue", format: "currency" },
      { label: "Stripe Net Gelir", key: "stripe_net_revenue", format: "currency" },
      { label: "Stripe Fee", key: "stripe_fees", format: "currency" },
      { label: "Stripe Refund", key: "stripe_refunds", format: "currency" },
      { label: "Yazılım Harcamaları", key: "software_expenses", format: "currency" },
      { label: "Diğer Harcamalar", key: "other_expenses", format: "currency" },
    ],
  },
  {
    title: "Reklam",
    items: [
      { label: "Reklam Harcaması", key: "ad_spend", format: "currency" },
      { label: "CPM", key: "cpm", format: "currency" },
      { label: "ROAS", key: "roas", format: "ratio" },
      { label: "Instagram Reach", key: "instagram_reach", format: "number" },
      { label: "Instagram Gösterim", key: "instagram_impressions", format: "number" },
    ],
  },
  {
    title: "Kitle & İçerik",
    items: [
      { label: "Yeni Müşteri", key: "new_customers", format: "number" },
      { label: "Instagram Takipçi", key: "instagram_followers", format: "number" },
      { label: "Toplam Etkileşim", key: "engagement", format: "number" },
      { label: "Paylaşım", key: "shares", format: "number" },
      { label: "Mail Listesi", key: "email_list", format: "number" },
    ],
  },
  {
    title: "YouTube",
    items: [
      { label: "Abone", key: "youtube_subscribers", format: "number" },
      { label: "İzlenme Sayısı", key: "youtube_views", format: "number" },
      { label: "İzlenme Saati", key: "youtube_watch_hours", format: "hours" },
      { label: "Paylaşılan Video", key: "youtube_video_count", format: "number" },
    ],
  },
]

function MetricLogPanel({ metric }: { metric: MonthlyMetric }) {
  return (
    <section className="space-y-3">
      <SectionHeader
        title="Aylık Veri Logu"
        description={`${TURKISH_MONTHS[metric.month - 1]} ${metric.year} için girilen ham kayıtlar ve eksik alanlar.`}
      />
      {metric.stripe_synced_at && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-700">
            Stripe sync aktif: {metric.stripe_period_start} - {metric.stripe_period_end}
          </p>
          <p className="mt-0.5 text-xs text-emerald-700/80">
            Son senkronizasyon: {new Date(metric.stripe_synced_at).toLocaleString("tr-TR")}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {metricLogGroups.map((group) => (
          <div key={group.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{group.title}</h3>
            <div className="divide-y divide-border">
              {group.items.map((item) => {
                const value = metric[item.key]
                const missing = value === null || value === undefined || value === ""
                return (
                  <div key={item.key} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={missing ? "text-muted-foreground/55" : "font-medium text-foreground tabular-nums"}>
                      {missing ? "Eksik" : formatLogValue(value, item.format)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {metric.notes && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Not</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{metric.notes}</p>
        </div>
      )}
    </section>
  )
}

function formatLogValue(
  value: MonthlyMetric[keyof MonthlyMetric],
  format: "currency" | "number" | "decimal" | "hours" | "ratio" | "text"
): string {
  if (typeof value !== "number") return String(value)
  if (format === "currency") return `₺${value.toLocaleString("tr-TR")}`
  if (format === "hours") return `${value.toLocaleString("tr-TR")} sa`
  if (format === "ratio") return `${value.toLocaleString("tr-TR")}x`
  if (format === "decimal") return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })
  return value.toLocaleString("tr-TR")
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
