import { Sparkles, AlertTriangle, TrendingUp, Ghost, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SemanticTagBadge, TAG_CONFIG } from "@/components/signals/semantic-tag-badge";
import type { SemanticTag, SemanticTagName } from "@/types";

export const dynamic = "force-dynamic";

const OBJECTION_TAGS: SemanticTagName[] = [
  "price_objection",
  "timing_objection",
  "spouse_objection",
  "trust_objection",
  "decision_delay",
];

const INTENT_TAGS: SemanticTagName[] = [
  "high_intent",
  "warm_interest",
  "passive_interest",
  "urgent_need",
];

function groupByTag(tags: SemanticTag[]) {
  return tags.reduce(
    (acc, t) => {
      const tag = t.tag as SemanticTagName;
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(t);
      return acc;
    },
    {} as Record<SemanticTagName, SemanticTag[]>
  );
}

interface TagRowProps {
  tag: SemanticTagName;
  count: number;
  leads: string[];
}

function TagRow({ tag, count, leads }: TagRowProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <SemanticTagBadge tag={tag} />
      <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
        {count}×
      </span>
      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
        {leads.slice(0, 2).join(", ")}
        {leads.length > 2 ? ` +${leads.length - 2}` : ""}
      </span>
    </div>
  );
}

export default async function SignalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tagsData }, { data: leadsData }] = await Promise.all([
    supabase
      .from("semantic_tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, name")
      .eq("user_id", user.id),
  ]);

  const tags = (tagsData ?? []) as SemanticTag[];
  const leadMap = new Map((leadsData ?? []).map((l) => [l.id, l.name as string]));

  const grouped = groupByTag(tags);

  // Top objections
  const objections = OBJECTION_TAGS.map((tag) => ({
    tag,
    items: grouped[tag] ?? [],
  }))
    .filter((o) => o.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length);

  // Intent breakdown
  const intents = INTENT_TAGS.map((tag) => ({
    tag,
    items: grouped[tag] ?? [],
  }))
    .filter((o) => o.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length);

  // Ghosting risks — unique leads
  const ghostingLeadIds = [
    ...new Set((grouped["ghosting_risk"] ?? []).map((t) => t.lead_id).filter(Boolean)),
  ] as string[];

  // Positive momentum — leads with high_intent OR positive_sentiment
  const positiveLeadIds = [
    ...new Set([
      ...(grouped["high_intent"] ?? []),
      ...(grouped["positive_sentiment"] ?? []),
    ]
      .map((t) => t.lead_id)
      .filter(Boolean)),
  ] as string[];

  // Sentiment totals
  const positiveCount = (grouped["positive_sentiment"] ?? []).length;
  const neutralCount = (grouped["neutral_sentiment"] ?? []).length;
  const negativeCount = (grouped["negative_sentiment"] ?? []).length;
  const totalSentiment = positiveCount + neutralCount + negativeCount;

  const hasAnyData = tags.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 lg:px-10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-card">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Semantic Signals
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Understand objections, buyer intent and emotional patterns across your pipeline.
          </p>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Sparkles className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No signals detected yet.</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Add notes, quick notes and lost reasons to your leads — AI will extract objections, intent and sentiment automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {objections.length > 0 && (
            <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Top Objections</h2>
                  <p className="text-xs text-muted-foreground">Buyer resistance patterns by volume.</p>
                </div>
              </div>
              <div>
                {objections.map(({ tag, items }) => (
                  <TagRow
                    key={tag}
                    tag={tag}
                    count={items.length}
                    leads={items
                      .map((t) => (t.lead_id ? leadMap.get(t.lead_id) ?? "" : ""))
                      .filter(Boolean)}
                  />
                ))}
              </div>
            </section>
          )}

          {intents.length > 0 && (
            <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Buyer Intent Signals</h2>
                  <p className="text-xs text-muted-foreground">Commercial readiness across active leads.</p>
                </div>
              </div>
              <div>
                {intents.map(({ tag, items }) => (
                  <TagRow
                    key={tag}
                    tag={tag}
                    count={items.length}
                    leads={items
                      .map((t) => (t.lead_id ? leadMap.get(t.lead_id) ?? "" : ""))
                      .filter(Boolean)}
                  />
                ))}
              </div>
            </section>
          )}

          {ghostingLeadIds.length > 0 && (
            <section className="space-y-4 rounded-xl border border-red-200/70 bg-red-50/20 p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
              <div className="flex items-center gap-2">
                <Ghost className="h-4 w-4 text-red-600" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Ghosting Risks</h2>
                  <p className="text-xs text-muted-foreground">Leads showing inactivity or disengagement.</p>
                </div>
                <span className="ml-auto rounded-md border border-red-200/80 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  {ghostingLeadIds.length} lead{ghostingLeadIds.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ghostingLeadIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-md border border-red-200/80 bg-white/70 px-2.5 py-1 text-xs text-red-700"
                  >
                    {leadMap.get(id) ?? id}
                  </span>
                ))}
              </div>
            </section>
          )}

          {positiveLeadIds.length > 0 && (
            <section className="space-y-4 rounded-xl border border-emerald-200/70 bg-emerald-50/20 p-5 shadow-card transition-all duration-200 hover:shadow-card-hover">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Positive Momentum</h2>
                  <p className="text-xs text-muted-foreground">High-intent or positive-sentiment signals.</p>
                </div>
                <span className="ml-auto rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {positiveLeadIds.length} lead{positiveLeadIds.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {positiveLeadIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-md border border-emerald-200/80 bg-white/70 px-2.5 py-1 text-xs text-emerald-700"
                  >
                    {leadMap.get(id) ?? id}
                  </span>
                ))}
              </div>
            </section>
          )}

          {totalSentiment > 0 && (
            <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card sm:col-span-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Sentiment Breakdown</h2>
                <p className="text-xs text-muted-foreground">A minimal read on relationship tone across logged notes.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  {positiveCount > 0 && (
                    <div
                      className="h-full bg-primary/55"
                      style={{ width: `${(positiveCount / totalSentiment) * 100}%` }}
                    />
                  )}
                  {neutralCount > 0 && (
                    <div
                      className="h-full bg-slate-300"
                      style={{ width: `${(neutralCount / totalSentiment) * 100}%` }}
                    />
                  )}
                  {negativeCount > 0 && (
                    <div
                      className="h-full bg-red-300"
                      style={{ width: `${(negativeCount / totalSentiment) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                {[
                  { label: "Positive", count: positiveCount, dot: "bg-primary/55" },
                  { label: "Neutral", count: neutralCount, dot: "bg-slate-300" },
                  { label: "Negative", count: negativeCount, dot: "bg-red-300" },
                ]
                  .filter((s) => s.count > 0)
                  .map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      <span className="text-xs text-muted-foreground">
                        {s.label}{" "}
                        <span className="font-medium text-foreground">{s.count}</span>
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
