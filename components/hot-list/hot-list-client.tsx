"use client";

import { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import { HotLeadCard } from "./hot-lead-card";
import { HotListEmptyState } from "./hot-list-empty-state";
import { LeadModal } from "@/components/leads/lead-modal";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS } from "@/lib/lead-utils";
import type { Lead, LeadPriority } from "@/types";

const PRIORITY_ORDER: LeadPriority[] = ["urgent", "high", "medium", "low"];

interface HotListClientProps {
  hotLeads: Lead[];
  todayLeads: Lead[];
}

function PriorityGroup({
  priority,
  leads,
  onEdit,
}: {
  priority: LeadPriority;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (leads.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", collapsed && "-rotate-90")} />
        {PRIORITY_LABELS[priority]}
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">{leads.length}</span>
      </button>
      {!collapsed && (
        <div className="space-y-2 pl-1">
          {leads.map((lead) => (
            <HotLeadCard key={lead.id} lead={lead} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HotListClient({ hotLeads, todayLeads }: HotListClientProps) {
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

  if (hotLeads.length === 0) return <HotListEmptyState />;

  // Group by priority (exclude today leads from groups to avoid duplication)
  const todayIds = new Set(todayLeads.map((l) => l.id));
  const grouped = PRIORITY_ORDER.reduce<Record<LeadPriority, Lead[]>>(
    (acc, p) => {
      acc[p] = hotLeads.filter((l) => l.priority === p && !todayIds.has(l.id));
      return acc;
    },
    { urgent: [], high: [], medium: [], low: [] }
  );

  return (
    <div className="space-y-8">
      {/* Today's Follow-Ups */}
      {todayLeads.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Today&apos;s Follow-Ups</h2>
            <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-medium">
              {todayLeads.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayLeads.map((lead) => (
              <HotLeadCard key={lead.id} lead={lead} onEdit={handleEdit} />
            ))}
          </div>
        </section>
      )}

      {/* Priority Groups */}
      <section className="space-y-5">
        {todayLeads.length > 0 && (
          <h2 className="text-sm font-semibold text-foreground">All Hot Leads</h2>
        )}
        {PRIORITY_ORDER.map((priority) => (
          <PriorityGroup
            key={priority}
            priority={priority}
            leads={grouped[priority]}
            onEdit={handleEdit}
          />
        ))}
      </section>

      <LeadModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        lead={editLead}
      />
    </div>
  );
}
