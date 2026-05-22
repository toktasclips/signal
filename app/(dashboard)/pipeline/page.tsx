import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { formatValueTL } from "@/lib/lead-utils";
import type { Lead, LeadStatus } from "@/types";

export const metadata: Metadata = {
  title: "Pipeline",
};

const OPEN_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "offer_sent"];

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

  const openPipelineValue = openLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);
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
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Pipeline
        </h1>
        <p className="text-sm text-muted-foreground">
          Track every opportunity from first contact to closed sale.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Open Pipeline"
          value={openPipelineValue > 0 ? formatValueTL(openPipelineValue) : "—"}
        />
        <MetricCard
          label="Won Revenue"
          value={wonRevenue > 0 ? formatValueTL(wonRevenue) : "—"}
        />
        <MetricCard
          label="Open Opportunities"
          value={String(openOpportunities)}
        />
        <MetricCard
          label="Close Rate"
          value={closeRate !== null ? `${closeRate}%` : "—"}
        />
      </div>

      {/* Board */}
      {allLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-border">
          <p className="text-sm font-medium text-foreground mb-1">
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
