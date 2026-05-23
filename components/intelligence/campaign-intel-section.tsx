import { cn } from "@/lib/utils";
import type { CampaignStat } from "@/types";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

interface CampaignIntelSectionProps {
  campaigns: CampaignStat[];
}

export function CampaignIntelSection({ campaigns }: CampaignIntelSectionProps) {
  if (campaigns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No campaigns with leads yet.
      </p>
    );
  }

  const maxRevenue = Math.max(...campaigns.map((c) => c.wonRevenue));

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Table header */}
      <div className="hidden sm:grid sm:grid-cols-5 gap-4 px-4 py-2.5 bg-muted/40 border-b border-border">
        {["Campaign", "Leads", "Close Rate", "Won Revenue", "Avg. Deal"].map(
          (h) => (
            <span
              key={h}
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {h}
            </span>
          )
        )}
      </div>

      <div className="divide-y divide-border">
        {campaigns.map((c) => {
          const rate = Math.round(c.closeRate * 100);
          const isTop = c.wonRevenue === maxRevenue && c.wonRevenue > 0;

          return (
            <div
              key={c.id}
              className={cn(
                "grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 px-4 py-3 items-center",
                isTop && "bg-emerald-50/30"
              )}
            >
              {/* Name */}
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 min-w-0">
                {isTop && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{c.type}</p>
                </div>
              </div>

              {/* Leads */}
              <div>
                <p className="text-sm text-foreground">{c.totalLeads}</p>
                <p className="text-[11px] text-muted-foreground sm:hidden">Leads</p>
              </div>

              {/* Close rate */}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {rate}%
                  </p>
                </div>
                <div className="mt-1 h-1 w-16 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>

              {/* Revenue */}
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isTop ? "text-emerald-700" : "text-foreground"
                  )}
                >
                  {c.wonRevenue > 0 ? fmt(c.wonRevenue) : "—"}
                </p>
              </div>

              {/* Avg deal */}
              <div>
                <p className="text-sm text-foreground">
                  {c.avgDealValue > 0 ? fmt(c.avgDealValue) : "—"}
                </p>
                {c.avgVelocityDays && (
                  <p className="text-[11px] text-muted-foreground">
                    {c.avgVelocityDays}d avg close
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
