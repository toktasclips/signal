"use client";

import { useTransition, useState } from "react";
import { Pencil, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { updateLeadStatus, markLeadWon, markLeadLost } from "@/actions/pipeline";
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
}

export function PipelineCard({ lead, onEdit }: PipelineCardProps) {
  const [isPending, startTransition] = useTransition();
  const [wonOpen, setWonOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [winNote, setWinNote] = useState("");
  const [lostReason, setLostReason] = useState("");

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
    if (status === "won") { setWonOpen(true); return; }
    if (status === "lost") { setLostOpen(true); return; }
    startTransition(async () => { await updateLeadStatus(lead.id, status); });
  };

  const handleMarkWon = () => {
    startTransition(async () => {
      await markLeadWon(lead.id, winNote || null);
      setWonOpen(false);
      setWinNote("");
    });
  };

  const handleMarkLost = () => {
    startTransition(async () => {
      await markLeadLost(lead.id, lostReason || null);
      setLostOpen(false);
      setLostReason("");
    });
  };

  return (
    <>
      <div
        className={cn(
          "group rounded-xl border bg-card px-4 py-3 shadow-card hover:shadow-card-hover transition-shadow duration-200",
          isPending && "opacity-60 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8 text-[11px] font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {lead.name}
              </p>
              {lead.source && (
                <p className="text-[11px] text-muted-foreground truncate">{lead.source}</p>
              )}
            </div>
          </div>
          {lead.value !== null && (
            <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
              {formatValueTL(lead.value)}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              TEMPERATURE_CLASSES[lead.temperature]
            )}
          >
            {TEMPERATURE_LABELS[lead.temperature]}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              PRIORITY_CLASSES[lead.priority]
            )}
          >
            {PRIORITY_LABELS[lead.priority]}
          </span>
        </div>

        {/* Follow-up date */}
        {lead.follow_up_date && (
          <div className="flex items-center gap-1 mb-2">
            <CalendarDays
              className={cn(
                "h-3 w-3",
                overdue ? "text-red-500" : today ? "text-amber-500" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[11px]",
                overdue
                  ? "text-red-500 font-medium"
                  : today
                  ? "text-amber-600 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {followUpLabel}
            </span>
          </div>
        )}

        {/* Quick note */}
        {lead.quick_note && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
            {lead.quick_note}
          </p>
        )}

        {/* Stage select + hover actions */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
          <select
            value={lead.status}
            onChange={handleStageChange}
            className="h-6 flex-1 min-w-0 rounded border border-border bg-transparent px-1.5 text-[11px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
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
                onClick={() => setWonOpen(true)}
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
                onClick={() => setLostOpen(true)}
                aria-label="Mark lost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mark Won Dialog */}
      <Dialog open={wonOpen} onOpenChange={setWonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Won</DialogTitle>
            <DialogDescription>
              Congratulations! Add an optional note about this win.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-1.5">
              <Label htmlFor={`win-note-${lead.id}`}>Win note (optional)</Label>
              <Textarea
                id={`win-note-${lead.id}`}
                placeholder="What closed this deal?"
                value={winNote}
                onChange={(e) => setWinNote(e.target.value)}
                className="h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWonOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkWon}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Mark Won
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Lost Dialog */}
      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Lost</DialogTitle>
            <DialogDescription>
              Add an optional reason for losing this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="space-y-1.5">
              <Label htmlFor={`lost-reason-${lead.id}`}>Lost reason (optional)</Label>
              <Textarea
                id={`lost-reason-${lead.id}`}
                placeholder="Why was this deal lost?"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLostOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkLost} disabled={isPending} variant="destructive">
              Mark Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
