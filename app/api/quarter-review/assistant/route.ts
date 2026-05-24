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
            "Kısa paragraflar ve gerekiyorsa 3-5 maddelik aksiyon listesi kullan. " +
            "Kullanıcının işi için gelir, kârlılık, reklam verimliliği, YouTube ve email listesi etkisini birlikte yorumla.",
        },
        {
          role: "user",
          content: `Dönem: ${
            body.periodLabel ?? "Seçili quarter"
          }\nKPI verileri:\n${summarizeMetrics(metrics)}`,
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
