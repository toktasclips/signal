import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LeadHealthResult, LeadHealthStatus } from "@/types";

const HEALTH_CONFIG: Record<
  LeadHealthStatus,
  { label: string; dot: string; badge: string; row: string }
> = {
  high_momentum: {
    label: "High Momentum",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50/70 text-emerald-700 border-emerald-200/80",
    row: "",
  },
  healthy: {
    label: "Healthy",
    dot: "bg-slate-400",
    badge: "bg-muted/70 text-muted-foreground border-border",
    row: "",
  },
  at_risk: {
    label: "At Risk",
    dot: "bg-amber-400",
    badge: "bg-amber-50/70 text-amber-700 border-amber-200/80",
    row: "",
  },
  stale: {
    label: "Stale",
    dot: "bg-red-400",
    badge: "bg-red-50/70 text-red-700 border-red-200/80",
    row: "opacity-75",
  },
};

interface LeadHealthSectionProps {
  results: LeadHealthResult[];
}

export function LeadHealthSection({ results }: LeadHealthSectionProps) {
  if (results.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        No active leads to analyze.
      </p>
    );
  }

  const counts = results.reduce(
    (acc, r) => ({ ...acc, [r.health]: (acc[r.health] ?? 0) + 1 }),
    {} as Record<LeadHealthStatus, number>
  );

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex flex-wrap gap-2">
        {(["stale", "at_risk", "healthy", "high_momentum"] as LeadHealthStatus[]).map(
          (h) =>
            counts[h] ? (
              <div
                key={h}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
                  HEALTH_CONFIG[h].badge
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", HEALTH_CONFIG[h].dot)} />
                {counts[h]} {HEALTH_CONFIG[h].label}
              </div>
            ) : null
        )}
      </div>

      {/* Lead list */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {results.map((r) => {
          const cfg = HEALTH_CONFIG[r.health];
          return (
            <Link
              key={r.lead.id}
              href="/leads"
              className={cn(
                "flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-muted/35",
                cfg.row
              )}
            >
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", cfg.dot)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {r.lead.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.lead.company ? `${r.lead.company} · ` : ""}
                  {r.daysSinceActivity === 0
                    ? "Active today"
                    : `${r.daysSinceActivity}d inactive`}
                  {r.factors.length > 0 ? ` · ${r.factors[0]}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "flex-shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium",
                  cfg.badge
                )}
              >
                {cfg.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
