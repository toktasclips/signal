import { KpiCard } from "@/components/analytics/kpi-card"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { ProfitChart } from "@/components/analytics/profit-chart"
import { ReachCustomersChart } from "@/components/analytics/reach-customers-chart"
import { WatchtimeChart } from "@/components/analytics/watchtime-chart"
import { mockMetrics, TURKISH_MONTHS } from "@/lib/analytics/mock-data"
import { buildChartData, calcKpiSummary } from "@/lib/analytics/calculations"
import { DollarSign, TrendingUp, Target, Activity, Youtube } from "lucide-react"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = { title: "Trend Dashboard" }

function formatValue(value: number, prefix: string, suffix: string): string {
  if (prefix === "₺") {
    if (value >= 1000) return `₺${(value / 1000).toFixed(0)}K`
    return `₺${value.toLocaleString("tr-TR")}`
  }
  return `${prefix}${value.toLocaleString("tr-TR")}${suffix}`
}

const kpiIcons = [
  <DollarSign key="dollar" size={16} />,
  <TrendingUp key="trend" size={16} />,
  <Target key="target" size={16} />,
  <Activity key="activity" size={16} />,
  <DollarSign key="mrr" size={16} />,
  <Youtube key="youtube" size={16} />,
]

export default function TrendDashboardPage() {
  const sortedMetrics = [...mockMetrics].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )
  const latestMetric = sortedMetrics[sortedMetrics.length - 1]
  const kpiSummary = calcKpiSummary(mockMetrics)
  const revenueData = buildChartData(sortedMetrics, "cash_collected")
  const profitData = buildChartData(sortedMetrics, "profit")
  const MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]
  const reachCustomersData = sortedMetrics.map((m) => ({
    month: MONTHS[m.month - 1],
    reach: m.instagram_reach ?? 0,
    customers: m.new_customers ?? 0,
  }))
  const watchtimeData = sortedMetrics.map((m) => ({
    month: MONTHS[m.month - 1],
    watchHours: m.youtube_watch_hours ?? 0,
    mrr: m.monthly_recurring_revenue ?? 0,
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
          Son güncelleme: Aralık 2024
        </p>
      </div>

      <div className="space-y-8 px-6 py-8 lg:px-10">
        <section className="space-y-3">
          <SectionHeader
            title="Temel Metrikler"
            description="Gelir, karlılık ve kanal performansı için executive görünüm."
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
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
            description="Aylık nakit tahsilat (2024)"
          >
            <RevenueChart data={revenueData} />
          </ChartPanel>
          <ChartPanel
            title="Kâr Trendi"
            description="Aylık net kâr (2024)"
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
            title="Watch Time vs MRR"
            description="YouTube izlenme süresi ve aylık tekrarlayan gelir"
          >
            <WatchtimeChart data={watchtimeData} />
          </ChartPanel>
        </div>

        <div className="text-center py-4 pb-8">
          <p className="text-xs text-muted-foreground">
            Veriler mock datadan yükleniyor — gerçek zamanlı Supabase entegrasyonu için KPI Girişi sayfasını kullanın.
          </p>
        </div>
      </div>
    </div>
  )
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
