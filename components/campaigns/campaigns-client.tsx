"use client";

import { useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "./campaign-card";
import { CampaignModal } from "./campaign-modal";
import { CampaignDetailModal } from "./campaign-detail-modal";
import { formatValueTL } from "@/lib/lead-utils";
import type { Campaign, Lead, LeadStatus } from "@/types";

const OPEN_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
];

interface CampaignsClientProps {
  campaigns: Campaign[];
  leads: Lead[];
}

export function CampaignsClient({ campaigns, leads }: CampaignsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);

  const handleEdit = (campaign: Campaign) => {
    setEditCampaign(campaign);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditCampaign(null);
  };

  const leadsFor = (campaignId: string) =>
    leads.filter((l) => l.campaign_id === campaignId);

  const detailLeads = detailCampaign ? leadsFor(detailCampaign.id) : [];

  // Metrics
  const allCampaignLeads = leads.filter((l) => l.campaign_id !== null);
  const totalWonRevenue = allCampaignLeads
    .filter((l) => l.status === "won")
    .reduce((sum, l) => sum + (l.value ?? 0), 0);
  const totalOpenValue = allCampaignLeads
    .filter((l) => OPEN_STATUSES.includes(l.status))
    .reduce((sum, l) => sum + (l.value ?? 0), 0);

  const avgRevenue =
    campaigns.length > 0
      ? Math.round(
          campaigns.reduce((sum, c) => {
            const won = leadsFor(c.id)
              .filter((l) => l.status === "won")
              .reduce((s, l) => s + (l.value ?? 0), 0);
            return sum + won;
          }, 0) / campaigns.length
        )
      : 0;

  return (
    <>
      {/* Metrics */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Total Campaigns" value={String(campaigns.length)} />
          <MetricCard
            label="Open Pipeline"
            value={totalOpenValue > 0 ? formatValueTL(totalOpenValue) : "—"}
          />
          <MetricCard
            label="Won Revenue"
            value={totalWonRevenue > 0 ? formatValueTL(totalWonRevenue) : "—"}
          />
          <MetricCard
            label="Avg Revenue / Campaign"
            value={avgRevenue > 0 ? formatValueTL(avgRevenue) : "—"}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {campaigns.length === 0
            ? "No campaigns yet"
            : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""}`}
        </p>
        <Button size="sm" onClick={() => { setEditCampaign(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* List */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border bg-muted/20">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-4">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            No campaigns yet
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            Create your first campaign to start tracking which efforts drive the most revenue.
          </p>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              leads={leadsFor(campaign.id)}
              onEdit={handleEdit}
              onDelete={() => {}}
              onClick={setDetailCampaign}
            />
          ))}
        </div>
      )}

      <CampaignModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        campaign={editCampaign}
      />

      <CampaignDetailModal
        campaign={detailCampaign}
        leads={detailLeads}
        open={!!detailCampaign}
        onOpenChange={(open) => { if (!open) setDetailCampaign(null); }}
      />
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
