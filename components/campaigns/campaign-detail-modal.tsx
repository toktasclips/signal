"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatValueTL, STATUS_LABELS, STATUS_CLASSES } from "@/lib/lead-utils";
import type { Campaign, Lead, LeadStatus } from "@/types";

const OPEN_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
];

interface CampaignDetailModalProps {
  campaign: Campaign | null;
  leads: Lead[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDetailModal({
  campaign,
  leads,
  open,
  onOpenChange,
}: CampaignDetailModalProps) {
  if (!campaign) return null;

  const wonLeads = leads.filter((l) => l.status === "won");
  const lostLeads = leads.filter((l) => l.status === "lost");
  const openLeads = leads.filter((l) => OPEN_STATUSES.includes(l.status));

  const wonRevenue = wonLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const openValue = openLeads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const totalRevenue = leads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const closeRate =
    wonLeads.length + lostLeads.length > 0
      ? Math.round(
          (wonLeads.length / (wonLeads.length + lostLeads.length)) * 100
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{campaign.type}</span>
            {campaign.source && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">{campaign.source}</span>
              </>
            )}
            {campaign.budget && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">
                  Budget: {formatValueTL(campaign.budget)}
                </span>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Won Revenue" value={wonRevenue > 0 ? formatValueTL(wonRevenue) : "—"} />
            <Stat label="Open Pipeline" value={openValue > 0 ? formatValueTL(openValue) : "—"} />
            <Stat label="Total Leads" value={String(leads.length)} />
            <Stat
              label="Close Rate"
              value={closeRate !== null ? `${closeRate}%` : "—"}
            />
          </div>

          {/* Won / Lost breakdown */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="text-emerald-600 font-medium">
              {wonLeads.length} won
            </span>
            <span className="text-red-500 font-medium">
              {lostLeads.length} lost
            </span>
            <span>{openLeads.length} open</span>
          </div>

          {/* Notes */}
          {campaign.notes && (
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
              {campaign.notes}
            </p>
          )}

          {/* Leads list */}
          {leads.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium text-foreground mb-3">
                Linked Leads
              </p>
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {lead.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {lead.value !== null && (
                      <span className="text-xs font-semibold tabular-nums text-foreground">
                        {formatValueTL(lead.value)}
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                        STATUS_CLASSES[lead.status]
                      )}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {leads.length === 0 && (
            <div className="border-t border-border pt-4 text-center py-6">
              <p className="text-xs text-muted-foreground">
                No leads linked to this campaign yet.
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Assign leads from the Leads page.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-base font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
