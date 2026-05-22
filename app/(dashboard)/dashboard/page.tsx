import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TodayHotLeads } from "@/components/dashboard/today-hot-leads";
import { PipelineSnapshot } from "@/components/dashboard/pipeline-snapshot";
import type { Lead, LeadStatus } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

const OPEN_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "offer_sent"];

const overviewModules = [
  {
    icon: CalendarDays,
    label: "Calendar",
    description: "Schedule follow-ups and keep track of key touchpoints.",
    status: "Coming soon",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: todayHotLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_hot", true)
    .order("priority", { ascending: false })
    .order("follow_up_date", { ascending: true, nullsFirst: false })
    .limit(5);

  const { data: pipelineLeads } = await supabase
    .from("leads")
    .select("status, value")
    .eq("user_id", user.id);

  const pl = (pipelineLeads ?? []) as { status: LeadStatus; value: number | null }[];
  const openValue = pl
    .filter((l) => OPEN_STATUSES.includes(l.status))
    .reduce((sum, l) => sum + (l.value ?? 0), 0);
  const wonRevenue = pl
    .filter((l) => l.status === "won")
    .reduce((sum, l) => sum + (l.value ?? 0), 0);
  const openOpportunities = pl.filter((l) => OPEN_STATUSES.includes(l.status)).length;

  const firstName =
    (user.user_metadata?.full_name as string)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const hour = new Date().getHours();
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

      {/* Today's Hot Leads widget */}
      <TodayHotLeads leads={(todayHotLeads as Lead[]) ?? []} />

      {/* Pipeline Snapshot */}
      <PipelineSnapshot
        openValue={openValue}
        wonRevenue={wonRevenue}
        openOpportunities={openOpportunities}
      />

      {/* Modules grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Coming soon</h2>
          <Badge variant="secondary" className="text-[11px]">
            Roadmap
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {overviewModules.map((mod) => (
            <Card key={mod.label} className="group card-hover cursor-default overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 transition-colors group-hover:bg-primary/12">
                    <mod.icon className="text-primary" style={{ height: "1.125rem", width: "1.125rem" }} />
                  </div>
                  <span className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                    {mod.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="mb-1.5">{mod.label}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {mod.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Recent activity</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-4">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No activity yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Once you start adding leads and moving deals, your activity will appear here.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
