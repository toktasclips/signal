import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TURKISH_MONTHS } from "@/lib/analytics/mock-data";
import type { MonthlyMetric } from "@/lib/analytics/types";

export const runtime = "nodejs";

interface RequestBody {
  periodLabel?: string;
  question?: string;
  metrics?: MonthlyMetric[];
  history?: Array<{ role?: string; content?: string }>;
}

interface MetaAdsSyncRun {
  period_start: string;
  period_end: string;
  spend: number | string;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number | string;
  cpm: number | string;
}

interface MetaAdsCampaignInsight {
  campaign_name: string;
  period_start: string;
  period_end: string;
  spend: number | string;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number | string;
  cpm: number | string;
  result_type: string | null;
  results: number | string;
  cost_per_result: number | string;
}

function client(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function money(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeMetrics(metrics: MonthlyMetric[]): string {
  return metrics
    .map((metric) => {
      const revenue = money(metric.cash_collected);
      const profit = money(metric.profit);
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return [
        `${TURKISH_MONTHS[metric.month - 1]} ${metric.year}`,
        `gelir=${revenue}`,
        `kar=${profit}`,
        `karlilik=${margin.toFixed(1)}%`,
        `ad_spend=${money(metric.ad_spend)}`,
        `roas=${money(metric.roas)}`,
        `reach=${money(metric.instagram_reach)}`,
        `impressions=${money(metric.instagram_impressions)}`,
        `new_customers=${money(metric.new_customers)}`,
        `followers=${money(metric.instagram_followers)}`,
        `youtube_views=${money(metric.youtube_views)}`,
        `watch_hours=${money(metric.youtube_watch_hours)}`,
        `email_list=${money(metric.email_list)}`,
        `software_expenses=${money(metric.software_expenses)}`,
      ].join(" | ");
    })
    .join("\n");
}

function periodWindow(metrics: MonthlyMetric[]): { start: string; endExclusive: string } {
  const sorted = [...metrics].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const start = new Date(Date.UTC(first.year, first.month - 1, 1));
  const endExclusive = new Date(Date.UTC(last.year, last.month, 1));
  return {
    start: start.toISOString().slice(0, 10),
    endExclusive: endExclusive.toISOString().slice(0, 10),
  };
}

function summarizeMetaData(
  syncRuns: MetaAdsSyncRun[],
  campaigns: MetaAdsCampaignInsight[]
): string {
  if (syncRuns.length === 0 && campaigns.length === 0) {
    return "Meta kaynak verisi yok.";
  }

  const totalSpend = campaigns.reduce((total, row) => total + money(row.spend), 0);
  const totalResults = campaigns.reduce((total, row) => total + money(row.results), 0);
  const avgCostPerResult = totalResults > 0 ? totalSpend / totalResults : 0;
  const topCampaigns = [...campaigns]
    .sort((a, b) => money(b.spend) - money(a.spend))
    .slice(0, 8)
    .map((row) =>
      [
        row.campaign_name,
        `spend=${money(row.spend)}`,
        `results=${money(row.results)}`,
        `cost_per_result=${money(row.cost_per_result)}`,
        `result_type=${row.result_type ?? "unknown"}`,
        `reach=${money(row.reach)}`,
        `impressions=${money(row.impressions)}`,
        `clicks=${money(row.clicks)}`,
        `ctr=${money(row.ctr)}%`,
        `cpm=${money(row.cpm)}`,
      ].join(" | ")
    )
    .join("\n");

  return [
    `Meta sync run sayısı=${syncRuns.length}`,
    `kampanya sayısı=${campaigns.length}`,
    `kampanya toplam spend=${totalSpend}`,
    `toplam sonuç=${totalResults}`,
    `ortalama sonuç başı ücret=${avgCostPerResult}`,
    topCampaigns ? `Kampanya detayları:\n${topCampaigns}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function sanitizeHistory(history: RequestBody["history"]) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
    )
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 1200),
    }));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openai = client();
  if (!openai) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as RequestBody;
  const question = body.question?.trim();
  const metrics = Array.isArray(body.metrics) ? body.metrics.slice(0, 4) : [];

  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }
  if (metrics.length === 0) {
    return NextResponse.json(
      { error: "Quarter metrics are missing." },
      { status: 400 }
    );
  }

  try {
    const { start, endExclusive } = periodWindow(metrics);
    const [syncResult, campaignResult] = await Promise.all([
      supabase
        .from("meta_ads_sync_runs")
        .select("period_start,period_end,spend,reach,impressions,clicks,ctr,cpm")
        .gte("period_end", start)
        .lt("period_start", endExclusive)
        .order("period_start", { ascending: false })
        .limit(12),
      supabase
        .from("meta_ads_campaign_insights")
        .select(
          "campaign_name,period_start,period_end,spend,reach,impressions,clicks,ctr,cpm,result_type,results,cost_per_result"
        )
        .gte("period_end", start)
        .lt("period_start", endExclusive)
        .order("spend", { ascending: false })
        .limit(30),
    ]);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 650,
      messages: [
        {
          role: "system",
          content:
            "Sen Teneffüs uygulamasının quarter review intelligence assistant'ısın. " +
            "Türkçe, net, stratejik ve uygulanabilir cevap ver. " +
            "Sadece verilen KPI verilerine dayan; emin olmadığın yerde varsayım yaptığını söyle. " +
            "Meta reklam kaynak verisi varsa kampanya bazlı spend, sonuç, sonuç başı ücret, CPM, CTR ve reach'i yorumla. " +
            "Sadece genel tavsiye verme; veride görünen en güçlü/zayıf sinyali ve bir sonraki aksiyonu belirt. " +
            "Markdown başlıkları, yıldızlı bold formatı veya tablo kullanma; kısa paragraflar ve düz metin maddeleri kullan. " +
            "Kullanıcının işi için gelir, kârlılık, reklam verimliliği, YouTube ve email listesi etkisini birlikte yorumla.",
      },
        {
          role: "user",
          content: `Dönem: ${
            body.periodLabel ?? "Seçili quarter"
          }\nKPI verileri:\n${summarizeMetrics(metrics)}\n\nMeta reklam kaynak verileri:\n${summarizeMetaData(
            (syncResult.data as MetaAdsSyncRun[] | null) ?? [],
            (campaignResult.data as MetaAdsCampaignInsight[] | null) ?? []
          )}`,
        },
        ...sanitizeHistory(body.history),
        { role: "user", content: question.slice(0, 1200) },
      ],
    });

    const answer = response.choices[0]?.message?.content;
    return NextResponse.json({
      answer: answer ?? "Bu veriyle net bir cevap üretemedim.",
    });
  } catch {
    return NextResponse.json(
      { error: "Assistant şu an cevap üretemedi." },
      { status: 500 }
    );
  }
}
