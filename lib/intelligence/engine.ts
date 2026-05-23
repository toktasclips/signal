import { createClient } from "@/lib/supabase/server";
import type {
  Lead,
  Task,
  Campaign,
  SalesEvent,
  RelationshipInsight,
  LeadHealthResult,
  LeadHealthStatus,
  PipelineVelocity,
  CampaignStat,
} from "@/types";

// ─── Computed insight shape (before DB) ──────────────────────────────────────

interface ComputedRelInsight {
  type: string;
  title: string;
  description: string;
  recommendation: string;
  severity: "info" | "warning" | "critical" | "success";
  relatedLeadId?: string | null;
  relatedCampaignId?: string | null;
  metadata: Record<string, unknown>;
}

const SEVERITY_ORDER = { critical: 0, warning: 1, success: 2, info: 3 };

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Rules ───────────────────────────────────────────────────────────────────

function ruleStaleHotLead(
  leads: Lead[],
  events: SalesEvent[]
): ComputedRelInsight | null {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const stale = leads
    .filter((l) => l.is_hot && !["won", "lost"].includes(l.status))
    .filter((l) => {
      const leadEvents = events.filter((e) => e.lead_id === l.id);
      const lastTs =
        leadEvents.length > 0
          ? Math.max(...leadEvents.map((e) => new Date(e.created_at).getTime()))
          : new Date(l.updated_at).getTime();
      return lastTs < sevenDaysAgo.getTime();
    });

  if (stale.length === 0) return null;
  const n = stale.length;

  return {
    type: "stale_hot_lead",
    title: `${n} hot lead${n > 1 ? "s" : ""} going cold`,
    description: `${n} lead${n > 1 ? "s" : ""} on your hot list ha${n > 1 ? "ve" : "s"} had no activity in 7+ days. Hot leads lose interest fast without consistent engagement.`,
    recommendation: "Schedule a touchpoint with each lead this week — even a short check-in resets the clock.",
    severity: n >= 3 ? "critical" : "warning",
    relatedLeadId: stale[0].id,
    metadata: { count: n, lead_ids: stale.map((l) => l.id) },
  };
}

function ruleOverduePriorityLead(
  leads: Lead[],
  events: SalesEvent[]
): ComputedRelInsight | null {
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
  const priority = leads.filter(
    (l) =>
      (l.priority === "urgent" || l.priority === "high") &&
      !["won", "lost"].includes(l.status)
  );
  const overdue = priority.filter((l) => {
    const leadEvents = events.filter((e) => e.lead_id === l.id);
    const lastTs =
      leadEvents.length > 0
        ? Math.max(...leadEvents.map((e) => new Date(e.created_at).getTime()))
        : new Date(l.created_at).getTime();
    return lastTs < fiveDaysAgo.getTime();
  });

  if (overdue.length === 0) return null;
  const n = overdue.length;
  const top = overdue.sort((a) => (a.priority === "urgent" ? -1 : 1))[0];

  return {
    type: "overdue_priority_lead",
    title: `${n} high-priority lead${n > 1 ? "s" : ""} waiting on action`,
    description: `${n} urgent or high-priority lead${n > 1 ? "s have" : " has"} had no recorded activity in 5+ days. Delayed action on priority leads reduces close probability.`,
    recommendation: "Contact these leads immediately — high-priority leads have shorter patience windows.",
    severity: "critical",
    relatedLeadId: top.id,
    metadata: { count: n, lead_ids: overdue.map((l) => l.id) },
  };
}

function rulePipelineBottleneck(leads: Lead[]): ComputedRelInsight | null {
  const qualified = leads.filter((l) => l.status === "qualified");
  const offerSent = leads.filter((l) => l.status === "offer_sent");

  if (qualified.length < 3 || qualified.length <= offerSent.length * 2)
    return null;

  return {
    type: "pipeline_bottleneck",
    title: "Pipeline is backing up at Qualified stage",
    description: `${qualified.length} leads are qualified but only ${offerSent.length} have received a proposal. Deals sitting too long in Qualified rarely close.`,
    recommendation: "Review each qualified lead and determine which are ready to receive an offer this week.",
    severity: "warning",
    metadata: { qualified: qualified.length, offer_sent: offerSent.length },
  };
}

function ruleHighPerformingCampaign(
  campaigns: Campaign[],
  leads: Lead[]
): ComputedRelInsight | null {
  const stats = campaigns
    .map((c) => {
      const cl = leads.filter((l) => l.campaign_id === c.id);
      const won = cl.filter((l) => l.status === "won");
      return {
        ...c,
        closeRate: cl.length >= 3 ? won.length / cl.length : 0,
        wonCount: won.length,
        totalLeads: cl.length,
        revenue: won.reduce((s, l) => s + (l.value ?? 0), 0),
      };
    })
    .filter((c) => c.totalLeads >= 3 && c.closeRate > 0)
    .sort((a, b) => b.closeRate - a.closeRate);

  if (stats.length === 0) return null;
  const top = stats[0];
  const rate = Math.round(top.closeRate * 100);

  return {
    type: "high_performing_campaign",
    title: `"${top.name}" is your highest-converting campaign at ${rate}%`,
    description: `This campaign closes ${top.wonCount} of ${top.totalLeads} leads — significantly outperforming your other channels.`,
    recommendation: "Increase investment in this channel. Replicate its targeting and messaging in lower-performing campaigns.",
    severity: "success",
    relatedCampaignId: top.id,
    metadata: {
      campaign_id: top.id,
      close_rate: top.closeRate,
      revenue: top.revenue,
    },
  };
}

function ruleHighValueStuckLead(leads: Lead[]): ComputedRelInsight | null {
  const wonLeads = leads.filter((l) => l.status === "won" && l.value);
  const avgValue =
    wonLeads.length > 0
      ? wonLeads.reduce((s, l) => s + (l.value ?? 0), 0) / wonLeads.length
      : 0;

  const threshold = Math.max(avgValue * 1.5, 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);

  const stuck = leads.filter(
    (l) =>
      (l.value ?? 0) >= threshold &&
      ["qualified", "offer_sent"].includes(l.status) &&
      new Date(l.updated_at) < fourteenDaysAgo
  );

  if (stuck.length === 0) return null;

  const totalValue = stuck.reduce((s, l) => s + (l.value ?? 0), 0);
  const topLead = [...stuck].sort(
    (a, b) => (b.value ?? 0) - (a.value ?? 0)
  )[0];
  const n = stuck.length;

  return {
    type: "high_value_stuck_lead",
    title: `${fmt(totalValue)} in high-value deals stalled`,
    description: `${n} deal${n > 1 ? "s" : ""} worth ${fmt(totalValue)} ha${n > 1 ? "ve" : "s"} been stuck in the pipeline for 14+ days. High-value deals require active management.`,
    recommendation: "Prioritize these deals immediately — schedule calls, send follow-ups, or identify blockers.",
    severity: "critical",
    relatedLeadId: topLead.id,
    metadata: {
      count: n,
      total_value: totalValue,
      lead_ids: stuck.map((l) => l.id),
    },
  };
}

function ruleFastClosingSource(leads: Lead[]): ComputedRelInsight | null {
  const wonLeads = leads.filter((l) => l.status === "won" && l.closed_at && l.source);
  if (wonLeads.length < 4) return null;

  const bySource: Record<string, number[]> = {};
  wonLeads.forEach((l) => {
    if (!l.source) return;
    bySource[l.source] ??= [];
    bySource[l.source].push(
      (new Date(l.closed_at!).getTime() - new Date(l.created_at).getTime()) /
        86400000
    );
  });

  const withStats = Object.entries(bySource)
    .filter(([, days]) => days.length >= 2)
    .map(([source, days]) => ({
      source,
      avgDays: days.reduce((a, b) => a + b, 0) / days.length,
      count: days.length,
    }));

  if (withStats.length < 2) return null;

  const overallAvg =
    wonLeads.reduce(
      (s, l) =>
        s +
        (new Date(l.closed_at!).getTime() - new Date(l.created_at).getTime()) /
          86400000,
      0
    ) / wonLeads.length;

  const fastest = withStats.sort((a, b) => a.avgDays - b.avgDays)[0];
  const diff = Math.round(overallAvg - fastest.avgDays);
  if (diff <= 0) return null;

  return {
    type: "fast_closing_source",
    title: `"${fastest.source}" leads close ${diff} days faster than average`,
    description: `Leads from ${fastest.source} close in ~${Math.round(fastest.avgDays)} days vs. ${Math.round(overallAvg)} days overall. This channel has exceptional velocity.`,
    recommendation: "Prioritize this acquisition channel — faster-closing leads improve cash flow and sales momentum.",
    severity: "success",
    metadata: {
      source: fastest.source,
      avg_days: Math.round(fastest.avgDays),
      overall_avg: Math.round(overallAvg),
    },
  };
}

function ruleFollowupGap(leads: Lead[]): ComputedRelInsight | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = leads.filter(
    (l) =>
      l.is_hot &&
      l.follow_up_date &&
      new Date(l.follow_up_date) < today &&
      !["won", "lost"].includes(l.status)
  );

  if (overdue.length < 2) return null;

  const avgDaysOverdue = Math.round(
    overdue.reduce((s, l) => {
      return (
        s +
        (today.getTime() - new Date(l.follow_up_date!).getTime()) / 86400000
      );
    }, 0) / overdue.length
  );

  const n = overdue.length;
  const worst = [...overdue].sort(
    (a, b) =>
      new Date(a.follow_up_date!).getTime() -
      new Date(b.follow_up_date!).getTime()
  )[0];

  return {
    type: "followup_gap",
    title: `${n} follow-ups overdue by ${avgDaysOverdue}+ days on average`,
    description: `Your hot list has ${n} contacts waiting on follow-up. A consistent follow-up gap signals a breakdown in your sales rhythm.`,
    recommendation: "Block 30 minutes today to contact each overdue lead. Even a brief message maintains the relationship.",
    severity: n >= 4 ? "critical" : "warning",
    relatedLeadId: worst.id,
    metadata: { count: n, avg_days_overdue: avgDaysOverdue },
  };
}

function ruleInactivePipeline(
  leads: Lead[],
  events: SalesEvent[]
): ComputedRelInsight | null {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
  const openLeads = leads.filter(
    (l) => !["won", "lost"].includes(l.status)
  );
  if (openLeads.length === 0) return null;

  const recentLeads = leads.filter(
    (l) => new Date(l.created_at) > fourteenDaysAgo
  );
  const recentMoves = events.filter(
    (e) =>
      e.type === "lead_moved_stage" &&
      new Date(e.created_at) > fourteenDaysAgo
  );

  if (recentLeads.length > 0 || recentMoves.length > 0) return null;

  return {
    type: "inactive_pipeline",
    title: "No pipeline movement in 14 days",
    description: `No new leads added and no stage transitions recorded in the last 14 days. A static pipeline is a declining pipeline.`,
    recommendation: "Add at least one new lead and push one existing deal to the next stage today.",
    severity: "warning",
    metadata: { open_leads: openLeads.length },
  };
}

// ─── Main compute function ────────────────────────────────────────────────────

export function computeRelationshipInsights(
  leads: Lead[],
  events: SalesEvent[],
  _tasks: Task[],
  campaigns: Campaign[]
): ComputedRelInsight[] {
  const rules = [
    ruleOverduePriorityLead(leads, events),
    ruleHighValueStuckLead(leads),
    ruleFollowupGap(leads),
    ruleStaleHotLead(leads, events),
    rulePipelineBottleneck(leads),
    ruleInactivePipeline(leads, events),
    ruleHighPerformingCampaign(campaigns, leads),
    ruleFastClosingSource(leads),
  ].filter(Boolean) as ComputedRelInsight[];

  return rules.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

// ─── DB sync ─────────────────────────────────────────────────────────────────

export async function syncRelationshipInsights(
  userId: string,
  computed: ComputedRelInsight[]
): Promise<RelationshipInsight[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("relationship_insights")
    .select("type, is_read, is_dismissed")
    .eq("user_id", userId);

  const existingMap = new Map(existing?.map((i) => [i.type, i]) ?? []);
  const activeTypes = new Set(computed.map((i) => i.type));

  // Remove stale
  for (const [type] of existingMap) {
    if (!activeTypes.has(type)) {
      await supabase
        .from("relationship_insights")
        .delete()
        .eq("user_id", userId)
        .eq("type", type);
    }
  }

  // Upsert active (skip dismissed)
  const toUpsert = computed
    .filter((i) => !existingMap.get(i.type)?.is_dismissed)
    .map((i) => ({
      user_id: userId,
      type: i.type,
      title: i.title,
      description: i.description,
      recommendation: i.recommendation,
      severity: i.severity,
      related_lead_id: i.relatedLeadId ?? null,
      related_campaign_id: i.relatedCampaignId ?? null,
      metadata: i.metadata,
      is_read: existingMap.get(i.type)?.is_read ?? false,
      is_dismissed: false,
    }));

  if (toUpsert.length > 0) {
    await supabase
      .from("relationship_insights")
      .upsert(toUpsert, { onConflict: "user_id,type" });
  }

  const { data } = await supabase
    .from("relationship_insights")
    .select("*")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false });

  return ((data ?? []) as RelationshipInsight[]).sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity as keyof typeof SEVERITY_ORDER] -
      SEVERITY_ORDER[b.severity as keyof typeof SEVERITY_ORDER]
  );
}

// ─── Lead Health ──────────────────────────────────────────────────────────────

export function computeLeadHealth(
  leads: Lead[],
  events: SalesEvent[]
): LeadHealthResult[] {
  const now = Date.now();
  const fiveDaysMs = 5 * 86400000;
  const sevenDaysMs = 7 * 86400000;
  const fourteenDaysMs = 14 * 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .map((lead) => {
      const leadEvents = events.filter((e) => e.lead_id === lead.id);
      const lastTs =
        leadEvents.length > 0
          ? Math.max(
              ...leadEvents.map((e) => new Date(e.created_at).getTime())
            )
          : new Date(lead.updated_at).getTime();

      const daysSinceActivity = Math.floor((now - lastTs) / 86400000);
      const factors: string[] = [];
      let score = 0;

      // Positive
      if (now - lastTs < fiveDaysMs) {
        score += 2;
        factors.push("Recent activity");
      }
      if (leadEvents.some(
          (e) =>
            e.type === "lead_moved_stage" &&
            now - new Date(e.created_at).getTime() < sevenDaysMs
        )) {
        score += 2;
        factors.push("Stage moved recently");
      }
      if (lead.status === "offer_sent") {
        score += 1;
        factors.push("Offer sent");
      }

      // Negative
      if (
        lead.is_hot &&
        lead.follow_up_date &&
        new Date(lead.follow_up_date) < today
      ) {
        score -= 3;
        factors.push("Overdue follow-up");
      }
      if (now - lastTs > fourteenDaysMs) {
        score -= 3;
        factors.push("14+ days inactive");
      } else if (now - lastTs > sevenDaysMs) {
        score -= 1;
        factors.push("7+ days inactive");
      }
      if (lead.priority === "urgent" && now - lastTs > fiveDaysMs) {
        score -= 2;
        factors.push("Urgent, no action");
      }

      let health: LeadHealthStatus;
      if (score >= 3) health = "high_momentum";
      else if (score >= 0) health = "healthy";
      else if (daysSinceActivity >= 14) health = "stale";
      else health = "at_risk";

      return { lead, health, daysSinceActivity, factors };
    })
    .sort((a, b) => {
      const order: Record<LeadHealthStatus, number> = {
        stale: 0,
        at_risk: 1,
        healthy: 2,
        high_momentum: 3,
      };
      return order[a.health] - order[b.health];
    });
}

// ─── Pipeline Velocity ────────────────────────────────────────────────────────

export function computePipelineVelocity(leads: Lead[]): PipelineVelocity | null {
  const wonLeads = leads.filter((l) => l.status === "won" && l.closed_at);
  if (wonLeads.length === 0) return null;

  const velocities = wonLeads.map((l) => ({
    name: l.name,
    days: Math.round(
      (new Date(l.closed_at!).getTime() - new Date(l.created_at).getTime()) /
        86400000
    ),
  }));

  const avgDays = Math.round(
    velocities.reduce((s, v) => s + v.days, 0) / velocities.length
  );
  const sorted = [...velocities].sort((a, b) => a.days - b.days);

  return {
    avgDays,
    totalWon: wonLeads.length,
    fastestLead: sorted[0] ?? null,
    slowestLead: sorted[sorted.length - 1] ?? null,
  };
}

// ─── Campaign Intelligence ────────────────────────────────────────────────────

export function computeCampaignIntelligence(
  campaigns: Campaign[],
  leads: Lead[]
): CampaignStat[] {
  return campaigns
    .map((c) => {
      const cl = leads.filter((l) => l.campaign_id === c.id);
      const won = cl.filter((l) => l.status === "won");
      const wonRevenue = won.reduce((s, l) => s + (l.value ?? 0), 0);
      const avgDealValue = won.length > 0 ? wonRevenue / won.length : 0;

      const velocities = won
        .filter((l) => l.closed_at)
        .map(
          (l) =>
            (new Date(l.closed_at!).getTime() -
              new Date(l.created_at).getTime()) /
            86400000
        );
      const avgVelocityDays =
        velocities.length > 0
          ? Math.round(
              velocities.reduce((a, b) => a + b, 0) / velocities.length
            )
          : null;

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        totalLeads: cl.length,
        wonCount: won.length,
        closeRate: cl.length > 0 ? won.length / cl.length : 0,
        wonRevenue,
        avgDealValue,
        avgVelocityDays,
      };
    })
    .filter((c) => c.totalLeads > 0)
    .sort((a, b) => b.wonRevenue - a.wonRevenue);
}
