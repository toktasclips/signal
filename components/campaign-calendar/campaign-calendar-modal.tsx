"use client";

import {
  createCampaignCalendarItem,
  updateCampaignCalendarItem,
} from "@/actions/campaign";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignCalendarForm } from "./campaign-calendar-form";
import type { ActionState, CampaignCalendarItem } from "@/types";

interface CampaignCalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CampaignCalendarItem | null;
}

export function CampaignCalendarModal({
  open,
  onOpenChange,
  item,
}: CampaignCalendarModalProps) {
  const action = item
    ? updateCampaignCalendarItem.bind(null, item.id)
    : createCampaignCalendarItem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? "Kampanya Hamlesini Düzenle" : "Yeni Kampanya Hamlesi"}
          </DialogTitle>
          <DialogDescription>
            Gelir getirecek teklifleri, lansmanları ve upsell planlarını tarihe bağla.
          </DialogDescription>
        </DialogHeader>
        <CampaignCalendarForm
          action={action as (prevState: ActionState, formData: FormData) => Promise<ActionState>}
          defaultValues={item ?? undefined}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
