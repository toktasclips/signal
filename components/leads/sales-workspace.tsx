"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  Flame,
  KanbanSquare,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LeadsClient } from "@/components/leads/leads-client";
import { HotListClient } from "@/components/hot-list/hot-list-client";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PipelineHeaderActions } from "@/components/pipeline/pipeline-header-actions";
import { formatValueTL } from "@/lib/lead-utils";
import { cn } from "@/lib/utils";
import type { Campaign, Lead, LeadStatus } from "@/types";

type SalesView = "leads" | "hot-list" | "pipeline";

interface SalesWorkspaceProps {
  leads: Lead[];
  campaigns: Campaign[];
  initialView: SalesView;
}

const OPEN_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
];

const tabs: Array<{ id: SalesView; label: string; icon: LucideIcon }> = [
  { id: "leads", label: "Leads", icon: Users },
  { id: "hot-list", label: "Hot List", icon: Flame },
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
];

export function SalesWorkspace({
  leads,
  campaigns,
  initialView,
}: SalesWorkspaceProps) {
  const [view, setView] = useState<SalesView>(initialView);

  const today = new Date().toISOString().split("T")[0];
  const hotLeads = useMemo(
    () =>
      leads
        .filter((lead) => lead.is_hot)
        .sort(
          (a, b) =>
            priorityRank(a.priority) - priorityRank(b.priority) ||
            (a.follow_up_date ?? "9999").localeCompare(
              b.follow_up_date ?? "9999"
            )
        ),
    [leads]
  );
  const todayLeads = hotLeads.filter(
    (lead) => lead.follow_up_date && lead.follow_up_date <= today
  );

  const openLeads = leads.filter((lead) => OPEN_STATUSES.includes(lead.status));
  const wonLeads = leads.filter((lead) => lead.status === "won");
  const lostLeads = leads.filter((lead) => lead.status === "lost");
  const openPipelineValue = openLeads.reduce(
    (sum, lead) => sum + (lead.value ?? 0),
    0
  );
  const wonRevenue = wonLeads.reduce((sum, lead) => sum + (lead.value ?? 0), 0);
  const closeRate =
    wonLeads.length + lostLeads.length > 0
      ? Math.round(
          (wonLeads.length / (wonLeads.length + lostLeads.length)) * 100
        )
      : null;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sales
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage prospects, priority follow-ups, and deal flow in one workspace.
          </p>
        </div>
        <div className="flex w-fit rounded-xl border border-border bg-card p-1 shadow-card">
          {tabs.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "leads" && (
        <LeadsClient initialLeads={leads} campaigns={campaigns} />
      )}

      {view === "hot-list" && (
        <HotListClient hotLeads={hotLeads} todayLeads={todayLeads} />
      )}

      {view === "pipeline" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Pipeline
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Move deals from first contact to closed sale.
              </p>
            </div>
            <PipelineHeaderActions campaigns={campaigns} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              icon={TrendingUp}
              iconClass="text-primary"
              iconBg="bg-primary/8"
              label="Open Pipeline"
              value={
                openPipelineValue > 0 ? formatValueTL(openPipelineValue) : "-"
              }
              description={`${openLeads.length} active deal${
                openLeads.length !== 1 ? "s" : ""
              }`}
            />
            <MetricCard
              icon={BadgeCheck}
              iconClass="text-emerald-600"
              iconBg="bg-emerald-50"
              label="Won Revenue"
              value={wonRevenue > 0 ? formatValueTL(wonRevenue) : "-"}
              description={`${wonLeads.length} deal${
                wonLeads.length !== 1 ? "s" : ""
              } closed`}
            />
            <MetricCard
              icon={Target}
              iconClass="text-blue-600"
              iconBg="bg-blue-50"
              label="Open Opportunities"
              value={String(openLeads.length)}
              description="Across active stages"
            />
            <MetricCard
              icon={BarChart3}
              iconClass="text-amber-600"
              iconBg="bg-amber-50"
              label="Close Rate"
              value={closeRate !== null ? `${closeRate}%` : "-"}
              description={
                wonLeads.length + lostLeads.length > 0
                  ? `${wonLeads.length} won / ${lostLeads.length} lost`
                  : "No closed deals yet"
              }
            />
          </div>

          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-24 text-center">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mb-1 text-sm font-semibold text-foreground">
                Your sales pipeline is ready.
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Add leads and move them through your sales process.
              </p>
            </div>
          ) : (
            <PipelineBoard leads={leads} campaigns={campaigns} />
          )}
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: LucideIcon;
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
    <div className="space-y-3 rounded-xl border border-border bg-card px-5 py-4">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          iconBg
        )}
      >
        <Icon className={cn("h-4 w-4", iconClass)} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-tight text-foreground tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-foreground/70">
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function priorityRank(priority: Lead["priority"]): number {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[priority];
}
