import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrendingUp, BadgeCheck, Target, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PipelineHeaderActions } from "@/components/pipeline/pipeline-header-actions";
import { formatValueTL } from "@/lib/lead-utils";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";

export const metadata: Metadata = {
  title: "Pipeline",
};

const OPEN_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
];

export default async function PipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allLeads = (leads as Lead[]) ?? [];

  const openLeads = allLeads.filter((l) => OPEN_STATUSES.includes(l.status));
  const wonLeads = allLeads.filter((l) => l.status === "won");
  const lostLeads = allLeads.filter((l) => l.status === "lost");

  const openPipelineValue = openLeads.reduce(
    (sum, l) => sum + (l.value ?? 0),
    0
  );
  const wonRevenue = wonLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const openOpportunities = openLeads.length;
  const closeRate =
    wonLeads.length + lostLeads.length > 0
      ? Math.round(
          (wonLeads.length / (wonLeads.length + lostLeads.length)) * 100
        )
      : null;

  return (
    <div className="px-6 py-8 lg:px-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">
            Track every opportunity from first contact to closed sale.
          </p>
        </div>
        <PipelineHeaderActions />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          iconClass="text-primary"
          iconBg="bg-primary/8"
          label="Open Pipeline"
          value={openPipelineValue > 0 ? formatValueTL(openPipelineValue) : "—"}
          description={`${openOpportunities} active deal${openOpportunities !== 1 ? "s" : ""}`}
        />
        <MetricCard
          icon={BadgeCheck}
          iconClass="text-emerald-600"
          iconBg="bg-emerald-50"
          label="Won Revenue"
          value={wonRevenue > 0 ? formatValueTL(wonRevenue) : "—"}
          description={`${wonLeads.length} deal${wonLeads.length !== 1 ? "s" : ""} closed`}
        />
        <MetricCard
          icon={Target}
          iconClass="text-blue-600"
          iconBg="bg-blue-50"
          label="Open Opportunities"
          value={String(openOpportunities)}
          description="Across all active stages"
        />
        <MetricCard
          icon={BarChart3}
          iconClass="text-amber-600"
          iconBg="bg-amber-50"
          label="Close Rate"
          value={closeRate !== null ? `${closeRate}%` : "—"}
          description={
            wonLeads.length + lostLeads.length > 0
              ? `${wonLeads.length} won / ${lostLeads.length} lost`
              : "No closed deals yet"
          }
        />
      </div>

      {/* Board */}
      {allLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border bg-muted/20">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Your sales pipeline is ready.
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Add leads and move them through your sales process.
          </p>
        </div>
      ) : (
        <PipelineBoard leads={allLeads} />
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
  label: string;
  value: string;
  description?: string;
}

function MetricCard({
  icon: Icon,
  iconClass,
  iconBg,
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          iconBg
        )}
      >
        <Icon className={cn("h-4 w-4", iconClass)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
          {value}
        </p>
        <p className="text-xs font-medium text-foreground/70 mt-0.5">{label}</p>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
