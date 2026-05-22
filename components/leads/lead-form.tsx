"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { ActionState, Lead } from "@/types";

interface LeadFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: Partial<Lead>;
  onSuccess: () => void;
}

const initialState: ActionState = { status: "idle" };

export function LeadForm({ action, defaultValues, onSuccess }: LeadFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await action(prevState, formData);
      if (result.status === "success") onSuccess();
      return result;
    },
    initialState
  );

  const field = (name: string) =>
    state.status === "error" && state.fieldErrors?.[name]
      ? state.fieldErrors[name][0]
      : null;

  return (
    <form action={formAction} className="space-y-4 px-6 pb-2">
      {state.status === "error" && !state.fieldErrors && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          name="name"
          placeholder="Jane Smith"
          defaultValue={defaultValues?.name ?? ""}
          disabled={isPending}
          autoFocus
        />
        {field("name") && <p className="text-xs text-destructive">{field("name")}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jane@acme.com"
          defaultValue={defaultValues?.email ?? ""}
          disabled={isPending}
        />
        {field("email") && <p className="text-xs text-destructive">{field("email")}</p>}
      </div>

      {/* Phone + Source */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="+90 5XX XXX XX XX"
            defaultValue={defaultValues?.phone ?? "+90 "}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Select id="source" name="source" defaultValue={defaultValues?.source ?? ""} disabled={isPending}>
            <option value="">Select source…</option>
            <option value="Referral">Referral</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Website">Website</option>
            <option value="Cold Outreach">Cold Outreach</option>
            <option value="Instagram">Instagram</option>
            <option value="Event">Event</option>
            <option value="Other">Other</option>
          </Select>
        </div>
      </div>

      {/* Status + Temperature */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={defaultValues?.status ?? "new"} disabled={isPending}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="offer_sent">Offer Sent</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="temperature">Temperature</Label>
          <Select id="temperature" name="temperature" defaultValue={defaultValues?.temperature ?? "cold"} disabled={isPending}>
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
            <option value="ready">Ready</option>
          </Select>
        </div>
      </div>

      {/* Value + Last Contacted */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="value">Deal Value ($)</Label>
          <Input
            id="value"
            name="value"
            type="number"
            min="0"
            step="any"
            placeholder="5000"
            defaultValue={defaultValues?.value ?? ""}
            disabled={isPending}
          />
          {field("value") && <p className="text-xs text-destructive">{field("value")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_contacted_at">Last Contacted</Label>
          <Input
            id="last_contacted_at"
            name="last_contacted_at"
            type="date"
            defaultValue={defaultValues?.last_contacted_at?.split("T")[0] ?? ""}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Priority + Follow-up */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" defaultValue={defaultValues?.priority ?? "medium"} disabled={isPending}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="follow_up_date">Follow-up Date</Label>
          <Input
            id="follow_up_date"
            name="follow_up_date"
            type="date"
            defaultValue={defaultValues?.follow_up_date ?? ""}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Quick note */}
      <div className="space-y-1.5">
        <Label htmlFor="quick_note">Quick Note</Label>
        <Input
          id="quick_note"
          name="quick_note"
          placeholder="One-liner for the hot list…"
          defaultValue={defaultValues?.quick_note ?? ""}
          disabled={isPending}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any context about this lead…"
          defaultValue={defaultValues?.notes ?? ""}
          disabled={isPending}
          className="h-20"
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Saving…
            </>
          ) : defaultValues?.id ? "Save changes" : "Create lead"}
        </Button>
      </div>
    </form>
  );
}
