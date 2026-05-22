"use client";

import { useTransition } from "react";
import { Pencil, Trash2, Users, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatValueTL } from "@/lib/lead-utils";
import type { Campaign, Lead, LeadStatus } from "@/types";

const OPEN_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
];

const TYPE_COLORS: Record<string, string> = {
  "Instagram Ad": "bg-pink-50 text-pink-700 border-transparent",
  Workshop: "bg-violet-50 text-violet-700 border-transparent",
  YouTube: "bg-red-50 text-red-600 border-transparent",
  Referral: "bg-emerald-50 text-emerald-700 border-transparent",
  "Organic Content": "bg-teal-50 text-teal-700 border-transparent",
  Webinar: "bg-blue-50 text-blue-700 border-transparent",
  Email: "bg-amber-50 text-amber-700 border-transparent",
  Other: "bg-muted text-muted-foreground border-transparent",
};

interface CampaignCardProps {
  campaign: Campaign;
  leads: Lead[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onClick: (campaign: Campaign) => void;
}

export function CampaignCard({
  campaign,
  leads,
  onEdit,
  onDelete,
  onClick,
}: CampaignCardProps) {
  const [isPending, startTransition] = useTransition();

  const wonLeads = leads.filter((l) => l.status === "won");
  const lostLeads = leads.filter((l) => l.status === "lost");
  const openLeads = leads.filter((l) => OPEN_STATUSES.includes(l.status));

  const wonRevenue = wonLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const openValue = openLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const closeRate =
    wonLeads.length + lostLeads.length > 0
      ? Math.round(
          (wonLeads.length / (wonLeads.length + lostLeads.length)) * 100
        )
      : null;

  const handleDelete = () => {
    startTransition(async () => {
      const { deleteCampaign } = await import("@/actions/campaign");
      await deleteCampaign(campaign.id);
    });
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer hover:-translate-y-px",
        isPending && "opacity-50 pointer-events-none"
      )}
      onClick={() => onClick(campaign)}
    >
      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate leading-tight mb-1">
              {campaign.name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                TYPE_COLORS[campaign.type] ?? TYPE_COLORS["Other"]
              )}
            >
              {campaign.type}
            </span>
          </div>
          {/* Hover actions */}
          <div
            className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(campaign)}
              aria-label="Edit campaign"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              aria-label="Delete campaign"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/8"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Trophy className="h-3 w-3 text-emerald-600" />
              <p className="text-[10px] text-muted-foreground">Won Revenue</p>
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">
              {wonRevenue > 0 ? formatValueTL(wonRevenue) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="h-3 w-3 text-primary" />
              <p className="text-[10px] text-muted-foreground">Open Pipeline</p>
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">
              {openValue > 0 ? formatValueTL(openValue) : "—"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </span>
          {closeRate !== null && (
            <span className="font-medium text-foreground">
              {closeRate}% close rate
            </span>
          )}
          {campaign.source && <span>{campaign.source}</span>}
        </div>
      </div>
    </div>
  );
}
