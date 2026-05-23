import { KpiCard } from "@/components/analytics/kpi-card"
import { RevenueChart } from "@/components/analytics/revenue-chart"
import { ProfitChart } from "@/components/analytics/profit-chart"
import { ReachCustomersChart } from "@/components/analytics/reach-customers-chart"
import { WatchtimeChart } from "@/components/analytics/watchtime-chart"
import { mockMetrics, TURKISH_MONTHS } from "@/lib/analytics/mock-data"
import { buildChartData, calcKpiSummary } from "@/lib/analytics/calculations"
import {
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Activity,
  Youtube,
} from "lucide-react"

function formatValue(value: number, prefix: string, suffix: string): string {
  if (prefix === "₺") {
    if (value >= 1000) {
      return `₺${(value / 1000).toFixed(0)}K`
    }
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

export default function AnalyticsDashboard() {
  const sortedMetrics = [...mockMetrics].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )

  const latestMetric = sortedMetrics[sortedMetrics.length - 1]
  const currentMonthName = TURKISH_MONTHS[latestMetric.month - 1]
  const currentYear = latestMetric.year

  const kpiSummary = calcKpiSummary(mockMetrics)

  const revenueData = buildChartData(sortedMetrics, "cash_collected")
  const profitData = buildChartData(sortedMetrics, "profit")

  const reachCustomersData = sortedMetrics.map((m) => ({
    month: ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"][m.month - 1],
    reach: m.instagram_reach ?? 0,
    customers: m.new_customers ?? 0,
  }))

  const watchtimeData = sortedMetrics.map((m) => ({
    month: ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"][m.month - 1],
    watchHours: m.youtube_watch_hours ?? 0,
    mrr: m.monthly_recurring_revenue ?? 0,
  }))

  return (
    <main className="flex-1 overflow-y-auto bg-[#0A0A0A]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#1A1A1A] px-6 py-4 lg:pl-6 pl-14">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
          <span className="px-2 py-0.5 text-xs rounded-full bg-violet-500/15 text-violet-400 font-medium">
            {currentMonthName} {currentYear}
          </span>
        </div>
        <p className="text-xs text-zinc-600 mt-0.5">
          Son güncelleme: Aralık 2024
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards Grid */}
        <div>
          <h2 className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-3">
            Temel Metrikler
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Revenue Chart */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">
                Gelir Trendi
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5">
                Aylık nakit tahsilat (2024)
              </p>
            </div>
            <RevenueChart data={revenueData} />
          </div>

          {/* Profit Chart */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">
                Kâr Trendi
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5">Aylık net kâr (2024)</p>
            </div>
            <ProfitChart data={profitData} />
          </div>

          {/* Reach vs Customers */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">
                Reach vs Müşteri
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5">
                Instagram erişim ve yeni müşteri kazanımı
              </p>
            </div>
            <ReachCustomersChart data={reachCustomersData} />
          </div>

          {/* Watchtime vs MRR */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">
                Watch Time vs MRR
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5">
                YouTube izlenme süresi ve aylık tekrarlayan gelir
              </p>
            </div>
            <WatchtimeChart data={watchtimeData} />
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center py-4">
          <p className="text-xs text-zinc-700">
            Veriler mock datadan yükleniyor — gerçek zamanlı Supabase entegrasyonu için KPI Girişi sayfasını kullanın.
          </p>
        </div>
      </div>
    </main>
  )
}
