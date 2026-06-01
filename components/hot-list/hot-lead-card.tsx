"use client";

import { useTransition, useState, useRef } from "react";
import { Flame, Pencil, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TEMPERATURE_LABELS,
  TEMPERATURE_CLASSES,
  PRIORITY_LABELS,
  PRIORITY_CLASSES,
  formatFollowUpDate,
  isOverdue,
  isDueToday,
} from "@/lib/lead-utils";
import {
  toggleHotLead,
  updateLeadPriority,
  updateFollowUpDate,
  updateQuickNote,
} from "@/actions/hot-list";
import type { Lead, LeadPriority } from "@/types";

interface HotLeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}

export function HotLeadCard({ lead, onEdit }: HotLeadCardProps) {
  const [isPending, startTransition] = useTransition();
  const [noteValue, setNoteValue] = useState(lead.quick_note ?? "");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const overdue = isOverdue(lead.follow_up_date);
  const today = isDueToday(lead.follow_up_date);
  const followUpLabel = formatFollowUpDate(lead.follow_up_date);

  const handleToggleHot = () => {
    startTransition(async () => { await toggleHotLead(lead.id, lead.is_hot); });
  };

  const handlePriority = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as LeadPriority;
    startTransition(async () => { await updateLeadPriority(lead.id, val); });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value || null;
    startTransition(async () => { await updateFollowUpDate(lead.id, val); });
  };

  const handleNoteBlur = () => {
    if (noteValue !== (lead.quick_note ?? "")) {
      startTransition(async () => { await updateQuickNote(lead.id, noteValue); });
    }
  };

  return (
    <div
      className={cn(
        "group rounded-xl border bg-card px-5 py-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover",
        isPending && "opacity-70 pointer-events-none",
        lead.is_hot ? "border-border" : "border-border/60"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-xs font-semibold text-primary">
          {initials}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Row 1: name + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{lead.name}</span>
            <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", TEMPERATURE_CLASSES[lead.temperature])}>
              {TEMPERATURE_LABELS[lead.temperature]}
            </span>
            <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", PRIORITY_CLASSES[lead.priority])}>
              {PRIORITY_LABELS[lead.priority]}
            </span>
            {lead.source && (
              <span className="text-xs text-muted-foreground">{lead.source}</span>
            )}
          </div>

          {/* Row 2: follow-up date + priority + controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Follow-up date */}
            <div className="flex items-center gap-1.5">
              <CalendarDays className={cn("h-3.5 w-3.5", overdue ? "text-red-500" : today ? "text-amber-500" : "text-muted-foreground")} />
              <input
                type="date"
                value={lead.follow_up_date ?? ""}
                onChange={handleDateChange}
                className={cn(
                  "h-7 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30",
                  (overdue || today) && "text-amber-600 font-medium"
                )}
                title="Follow-up date"
              />
              {followUpLabel && (
                <span className={cn("text-xs", overdue ? "text-red-500 font-medium" : today ? "text-amber-600 font-medium" : "text-muted-foreground")}>
                  {followUpLabel}
                </span>
              )}
            </div>

            {/* Priority select */}
            <select
              value={lead.priority}
              onChange={handlePriority}
              className="h-7 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Quick note */}
          <textarea
            ref={noteRef}
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Quick note…"
            rows={1}
            className="w-full resize-none rounded-md border border-transparent bg-transparent px-0 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border focus:bg-muted/30 focus:px-2 transition-all duration-150"
          />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {/* Hot toggle */}
          <button
            onClick={handleToggleHot}
            title={lead.is_hot ? "Remove from hot list" : "Add to hot list"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              lead.is_hot
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "text-muted-foreground/40 hover:text-red-400 hover:bg-red-50"
            )}
          >
            <Flame className="h-3.5 w-3.5" />
          </button>

          {/* Edit */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(lead)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Edit lead"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
