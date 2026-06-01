"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LeadForm } from "./lead-form";
import { LeadSemanticSignals } from "@/components/signals/lead-semantic-signals";
import { createLead, updateLead } from "@/actions/lead";
import type { Campaign, Lead } from "@/types";

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  campaigns?: Campaign[];
}

export function LeadModal({ open, onOpenChange, lead, campaigns }: LeadModalProps) {
  const isEdit = !!lead;
  const action = isEdit ? updateLead.bind(null, lead.id) : createLead;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "New lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this prospect."
              : "Add a new prospect to your pipeline."}
          </DialogDescription>
        </DialogHeader>
        <LeadForm
          action={action}
          defaultValues={lead ?? undefined}
          campaigns={campaigns}
          onSuccess={() => onOpenChange(false)}
        />
        {isEdit && lead && <LeadSemanticSignals leadId={lead.id} />}
      </DialogContent>
    </Dialog>
  );
}
