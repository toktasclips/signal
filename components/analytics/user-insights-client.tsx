"use client";

import { useActionState, useMemo, useState } from "react";
import { Lightbulb, Loader2, Plus } from "lucide-react";
import { createUserMonthlyInsight } from "@/actions/user-insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TURKISH_MONTHS } from "@/lib/analytics/mock-data";
import type { ActionState, UserMonthlyInsight } from "@/types";

interface UserInsightsClientProps {
  insights: UserMonthlyInsight[];
}

const initialState: ActionState = { status: "idle" };
const categories = [
  { value: "offer", label: "Teklif" },
  { value: "campaign", label: "Kampanya" },
  { value: "sales", label: "Satış" },
  { value: "content", label: "İçerik" },
  { value: "ads", label: "Reklam" },
  { value: "audience", label: "Kitle" },
  { value: "general", label: "Genel" },
];

function categoryLabel(value: string): string {
  return categories.find((item) => item.value === value)?.label ?? value;
}

export function UserInsightsClient({ insights }: UserInsightsClientProps) {
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    insights[0] ? `${insights[0].year}-${insights[0].month}` : "all"
  );
  const [state, formAction, isPending] = useActionState(
    createUserMonthlyInsight,
    initialState
  );

  const periods = useMemo(() => {
    const unique = new Map<string, string>();
    insights.forEach((insight) => {
      unique.set(
        `${insight.year}-${insight.month}`,
        `${TURKISH_MONTHS[insight.month - 1]} ${insight.year}`
      );
    });
    return Array.from(unique.entries());
  }, [insights]);

  const filteredInsights =
    selectedPeriod === "all"
      ? insights
      : insights.filter(
          (insight) => `${insight.year}-${insight.month}` === selectedPeriod
        );

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form action={formAction} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Yeni İçgörü
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Ay içinde denediğin şeyleri, gördüğün sinyalleri ve karar notlarını
              buraya işle.
            </p>
          </div>
        </div>

        {state.status === "error" && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
            <p className="text-xs text-destructive">
              {state.error ?? "İçgörü kaydedilemedi."}
            </p>
          </div>
        )}

        {state.status === "success" && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs font-medium text-emerald-700">
              İçgörü kaydedildi. Quarter assistant artık bunu analizine katabilir.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="month">Ay</Label>
            <Select id="month" name="month" defaultValue={String(now.getMonth() + 1)}>
              {TURKISH_MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Yıl</Label>
            <Input id="year" name="year" type="number" min="2020" max="2100" defaultValue={now.getFullYear()} />
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Select id="category" name="category" defaultValue="campaign">
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 space-y-1.5">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            name="title"
            placeholder="Örn. DM çağrısı storylerde daha iyi çalıştı"
          />
        </div>

        <div className="mt-3 space-y-1.5">
          <Label htmlFor="body">Gözlemin</Label>
          <Textarea
            id="body"
            name="body"
            placeholder="Ne denedin, ne gördün, ne öğrendin? Kararı etkileyen detayları yaz..."
            className="min-h-[180px] resize-y"
          />
        </div>

        <div className="mt-3 space-y-1.5">
          <Label htmlFor="evidence">Kanıt / Ek Not</Label>
          <Textarea
            id="evidence"
            name="evidence"
            placeholder="Ekran görüntüsü notu, kampanya adı, müşteri yorumu, sayısal sinyal..."
            className="min-h-[96px] resize-y"
          />
        </div>

        <Button type="submit" className="mt-5 w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              İçgörüyü Kaydet
            </>
          )}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Kayıtlı İçgörüler
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Bunlar quarter chatbot’unun yorumlarına bağlam olarak girer.
            </p>
          </div>
          <Select
            className="w-48"
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value)}
          >
            <option value="all">Tüm dönemler</option>
            {periods.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {filteredInsights.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">
              Henüz içgörü yok
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInsights.map((insight) => (
              <article
                key={insight.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary/8 px-2 py-1 text-xs font-medium text-primary">
                    {TURKISH_MONTHS[insight.month - 1]} {insight.year}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {categoryLabel(insight.category)}
                  </span>
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {insight.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {insight.body}
                </p>
                {insight.evidence && (
                  <p className="mt-3 whitespace-pre-wrap rounded-lg border border-border bg-background px-3 py-2 text-xs leading-6 text-muted-foreground">
                    {insight.evidence}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
