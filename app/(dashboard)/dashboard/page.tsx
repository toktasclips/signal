import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { computeInsights, syncInsights } from "@/lib/insights/engine";
import { IntelligenceFeed } from "@/components/insights/intelligence-feed";
import { PriorityActions } from "@/components/insights/priority-actions";
import { TodayHotLeads } from "@/components/dashboard/today-hot-leads";
import { PipelineSnapshot } from "@/components/dashboard/pipeline-snapshot";
import { TopCampaigns } from "@/components/dashboard/top-campaigns";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import type { Insight, Lead, LeadStatus, Task, Campaign } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

const OPEN_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "offer_sent"];
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Single round-trip: fetch everything in parallel
  const [leadsRes, tasksRes, campaignsRes, contextRes, insightsRes] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", user.id),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "completed"),
    supabase.from("campaigns").select("*").eq("user_id", user.id),
    supabase.from("business_context").select("id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_dismissed", false)
      .order("created_at", { ascending: false }),
  ]);

  const allLeads = (leadsRes.data ?? []) as Lead[];
  const hasContext = !!contextRes.data;
  const allTasks = (tasksRes.data ?? []) as Task[];
  const allCampaigns = (campaignsRes.data ?? []) as Campaign[];
  const insights = (insightsRes.data ?? []) as Insight[];

  // Sync insights in background — doesn't block render
  const computed = computeInsights(allLeads, allTasks, allCampaigns);
  syncInsights(user.id, computed).catch(() => {});

  // Derived data for existing widgets
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();

  const todayHotLeads = allLeads
    .filter((l) => l.is_hot)
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (a.follow_up_date ?? "").localeCompare(b.follow_up_date ?? "")
    )
    .slice(0, 5);

  const todayTasks = allTasks
    .filter((t) => t.due_date && t.due_date <= todayStart)
    .sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    )
    .slice(0, 5);

  const openValue = allLeads
    .filter((l) => OPEN_STATUSES.includes(l.status))
    .reduce((s, l) => s + (l.value ?? 0), 0);

  const wonRevenue = allLeads
    .filter((l) => l.status === "won")
    .reduce((s, l) => s + (l.value ?? 0), 0);

  const openOpportunities = allLeads.filter((l) =>
    OPEN_STATUSES.includes(l.status)
  ).length;

  const topCampaigns = allCampaigns
    .map((c) => {
      const wonLeads = allLeads.filter(
        (l) => l.campaign_id === c.id && l.status === "won"
      );
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        wonRevenue: wonLeads.reduce((s, l) => s + (l.value ?? 0), 0),
        leadCount: wonLeads.length,
      };
    })
    .sort((a, b) => b.wonRevenue - a.wonRevenue)
    .slice(0, 3);

  const firstName =
    (user.user_metadata?.full_name as string)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-6 py-8 lg:px-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what needs your attention today.
        </p>
      </div>

      {/* Intelligence Feed */}
      <IntelligenceFeed insights={insights} />

      {/* Business Context prompt */}
      {!hasContext && (
        <Link
          href="/context"
          className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3.5 hover:bg-muted/40 transition-colors group"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Complete your Business Context
            </p>
            <p className="text-xs text-muted-foreground">
              Help Signal understand your business to generate smarter insights.
            </p>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">Set up →</span>
        </Link>
      )}

      {/* Priority Actions */}
      <PriorityActions leads={allLeads} tasks={allTasks} />

      {/* Pipeline Snapshot */}
      <PipelineSnapshot
        openValue={openValue}
        wonRevenue={wonRevenue}
        openOpportunities={openOpportunities}
      />

      {/* Hot Leads + Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayHotLeads leads={todayHotLeads} />
        <TodayTasks tasks={todayTasks} />
      </div>

      {/* Top Campaigns */}
      <TopCampaigns campaigns={topCampaigns} />
    </div>
  );
}
