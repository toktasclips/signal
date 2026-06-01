import type { Lead, Task, Campaign, Insight } from "@/types";
import { createClient } from "@/lib/supabase/server";

export interface ComputedInsight {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "success";
  metadata: Record<string, unknown>;
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const SEVERITY_ORDER = { critical: 0, warning: 1, success: 2, info: 3 };

export function computeInsights(
  leads: Lead[],
  tasks: Task[],
  campaigns: Campaign[]
): ComputedInsight[] {
  const results: ComputedInsight[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Rule: Overdue follow-ups
  const overdueFollowUps = leads.filter(
    (l) => l.is_hot && l.follow_up_date && new Date(l.follow_up_date) < today
  );
  if (overdueFollowUps.length > 0) {
    const n = overdueFollowUps.length;
    results.push({
      type: "overdue_followup",
      title: `${n} hot lead${n > 1 ? "s" : ""} overdue for follow-up`,
      description:
        n === 1
          ? `${overdueFollowUps[0].name} was scheduled for follow-up and hasn't been contacted.`
          : `${n} leads on your hot list have passed their follow-up dates. Each day of delay reduces conversion.`,
      severity: n >= 3 ? "critical" : "warning",
      metadata: {
        count: n,
        lead_ids: overdueFollowUps.map((l) => l.id),
        cta: { label: "View Hot List", href: "/hot-list" },
      },
    });
  }

  // Rule: Overdue tasks
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now
  );
  if (overdueTasks.length > 0) {
    const n = overdueTasks.length;
    results.push({
      type: "overdue_tasks",
      title: `${n} overdue task${n > 1 ? "s" : ""} slowing your rhythm`,
      description:
        n > 5
          ? `You have ${n} overdue tasks. This backlog is likely affecting your sales focus and momentum.`
          : `${n} task${n > 1 ? "s are" : " is"} past due. Clear the backlog to keep deals moving.`,
      severity: n > 5 ? "critical" : "warning",
      metadata: { count: n, cta: { label: "View Tasks", href: "/tasks" } },
    });
  }

  // Rule: Pipeline bottleneck (qualified >> offer_sent)
  const qualifiedLeads = leads.filter((l) => l.status === "qualified");
  const offerSentLeads = leads.filter((l) => l.status === "offer_sent");
  if (
    qualifiedLeads.length >= 3 &&
    qualifiedLeads.length > offerSentLeads.length * 2
  ) {
    results.push({
      type: "pipeline_bottleneck",
      title: "Bottleneck between Qualified and Offer Sent",
      description: `${qualifiedLeads.length} leads are qualified but only ${offerSentLeads.length} have received a proposal. Accelerate your offer process to move deals forward.`,
      severity: "warning",
      metadata: {
        qualified: qualifiedLeads.length,
        offer_sent: offerSentLeads.length,
        cta: { label: "View Pipeline", href: "/pipeline" },
      },
    });
  }

  // Rule: Top campaign (success)
  const campaignsWithRevenue = campaigns
    .map((c) => {
      const wonLeads = leads.filter(
        (l) => l.campaign_id === c.id && l.status === "won"
      );
      return {
        ...c,
        wonRevenue: wonLeads.reduce((s, l) => s + (l.value ?? 0), 0),
        wonCount: wonLeads.length,
      };
    })
    .filter((c) => c.wonRevenue > 0)
    .sort((a, b) => b.wonRevenue - a.wonRevenue);

  if (campaignsWithRevenue.length > 0) {
    const top = campaignsWithRevenue[0];
    results.push({
      type: "top_campaign",
      title: `"${top.name}" is your top-performing campaign`,
      description: `This campaign has generated ${fmt(top.wonRevenue)} in won revenue from ${top.wonCount} deal${top.wonCount > 1 ? "s" : ""}. Consider doubling down on this channel.`,
      severity: "success",
      metadata: {
        campaign_id: top.id,
        revenue: top.wonRevenue,
        cta: { label: "View Campaigns", href: "/campaigns" },
      },
    });
  }

  // Rule: Revenue slowdown — no wins in 14 days (but user has prior wins)
  const recentWins = leads.filter(
    (l) =>
      l.status === "won" &&
      l.closed_at &&
      new Date(l.closed_at) > fourteenDaysAgo
  );
  const totalWons = leads.filter((l) => l.status === "won");
  if (recentWins.length === 0 && totalWons.length > 0) {
    results.push({
      type: "revenue_slowdown",
      title: "No closed deals in the last 14 days",
      description:
        "Revenue momentum has slowed. Review your qualified leads and outstanding proposals to identify opportunities ready to close.",
      severity: "warning",
      metadata: { cta: { label: "View Pipeline", href: "/pipeline" } },
    });
  }

  // Rule: High conversion source (info)
  const sourceStats: Record<string, { total: number; won: number }> = {};
  leads.forEach((l) => {
    if (!l.source) return;
    sourceStats[l.source] ??= { total: 0, won: 0 };
    sourceStats[l.source].total++;
    if (l.status === "won") sourceStats[l.source].won++;
  });

  const bestSource = Object.entries(sourceStats)
    .filter(([, s]) => s.total >= 3 && s.won / s.total >= 0.3)
    .sort(([, a], [, b]) => b.won / b.total - a.won / a.total)[0];

  if (bestSource) {
    const [source, stats] = bestSource;
    const rate = Math.round((stats.won / stats.total) * 100);
    results.push({
      type: "high_conversion_source",
      title: `"${source}" leads convert at ${rate}%`,
      description: `Your ${source} channel shows strong results — ${stats.won} of ${stats.total} leads have closed. Consider increasing investment in this source.`,
      severity: "info",
      metadata: { source, rate, won: stats.won, total: stats.total },
    });
  }

  // Rule: Stale hot leads (hot + no activity in 7 days)
  const staleHotLeads = leads.filter(
    (l) => l.is_hot && new Date(l.updated_at) < sevenDaysAgo
  );
  if (staleHotLeads.length > 0) {
    const n = staleHotLeads.length;
    results.push({
      type: "stale_hot_lead",
      title: `${n} hot lead${n > 1 ? "s haven't" : " hasn't"} been touched in 7+ days`,
      description:
        n === 1
          ? `${staleHotLeads[0].name} is on your hot list but has had no recent activity. Hot leads need consistent engagement.`
          : `${n} hot leads are going cold without attention. Consistent engagement is key to conversion.`,
      severity: "warning",
      metadata: {
        count: n,
        lead_ids: staleHotLeads.map((l) => l.id),
        cta: { label: "View Hot List", href: "/hot-list" },
      },
    });
  }

  results.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  return results;
}

export async function syncInsights(
  userId: string,
  computed: ComputedInsight[]
): Promise<Insight[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("insights")
    .select("type, is_read, is_dismissed")
    .eq("user_id", userId);

  const existingMap = new Map(existing?.map((i) => [i.type, i]) ?? []);
  const activeTypes = new Set(computed.map((i) => i.type));

  // Remove stale insights whose conditions no longer apply (single batch delete)
  const staleTypes = [...existingMap.keys()].filter((t) => !activeTypes.has(t));
  if (staleTypes.length > 0) {
    await supabase
      .from("insights")
      .delete()
      .eq("user_id", userId)
      .in("type", staleTypes);
  }

  // Upsert active insights, preserving is_read and skipping dismissed
  const toUpsert = computed
    .filter((i) => !existingMap.get(i.type)?.is_dismissed)
    .map((i) => ({
      user_id: userId,
      type: i.type,
      title: i.title,
      description: i.description,
      severity: i.severity,
      metadata: i.metadata,
      is_read: existingMap.get(i.type)?.is_read ?? false,
      is_dismissed: false,
    }));

  if (toUpsert.length > 0) {
    await supabase
      .from("insights")
      .upsert(toUpsert, { onConflict: "user_id,type" });
  }

  const { data } = await supabase
    .from("insights")
    .select("*")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false });

  return ((data ?? []) as Insight[]).sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity as keyof typeof SEVERITY_ORDER] -
      SEVERITY_ORDER[b.severity as keyof typeof SEVERITY_ORDER]
  );
}
