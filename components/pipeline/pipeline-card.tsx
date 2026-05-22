"use client";

import { useTransition, memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TEMPERATURE_LABELS,
  TEMPERATURE_CLASSES,
  PRIORITY_LABELS,
  PRIORITY_CLASSES,
  formatValueTL,
  formatFollowUpDate,
  isOverdue,
  isDueToday,
} from "@/lib/lead-utils";
import { updateLeadStatus } from "@/actions/pipeline";
import type { Lead, LeadStatus } from "@/types";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

interface PipelineCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onMarkWon: (lead: Lead) => void;
  onMarkLost: (lead: Lead) => void;
  isDragOverlay?: boolean;
}

export const PipelineCard = memo(function PipelineCard({
  lead,
  onEdit,
  onMarkWon,
  onMarkLost,
  isDragOverlay = false,
}: PipelineCardProps) {
  const [isPending, startTransition] = useTransition();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    disabled: isDragOverlay,
  });

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const overdue = isOverdue(lead.follow_up_date);
  const today = isDueToday(lead.follow_up_date);
  const followUpLabel = formatFollowUpDate(lead.follow_up_date);

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as LeadStatus;
    if (status === "won") { onMarkWon(lead); return; }
    if (status === "lost") { onMarkLost(lead); return; }
    startTransition(async () => { await updateLeadStatus(lead.id, status); });
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      className={cn(
        "group relative rounded-xl border bg-card transition-all duration-150 select-none",
        !isDragOverlay && "cursor-grab active:cursor-grabbing",
        !isDragOverlay && !isDragging && "hover:shadow-md hover:-translate-y-px",
        isDragging && "opacity-0",
        isDragOverlay && "shadow-2xl rotate-[1.5deg] scale-[1.02] cursor-grabbing opacity-[0.97]",
        isPending && "opacity-50 pointer-events-none",
        "shadow-sm"
      )}
      style={
        isDragOverlay
          ? undefined
          : { transform: CSS.Translate.toString(null) }
      }
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
    >
      <div className="px-4 py-3.5">
        {/* Top: avatar + name + value */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                {lead.name}
              </p>
              {lead.source && (
                <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
                  {lead.source}
                </p>
              )}
            </div>
          </div>
          {lead.value !== null && (
            <span className="shrink-0 text-sm font-bold text-foreground tabular-nums">
              {formatValueTL(lead.value)}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
              TEMPERATURE_CLASSES[lead.temperature]
            )}
          >
            {TEMPERATURE_LABELS[lead.temperature]}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
              PRIORITY_CLASSES[lead.priority]
            )}
          >
            {PRIORITY_LABELS[lead.priority]}
          </span>
        </div>

        {/* Quick note */}
        {lead.quick_note && (
          <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mb-2.5 leading-relaxed">
            {lead.quick_note}
          </p>
        )}

        {/* Follow-up date */}
        {lead.follow_up_date && (
          <div className="flex items-center gap-1.5 mb-3">
            <CalendarDays
              className={cn(
                "h-3 w-3 shrink-0",
                overdue
                  ? "text-red-500"
                  : today
                  ? "text-amber-500"
                  : "text-muted-foreground/50"
              )}
            />
            <span
              className={cn(
                "text-[11px]",
                overdue
                  ? "text-red-500 font-medium"
                  : today
                  ? "text-amber-600 font-medium"
                  : "text-muted-foreground/70"
              )}
            >
              {followUpLabel}
            </span>
          </div>
        )}

        {/* Footer: stage select + hover actions */}
        <div
          className="flex items-center gap-2 pt-2.5 border-t border-border/60"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <select
            value={lead.status}
            onChange={handleStageChange}
            className="h-6 flex-1 min-w-0 rounded-md border border-border/60 bg-muted/40 px-2 text-[11px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer hover:bg-muted/60 transition-colors"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(lead)}
              aria-label="Edit lead"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            {lead.status !== "won" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onMarkWon(lead)}
                aria-label="Mark won"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
            {lead.status !== "lost" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onMarkLost(lead)}
                aria-label="Mark lost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
PipelineCard.displayName = "PipelineCard";
