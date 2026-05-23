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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

  const [
    { data: leads },
    { data: events },
    { data: tasks },
    { data: campaigns },
    { data: rawInsights },
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
    allCampaigns
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
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
          <BrainCircuit className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Relationship Intelligence
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Discover patterns, bottlenecks and revenue opportunities across your
            operating system.
          </p>
        </div>
      </div>

      {/* Insight feed */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Insights
        </h2>
        <RelationshipFeed insights={insights} />
      </section>

      {/* Lead Health */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Lead Health
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Activity-based health score across all active leads.
          </p>
        </div>
        <LeadHealthSection results={leadHealth} />
      </section>

      {/* Pipeline Velocity */}
      {velocity && (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pipeline Velocity
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How fast deals move through your pipeline.
            </p>
          </div>
          <PipelineVelocitySection velocity={velocity} />
        </section>
      )}

      {/* Campaign Performance */}
      {campaignStats.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Campaign Performance
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Revenue and close rate comparison across all campaigns.
            </p>
          </div>
          <CampaignIntelSection campaigns={campaignStats} />
        </section>
      )}
    </div>
  );
}
