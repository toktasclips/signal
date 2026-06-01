import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { formatValueTL } from "@/lib/lead-utils";

interface PipelineSnapshotProps {
  openValue: number;
  wonRevenue: number;
  openOpportunities: number;
}

export function PipelineSnapshot({
  openValue,
  wonRevenue,
  openOpportunities,
}: PipelineSnapshotProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Pipeline Snapshot
          </h2>
        </div>
        <Link
          href="/leads?view=pipeline"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View pipeline <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SnapCard
          label="Open Pipeline"
          value={openValue > 0 ? formatValueTL(openValue) : "—"}
        />
        <SnapCard
          label="Won Revenue"
          value={wonRevenue > 0 ? formatValueTL(wonRevenue) : "—"}
        />
        <SnapCard
          label="Open Opps"
          value={String(openOpportunities)}
        />
      </div>
    </section>
  );
}

function SnapCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-medium text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-base font-bold text-foreground tabular-nums leading-tight">
        {value}
      </p>
    </div>
  );
}
