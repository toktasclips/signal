import { getMonthlyMetrics } from "@/lib/analytics/data"
import { TURKISH_MONTHS } from "@/lib/analytics/mock-data"
import { createClient } from "@/lib/supabase/server"
import { QuarterIntelligenceAssistant } from "@/components/analytics/quarter-intelligence-assistant"
import type { MonthlyMetric } from "@/lib/analytics/types"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Quarter Review" }

type ReviewSection = "wins" | "bottlenecks" | "opportunities" | "next_focus"

interface QuarterGroup {
  key: string
  quarter: number
  year: number
  metrics: MonthlyMetric[]
}

interface MetaCampaignInsight {
  campaign_name: string
  period_start: string
  period_end: string
  spend: number | string
  reach: number
  impressions: number
  clicks: number
  ctr: number | string
  cpm: number | string
  result_type: string | null
  results: number | string
  cost_per_result: number | string
}

const sectionDefs: Array<{
  key: ReviewSection
  label: string
  accent: string
  titleClass: string
}> = [
  {
    key: "wins",
    label: "Kazanımlar",
    accent: "border-emerald-200/80 bg-emerald-50/25",
    titleClass: "text-emerald-700",
  },
  {
    key: "bottlenecks",
    label: "Darboğazlar",
    accent: "border-amber-200/80 bg-amber-50/25",
    titleClass: "text-amber-700",
  },
  {
    key: "opportunities",
    label: "Fırsatlar",
    accent: "border-border bg-card",
    titleClass: "text-primary",
  },
  {
    key: "next_focus",
    label: "Sonraki Odak",
    accent: "border-border bg-card",
    titleClass: "text-muted-foreground",
  },
]

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
]

function hasBusinessData(metric: MonthlyMetric): boolean {
  return businessMetricKeys.some(
    (key) => metric[key] !== null && metric[key] !== undefined
  )
}

function quarterOf(month: number): number {
  return Math.ceil(month / 3)
}

function groupByQuarter(metrics: MonthlyMetric[]): QuarterGroup[] {
  const groups = new Map<string, QuarterGroup>()

  for (const metric of metrics) {
    const quarter = quarterOf(metric.month)
    const key = `${metric.year}-Q${quarter}`
    const group =
      groups.get(key) ??
      { key, quarter, year: metric.year, metrics: [] }
    group.metrics.push(metric)
    groups.set(key, group)
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      metrics: group.metrics.sort((a, b) => a.month - b.month),
    }))
    .sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.quarter - b.quarter
    )
}

function sum(metrics: MonthlyMetric[], key: keyof MonthlyMetric): number {
  return metrics.reduce((total, metric) => total + Number(metric[key] ?? 0), 0)
}

function lastValue(metrics: MonthlyMetric[], key: keyof MonthlyMetric): number {
  return Number(metrics[metrics.length - 1]?.[key] ?? 0)
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) return `₺${(value / 1000).toFixed(0)}K`
  return `₺${value.toLocaleString("tr-TR")}`
}

function formatNumber(value: number): string {
  return value.toLocaleString("tr-TR")
}

function formatMonths(metrics: MonthlyMetric[]): string {
  return metrics
    .map((metric) => TURKISH_MONTHS[metric.month - 1])
    .join(", ")
}

function periodWindow(metrics: MonthlyMetric[]): { start: string; endExclusive: string } {
  const sorted = [...metrics].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  )
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const start = new Date(Date.UTC(first.year, first.month - 1, 1))
  const endExclusive = new Date(Date.UTC(last.year, last.month, 1))

  return {
    start: start.toISOString().slice(0, 10),
    endExclusive: endExclusive.toISOString().slice(0, 10),
  }
}

function pct(value: number): string {
  return `%${value.toFixed(1)}`
}

function profitMargin(revenue: number, profit: number): number {
  if (revenue === 0) return 0
  return (profit / revenue) * 100
}

function buildReview(
  group: QuarterGroup,
  metaCampaigns: MetaCampaignInsight[]
): Record<ReviewSection, string[]> {
  const { metrics } = group
  const first = metrics[0]
  const last = metrics[metrics.length - 1]
  const revenue = sum(metrics, "cash_collected")
  const profit = sum(metrics, "profit")
  const adSpend = sum(metrics, "ad_spend")
  const newDeal = sum(metrics, "new_deal_value")
  const watchHours = sum(metrics, "youtube_watch_hours")
  const customers = sum(metrics, "new_customers")
  const avgRoas =
    metrics.filter((metric) => metric.roas !== null).reduce(
      (total, metric) => total + Number(metric.roas ?? 0),
      0
    ) / Math.max(1, metrics.filter((metric) => metric.roas !== null).length)
  const margin = profitMargin(revenue, profit)
  const followerGrowth =
    Number(last.instagram_followers ?? 0) - Number(first.instagram_followers ?? 0)
  const emailList = lastValue(metrics, "email_list")
  const metaSpend = metaCampaigns.reduce(
    (total, campaign) => total + Number(campaign.spend ?? 0),
    0
  )
  const metaResults = metaCampaigns.reduce(
    (total, campaign) => total + Number(campaign.results ?? 0),
    0
  )
  const avgCostPerResult = metaResults > 0 ? metaSpend / metaResults : 0
  const highestResultCampaign = [...metaCampaigns].sort(
    (a, b) => Number(b.results ?? 0) - Number(a.results ?? 0)
  )[0]
  const highestSpendCampaign = [...metaCampaigns].sort(
    (a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0)
  )[0]
  const weakSpendCampaign = [...metaCampaigns]
    .filter((campaign) => Number(campaign.spend ?? 0) > 0)
    .sort((a, b) => {
      const aResults = Number(a.results ?? 0)
      const bResults = Number(b.results ?? 0)
      if (aResults === 0 && bResults > 0) return -1
      if (bResults === 0 && aResults > 0) return 1
      return Number(b.cost_per_result ?? 0) - Number(a.cost_per_result ?? 0)
    })[0]

  const wins = [
    `Toplam gelir ${formatCurrency(revenue)} olarak kaydedildi.`,
    `Kâr ${formatCurrency(profit)} seviyesinde; kârlılık ${pct(margin)}.`,
    avgRoas > 0
      ? `Ortalama ROAS ${avgRoas.toFixed(2)}x seviyesinde.`
      : "ROAS verisi henüz bu dönem için tamamlanmamış.",
  ]

  if (newDeal > 0) wins.push(`Yeni deal value toplamı ${formatCurrency(newDeal)}.`)
  if (watchHours > 0) wins.push(`YouTube izlenme saati ${formatNumber(watchHours)} sa.`)
  if (customers > 0) wins.push(`${formatNumber(customers)} yeni müşteri kaydı var.`)
  if (followerGrowth > 0) wins.push(`Instagram takipçi artışı ${formatNumber(followerGrowth)}.`)
  if (highestResultCampaign && Number(highestResultCampaign.results ?? 0) > 0) {
    wins.push(
      `Meta'da en çok sonuç üreten kampanya "${highestResultCampaign.campaign_name}" (${formatNumber(
        Number(highestResultCampaign.results)
      )} sonuç, sonuç başı ₺${Number(highestResultCampaign.cost_per_result ?? 0).toLocaleString("tr-TR")}).`
    )
  }

  const bottlenecks = []
  if (adSpend > 0 && avgRoas < 4) {
    bottlenecks.push(`Reklam verimliliği baskıda: ${formatCurrency(adSpend)} harcamaya karşı ROAS ${avgRoas.toFixed(2)}x.`)
  } else if (adSpend === 0) {
    bottlenecks.push("Reklam harcaması kaydı eksik; dönem verimliliği tam okunamıyor.")
  }
  if (margin < 60 && revenue > 0) bottlenecks.push(`Kârlılık ${pct(margin)}; gider kalemleri ayrıca kontrol edilmeli.`)
  if (customers === 0) bottlenecks.push("Yeni müşteri sayısı bu dönem için eksik veya 0 görünüyor.")
  if (watchHours === 0) bottlenecks.push("Watch time verisi eksik; içerik etkisi okunamıyor.")
  if (!last.instagram_followers) bottlenecks.push("Instagram takipçi sayısı dönem sonunda eksik.")
  if (metaCampaigns.length === 0) {
    bottlenecks.push("Meta kampanya kaynak verisi bu dönem için henüz yok; reklam harcamasının hangi kampanyadan geldiği okunamıyor.")
  } else if (weakSpendCampaign && Number(weakSpendCampaign.results ?? 0) === 0) {
    bottlenecks.push(
      `"${weakSpendCampaign.campaign_name}" harcama almış ama sonuç üretmemiş görünüyor; kreatif, hedefleme veya optimizasyon amacı kontrol edilmeli.`
    )
  }
  if (bottlenecks.length === 0) bottlenecks.push("Kritik darboğaz görünmüyor; mevcut ritim korunabilir.")

  const opportunities = [
    "Watch time ile toplam gelir ilişkisini kampanya ve içerik tarihleriyle beraber takip et.",
    "Eksik aylık KPI alanlarını tamamlayarak trend analizini daha güvenilir hale getir.",
  ]
  if (avgRoas >= 6) opportunities.push("ROAS güçlü; çalışan reklam açısını ölçekleme fırsatı var.")
  if (emailList > 0) opportunities.push(`Mail listesi ${formatNumber(emailList)} seviyesinde; satış kampanyaları için kullanılabilir.`)
  if (adSpend > 0) opportunities.push("Reklam harcaması yüksek günlerde nakit tahsilat etkisini ayrıca ölç.")
  if (highestResultCampaign && avgCostPerResult > 0) {
    opportunities.push(
      `"${highestResultCampaign.campaign_name}" sonuç üretimi açısından referans alınabilir; yeni kampanya brief'leri bu açıdan türetilebilir.`
    )
  }
  if (highestSpendCampaign && highestSpendCampaign !== highestResultCampaign) {
    opportunities.push(
      `En yüksek harcama "${highestSpendCampaign.campaign_name}" üzerinde; bütçe dağılımını sonuç başı ücretle birlikte yeniden tart.`
    )
  }

  const next_focus = [
    "Bir sonraki dönemde toplam gelir, kâr ve kârlılık yüzdesini birlikte takip et.",
    "KPI Girişi ekranından eksik müşteri, watch time ve takipçi verilerini tamamla.",
  ]
  if (avgRoas > 0) next_focus.push(`ROAS hedefini en az ${Math.max(4, Math.ceil(avgRoas))}x bandında koru.`)
  if (watchHours > 0) next_focus.push("YouTube izlenme saatini gelirle beraber haftalık takip et.")
  if (metaCampaigns.length > 0) {
    next_focus.push(
      `Meta için sonuç başı ücret referansı ₺${avgCostPerResult.toLocaleString("tr-TR", {
        maximumFractionDigits: 2,
      })}; yeni kampanyalarda bu eşiğin üstüne çıkan setleri erken durdur.`
    )
  }

  return { wins, bottlenecks, opportunities, next_focus }
}

function metricSummary(group: QuarterGroup) {
  const revenue = sum(group.metrics, "cash_collected")
  const profit = sum(group.metrics, "profit")
  const adSpend = sum(group.metrics, "ad_spend")
  return [
    { label: "Toplam Gelir", value: formatCurrency(revenue) },
    { label: "Kâr", value: formatCurrency(profit) },
    { label: "Kârlılık", value: pct(profitMargin(revenue, profit)) },
    { label: "Reklam Harcaması", value: formatCurrency(adSpend) },
  ]
}

export default async function QuarterReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const allMetrics = await getMonthlyMetrics(user.id)
  const metrics = allMetrics
    .filter(hasBusinessData)
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
  const groups = groupByQuarter(metrics)
  const params = await searchParams
  const activeGroup =
    groups.find((group) => group.key === params?.period) ??
    groups[groups.length - 1]

  if (!activeGroup) {
    return (
      <div className="min-h-full bg-background">
        <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Quarter Review
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Henüz değerlendirilecek KPI kaydı yok.
          </p>
        </div>
      </div>
    )
  }

  const { start, endExclusive } = periodWindow(activeGroup.metrics)
  const { data: metaCampaignData } = await supabase
    .from("meta_ads_campaign_insights")
    .select(
      "campaign_name,period_start,period_end,spend,reach,impressions,clicks,ctr,cpm,result_type,results,cost_per_result"
    )
    .gte("period_end", start)
    .lt("period_start", endExclusive)
    .order("spend", { ascending: false })
    .limit(30)
  const metaCampaigns = (metaCampaignData as MetaCampaignInsight[] | null) ?? []
  const review = buildReview(activeGroup, metaCampaigns)

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border bg-background/95 px-6 py-6 backdrop-blur lg:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Quarter Review
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          2025 Eylül başlangıcından itibaren gerçek KPI kayıtlarına göre dönem özeti.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1 shadow-card">
          {groups.map((group) => {
            const active = group.key === activeGroup.key
            return (
              <Link
                key={group.key}
                href={`/quarter-review?period=${group.key}`}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                Q{group.quarter} {group.year}
              </Link>
            )
          })}
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Q{activeGroup.quarter} {activeGroup.year}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatMonths(activeGroup.metrics)}
              </p>
            </div>
            <span className="rounded-md border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              {activeGroup.metrics.length} aylık kayıt
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metricSummary(activeGroup).map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
              <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sectionDefs.map((section) => (
            <div
              key={section.key}
              className={`rounded-xl border ${section.accent} p-5 shadow-card`}
            >
              <h3 className={`mb-4 text-sm font-semibold ${section.titleClass}`}>
                {section.label}
              </h3>
              <ul className="space-y-2">
                {review[section.key].map((line) => (
                  <li key={line} className="flex gap-2 text-sm leading-relaxed text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-45" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <QuarterIntelligenceAssistant
          periodLabel={`Q${activeGroup.quarter} ${activeGroup.year} (${formatMonths(activeGroup.metrics)})`}
          metrics={activeGroup.metrics}
        />
      </div>
    </div>
  )
}
