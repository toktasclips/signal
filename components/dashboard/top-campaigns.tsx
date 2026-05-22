import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { formatValueTL } from "@/lib/lead-utils";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  "Instagram Ad": "bg-pink-50 text-pink-700",
  Workshop: "bg-violet-50 text-violet-700",
  YouTube: "bg-red-50 text-red-600",
  Referral: "bg-emerald-50 text-emerald-700",
  "Organic Content": "bg-teal-50 text-teal-700",
  Webinar: "bg-blue-50 text-blue-700",
  Email: "bg-amber-50 text-amber-700",
  Other: "bg-muted text-muted-foreground",
};

interface TopCampaignItem {
  id: string;
  name: string;
  type: string;
  wonRevenue: number;
  leadCount: number;
}

interface TopCampaignsProps {
  campaigns: TopCampaignItem[];
}

export function TopCampaigns({ campaigns }: TopCampaignsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Top Campaigns
          </h2>
        </div>
        <Link
          href="/campaigns"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-6 text-center">
          <p className="text-xs text-muted-foreground">No campaigns yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {c.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {c.leadCount} lead{c.leadCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                    TYPE_COLORS[c.type] ?? TYPE_COLORS["Other"]
                  )}
                >
                  {c.type}
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {c.wonRevenue > 0 ? formatValueTL(c.wonRevenue) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
