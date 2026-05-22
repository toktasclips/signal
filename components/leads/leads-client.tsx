"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LeadCard } from "./lead-card";
import { LeadModal } from "./lead-modal";
import { DeleteDialog } from "./delete-dialog";
import { LeadsEmptyState } from "./leads-empty-state";
import type { Campaign, Lead, LeadStatus, LeadTemperature } from "@/types";

interface LeadsClientProps {
  initialLeads: Lead[];
  campaigns?: Campaign[];
}

export function LeadsClient({ initialLeads, campaigns }: LeadsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [tempFilter, setTempFilter] = useState<LeadTemperature | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialLeads.filter((lead) => {
      const matchSearch =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        (lead.company?.toLowerCase().includes(q) ?? false) ||
        (lead.email?.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchTemp = tempFilter === "all" || lead.temperature === tempFilter;
      return matchSearch && matchStatus && matchTemp;
    });
  }, [initialLeads, search, statusFilter, tempFilter]);

  const isFiltered = search || statusFilter !== "all" || tempFilter !== "all";

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditLead(null);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search leads…"
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <Select
            className="h-9 text-sm w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="offer_sent">Offer Sent</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>

          {/* Temperature filter */}
          <Select
            className="h-9 text-sm w-36"
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value as LeadTemperature | "all")}
          >
            <option value="all">All temps</option>
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
            <option value="ready">Ready</option>
          </Select>
        </div>

        <Button size="sm" onClick={() => { setEditLead(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          New Lead
        </Button>
      </div>

      {/* Count */}
      {initialLeads.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length === initialLeads.length
            ? `${initialLeads.length} lead${initialLeads.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${initialLeads.length} leads`}
        </p>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <LeadsEmptyState filtered={!!isFiltered && initialLeads.length > 0} />
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <LeadModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        lead={editLead}
        campaigns={campaigns}
      />

      {deleteTarget && (
        <DeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          leadId={deleteTarget.id}
          leadName={deleteTarget.name}
        />
      )}
    </div>
  );
}
