import { TrendCard } from "@/components/analytics/trend-card"
import { InsightCard } from "@/components/analytics/insight-card"
import { mockMetrics, mockInsights } from "@/lib/analytics/mock-data"
import { calcChange, calcTrend } from "@/lib/analytics/calculations"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Trend Analizi" }

interface MomentumRow { label: string; key: keyof typeof mockMetrics[0]; prefix: string; suffix: string; decimals: number }

const momentumRows: MomentumRow[] = [
  { label: "Nakit Tahsilat", key: "cash_collected", prefix: "₺", suffix: "", decimals: 0 },
  { label: "Kâr", key: "profit", prefix: "₺", suffix: "", decimals: 0 },
  { label: "ROAS", key: "roas", prefix: "", suffix: "x", decimals: 2 },
  { label: "MRR", key: "monthly_recurring_revenue", prefix: "₺", suffix: "", decimals: 0 },
  { label: "Reach", key: "instagram_reach", prefix: "", suffix: "", decimals: 0 },
  { label: "Yeni Müşteri", key: "new_customers", prefix: "", suffix: "", decimals: 0 },
  { label: "Watch Hours", key: "youtube_watch_hours", prefix: "", suffix: " sa", decimals: 0 },
  { label: "Ad Spend", key: "ad_spend", prefix: "₺", suffix: "", decimals: 0 },
  { label: "Instagram Takipçi", key: "instagram_followers", prefix: "", suffix: "", decimals: 0 },
  { label: "E-posta Listesi", key: "email_list", prefix: "", suffix: "", decimals: 0 },
]

function formatVal(val: number, prefix: string, suffix: string, decimals: number): string {
  if (prefix === "₺" && val >= 1000) return `₺${(val / 1000).toFixed(1)}K`
  if (val >= 1000 && suffix === "") return `${(val / 1000).toFixed(1)}K`
  return `${prefix}${val.toFixed(decimals)}${suffix}`
}

export default function TrendsPage() {
  const sorted = [...mockMetrics].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
  const latest = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  const getVals = (key: keyof typeof mockMetrics[0]) => sorted.map((m) => Number(m[key] ?? 0))

  const trendCards = [
    { label: "Toplam Gelir", key: "cash_collected" as keyof typeof mockMetrics[0], prefix: "₺", suffix: "" },
    { label: "Kâr", key: "profit" as keyof typeof mockMetrics[0], prefix: "₺", suffix: "" },
    { label: "ROAS", key: "roas" as keyof typeof mockMetrics[0], prefix: "", suffix: "x" },
    { label: "Instagram Reach", key: "instagram_reach" as keyof typeof mockMetrics[0], prefix: "", suffix: "" },
    { label: "Yeni Müşteri", key: "new_customers" as keyof typeof mockMetrics[0], prefix: "", suffix: "" },
    { label: "Watch Hours", key: "youtube_watch_hours" as keyof typeof mockMetrics[0], prefix: "", suffix: " sa" },
  ]

  return (
    <div className="bg-[#0A0A0A] min-h-full">
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#1A1A1A] px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-100">Trend Analizi</h1>
        <p className="text-xs text-zinc-600 mt-0.5">2024 yıllık trend ve otomatik analiz</p>
      </div>

      <div className="p-6 space-y-8">
        <section>
          <h2 className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-3">KPI Trend Kartları</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {trendCards.map((card) => {
              const allVals = getVals(card.key)
              const current = Number(latest[card.key] ?? 0)
              const prevVal = Number(prev[card.key] ?? 0)
              return (
                <TrendCard key={card.key} label={card.label} currentValue={current} change={calcChange(current, prevVal)} sparklineData={allVals.slice(-6)} prefix={card.prefix} suffix={card.suffix} />
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Otomatik Analiz</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-violet-500/15 text-violet-400 font-medium">AI Destekli</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mockInsights.map((insight) => (<InsightCard key={insight.id} insight={insight} />))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-3">Momentum Analizi</h2>
          <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    <th className="text-left text-xs text-zinc-600 uppercase tracking-wider px-5 py-3 font-medium">Metrik</th>
                    <th className="text-right text-xs text-zinc-600 uppercase tracking-wider px-4 py-3 font-medium">Bu Ay</th>
                    <th className="text-right text-xs text-zinc-600 uppercase tracking-wider px-4 py-3 font-medium">Geçen Ay</th>
                    <th className="text-right text-xs text-zinc-600 uppercase tracking-wider px-4 py-3 font-medium">Değişim</th>
                    <th className="text-center text-xs text-zinc-600 uppercase tracking-wider px-4 py-3 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {momentumRows.map((row, idx) => {
                    const current = Number(latest[row.key] ?? 0)
                    const prevVal = Number(prev[row.key] ?? 0)
                    const change = calcChange(current, prevVal)
                    const trend = calcTrend(getVals(row.key))
                    const isPos = change > 0
                    const isNeg = change < 0
                    const changeColor = isPos ? "text-emerald-400" : isNeg ? "text-red-400" : "text-zinc-500"
                    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
                    const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-600"
                    return (
                      <tr key={row.key} className={`border-b border-[#161616] last:border-0 ${idx % 2 === 0 ? "bg-transparent" : "bg-[#0D0D0D]/40"}`}>
                        <td className="px-5 py-3 text-zinc-300 font-medium">{row.label}</td>
                        <td className="px-4 py-3 text-right text-zinc-100 tabular-nums font-medium">{formatVal(current, row.prefix, row.suffix, row.decimals)}</td>
                        <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">{formatVal(prevVal, row.prefix, row.suffix, row.decimals)}</td>
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
