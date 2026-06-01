"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CAMPAIGN_TYPES } from "@/lib/validations/campaign";
import type { ActionState, Campaign } from "@/types";

interface CampaignFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: Partial<Campaign>;
  onSuccess: () => void;
}

const initialState: ActionState = { status: "idle" };

export function CampaignForm({
  action,
  defaultValues,
  onSuccess,
}: CampaignFormProps) {
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
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Summer Workshop Series"
          defaultValue={defaultValues?.name ?? ""}
          disabled={isPending}
          autoFocus
        />
        {field("name") && (
          <p className="text-xs text-destructive">{field("name")}</p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label htmlFor="type">
          Type <span className="text-destructive">*</span>
        </Label>
        <Select
          id="type"
          name="type"
          defaultValue={defaultValues?.type ?? ""}
          disabled={isPending}
        >
          <option value="">Select type…</option>
          {CAMPAIGN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        {field("type") && (
          <p className="text-xs text-destructive">{field("type")}</p>
        )}
      </div>

      {/* Source + Budget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            name="source"
            placeholder="Instagram, Email…"
            defaultValue={defaultValues?.source ?? ""}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budget">Budget (₺)</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="any"
            placeholder="5000"
            defaultValue={defaultValues?.budget ?? ""}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any context about this campaign…"
          defaultValue={defaultValues?.notes ?? ""}
          disabled={isPending}
          className="h-20"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Saving…
            </>
          ) : defaultValues?.id ? (
            "Save changes"
          ) : (
            "Create campaign"
          )}
        </Button>
      </div>
    </form>
  );
}
