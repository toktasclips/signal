"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { formatValueTL, STATUS_LABELS } from "@/lib/lead-utils";
import { PipelineCard } from "./pipeline-card";
import type { Lead, LeadStatus } from "@/types";

const COLUMN_STYLE: Record<
  LeadStatus,
  { dot: string; accent: string; overBg: string; overRing: string }
> = {
  new: {
    dot: "bg-zinc-400",
    accent: "bg-zinc-200",
    overBg: "bg-zinc-50",
    overRing: "ring-zinc-200",
  },
  contacted: {
    dot: "bg-blue-400",
    accent: "bg-blue-200",
    overBg: "bg-blue-50/60",
    overRing: "ring-blue-200",
  },
  qualified: {
    dot: "bg-violet-400",
    accent: "bg-violet-200",
    overBg: "bg-violet-50/60",
    overRing: "ring-violet-200",
  },
  offer_sent: {
    dot: "bg-amber-400",
    accent: "bg-amber-200",
    overBg: "bg-amber-50/60",
    overRing: "ring-amber-200",
  },
  won: {
    dot: "bg-emerald-500",
    accent: "bg-emerald-200",
    overBg: "bg-emerald-50/60",
    overRing: "ring-emerald-200",
  },
  lost: {
    dot: "bg-red-400",
    accent: "bg-red-200",
    overBg: "bg-red-50/60",
    overRing: "ring-red-200",
  },
};

interface PipelineColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onMarkWon: (lead: Lead) => void;
  onMarkLost: (lead: Lead) => void;
  activeId: string | null;
}

export const PipelineColumn = memo(function PipelineColumn({
  status,
  leads,
  onEdit,
  onMarkWon,
  onMarkLost,
}: PipelineColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  const style = COLUMN_STYLE[status];
  const totalValue = leads.reduce((sum, l) => sum + (l.value ?? 0), 0);

  return (
    <div className="w-72 shrink-0 flex flex-col gap-3">
      {/* Header */}
      <div className="space-y-2.5">
        <div className={cn("h-0.5 w-full rounded-full", style.accent)} />
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full shrink-0", style.dot)} />
            <span className="text-sm font-semibold text-foreground">
              {STATUS_LABELS[status]}
            </span>
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {leads.length}
            </span>
          </div>
          {totalValue > 0 && (
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {formatValueTL(totalValue)}
            </span>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-32 rounded-xl p-2 space-y-2 transition-all duration-150",
          "bg-muted/20 border border-transparent",
          isOver &&
            cn(
              "ring-1 ring-inset border-transparent",
              style.overBg,
              style.overRing
            )
        )}
      >
        {leads.map((lead) => (
          <PipelineCard
            key={lead.id}
            lead={lead}
            onEdit={onEdit}
            onMarkWon={onMarkWon}
            onMarkLost={onMarkLost}
          />
        ))}

        {leads.length === 0 && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg border border-dashed px-4 py-7 transition-colors duration-150",
              isOver
                ? cn("border-current", style.dot, "bg-white/60")
                : "border-border/50"
            )}
          >
            <p className="text-xs text-muted-foreground/60 text-center">
              {isOver ? "Drop here" : "No leads in this stage yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
PipelineColumn.displayName = "PipelineColumn";
