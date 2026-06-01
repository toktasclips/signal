"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CampaignForm } from "./campaign-form";
import { createCampaign, updateCampaign } from "@/actions/campaign";
import type { Campaign } from "@/types";

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
}

export function CampaignModal({
  open,
  onOpenChange,
  campaign,
}: CampaignModalProps) {
  const isEdit = !!campaign;
  const action = isEdit
    ? updateCampaign.bind(null, campaign.id)
    : createCampaign;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit campaign" : "New campaign"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this campaign."
              : "Create a new campaign to track attribution."}
          </DialogDescription>
        </DialogHeader>
        <CampaignForm
          action={action}
          defaultValues={campaign ?? undefined}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
