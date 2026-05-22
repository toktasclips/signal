"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatValueTL, STATUS_LABELS } from "@/lib/lead-utils";
import { PipelineCard } from "./pipeline-card";
import { LeadModal } from "@/components/leads/lead-modal";
import type { Lead, LeadStatus } from "@/types";

const COLUMNS: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "offer_sent",
  "won",
  "lost",
];

const COLUMN_DOT: Record<LeadStatus, string> = {
  new: "bg-zinc-400",
  contacted: "bg-blue-500",
  qualified: "bg-violet-500",
  offer_sent: "bg-amber-500",
  won: "bg-emerald-500",
  lost: "bg-red-500",
};

interface PipelineBoardProps {
  leads: Lead[];
}

export function PipelineBoard({ leads }: PipelineBoardProps) {
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditLead(null);
  };

  const grouped = COLUMNS.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>
  );

  return (
    <>
      <div className="overflow-x-auto pb-4 -mx-6 px-6 lg:-mx-10 lg:px-10">
        <div className="flex gap-4 min-w-fit">
          {COLUMNS.map((status) => {
            const columnLeads = grouped[status];
            const totalValue = columnLeads.reduce(
              (sum, l) => sum + (l.value ?? 0),
              0
            );

            return (
              <div key={status} className="w-[17rem] shrink-0 flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        COLUMN_DOT[status]
                      )}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                      {columnLeads.length}
                    </span>
                  </div>
                  {totalValue > 0 && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatValueTL(totalValue)}
                    </span>
                  )}
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {columnLeads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        No leads in this stage yet.
                      </p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <PipelineCard
                        key={lead.id}
                        lead={lead}
                        onEdit={handleEdit}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LeadModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        lead={editLead}
      />
    </>
  );
}
