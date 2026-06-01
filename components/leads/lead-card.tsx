"use client";

import { useTransition } from "react";
import { Pencil, Trash2, Mail, Phone, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  TEMPERATURE_LABELS,
  STATUS_CLASSES,
  TEMPERATURE_CLASSES,
  formatValue,
  formatRelativeTime,
} from "@/lib/lead-utils";
import { toggleHotLead } from "@/actions/hot-list";
import type { Lead } from "@/types";

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function LeadCard({ lead, onEdit, onDelete }: LeadCardProps) {
  const [isPending, startTransition] = useTransition();

  const initials = lead.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleToggleHot = () => {
    startTransition(async () => { await toggleHotLead(lead.id, lead.is_hot); });
  };

  return (
    <div className={cn(
      "group flex items-start gap-4 rounded-xl border bg-card px-5 py-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover",
      isPending && "opacity-60",
      lead.is_hot ? "border-border" : "border-border"
    )}>
      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-xs font-semibold text-primary">
        {initials}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Row 1: name + badges + value */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{lead.name}</span>
          <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_CLASSES[lead.status])}>
            {STATUS_LABELS[lead.status]}
          </span>
          <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", TEMPERATURE_CLASSES[lead.temperature])}>
            {TEMPERATURE_LABELS[lead.temperature]}
          </span>
          {lead.value !== null && (
            <span className="ml-auto text-sm font-semibold text-foreground tabular-nums">
              {formatValue(lead.value)}
            </span>
          )}
        </div>

        {/* Row 2: meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {lead.source && <span>{lead.source}</span>}
          {lead.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {lead.email}
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          )}
          {lead.last_contacted_at && (
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(lead.last_contacted_at)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Hot toggle — always visible */}
        <button
          onClick={handleToggleHot}
          disabled={isPending}
          title={lead.is_hot ? "Remove from hot list" : "Add to hot list"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
            lead.is_hot
              ? "text-red-500 bg-red-50"
              : "text-muted-foreground/30 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100"
          )}
        >
          <Flame className="h-3.5 w-3.5" />
        </button>

        {/* Edit + Delete — hover only */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(lead)} aria-label="Edit lead">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(lead)}
            aria-label="Delete lead"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/8"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
