import { BrainCircuit } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  computeRelationshipInsights,
  syncRelationshipInsights,
  computeLeadHealth,
  computePipelineVelocity,
  computeCampaignIntelligence,
} from "@/lib/intelligence/engine";
import { RelationshipFeed } from "@/components/intelligence/relationship-feed";
import { LeadHealthSection } from "@/components/intelligence/lead-health-section";
import { PipelineVelocitySection } from "@/components/intelligence/pipeline-velocity-section";
import { CampaignIntelSection } from "@/components/intelligence/campaign-intel-section";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  const [
    { data: leads },
    { data: events },
    { data: tasks },
    { data: campaigns },
    { data: rawInsights },
    { data: semanticTagsData },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", ninetyDaysAgo)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("relationship_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("semantic_tags")
      .select("*")
      .eq("user_id", user.id),
  ]);

  const allLeads = leads ?? [];
  const allEvents = events ?? [];
  const allTasks = tasks ?? [];
  const allCampaigns = campaigns ?? [];

  // Compute + sync insights (fire-and-forget, don't block render)
  const computed = computeRelationshipInsights(
    allLeads,
    allEvents,
    allTasks,
    allCampaigns,
    semanticTagsData ?? []
  );
  syncRelationshipInsights(user.id, computed).catch(() => {});

  // Merge freshly computed with existing DB rows so new ones appear immediately
  const existingById = new Map((rawInsights ?? []).map((i) => [i.type, i]));
  const merged = computed
    .map((c) => existingById.get(c.type) ?? null)
    .filter(Boolean) as NonNullable<(typeof rawInsights)>[number][];

  // For truly new insights not yet in DB, show them optimistically
  const existingTypes = new Set((rawInsights ?? []).map((i) => i.type));
  const optimistic = computed
    .filter((c) => !existingTypes.has(c.type))
    .map((c) => ({
      id: `opt-${c.type}`,
      user_id: user.id,
      type: c.type,
      title: c.title,
      description: c.description,
      recommendation: c.recommendation ?? null,
      severity: c.severity,
      is_read: false,
      is_dismissed: false,
      related_lead_id: c.relatedLeadId ?? null,
      related_campaign_id: c.relatedCampaignId ?? null,
      metadata: c.metadata,
      created_at: new Date().toISOString(),
    }));

  const insights = [...optimistic, ...merged];

  // Compute analytics sections
  const leadHealth = computeLeadHealth(allLeads, allEvents);
  const velocity = computePipelineVelocity(allLeads);
  const campaignStats = computeCampaignIntelligence(allCampaigns, allLeads);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 lg:px-10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-card">
          <BrainCircuit className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Relationship Intelligence
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Discover patterns, bottlenecks and revenue opportunities across your
            operating system.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeader
          title="Executive Insights"
          description="Priority signals distilled from pipeline activity, campaign performance and relationship momentum."
        />
        <RelationshipFeed insights={insights} />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Lead Health"
          description="Activity-based health score across all active leads."
        />
        <LeadHealthSection results={leadHealth} />
      </section>

      {velocity && (
        <section className="space-y-4">
          <SectionHeader
            title="Momentum Analysis"
            description="A clean operating view of how quickly revenue is converting."
          />
          <PipelineVelocitySection velocity={velocity} />
        </section>
      )}

      {campaignStats.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Campaign Performance"
            description="Revenue and close rate comparison across all campaigns."
          />
          <CampaignIntelSection campaigns={campaignStats} />
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
