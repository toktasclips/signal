"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CAMPAIGN_CALENDAR_CHANNELS,
  CAMPAIGN_CALENDAR_STATUSES,
} from "@/lib/validations/campaign";
import type { ActionState, CampaignCalendarItem } from "@/types";

interface CampaignCalendarFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: Partial<CampaignCalendarItem>;
  onSuccess: () => void;
}

const initialState: ActionState = { status: "idle" };

const STATUS_LABELS: Record<string, string> = {
  planned: "Planlandı",
  in_progress: "Hazırlanıyor",
  sent: "Gönderildi",
  won: "Kazandı",
  lost: "Kaybetti",
  paused: "Beklemede",
};

interface FormValues {
  title: string;
  target_segment: string;
  offer: string;
  channel: string;
  planned_date: string;
  end_date: string;
  expected_revenue: string;
  status: string;
  notes: string;
}

export function CampaignCalendarForm({
  action,
  defaultValues,
  onSuccess,
}: CampaignCalendarFormProps) {
  const initialValues = useMemo<FormValues>(
    () => ({
      title: defaultValues?.title ?? "",
      target_segment: defaultValues?.target_segment ?? "",
      offer: defaultValues?.offer ?? "",
      channel: defaultValues?.channel ?? "Internal Upsell",
      planned_date: defaultValues?.planned_date
        ? defaultValues.planned_date.slice(0, 10)
        : "",
      end_date: defaultValues?.end_date ? defaultValues.end_date.slice(0, 10) : "",
      expected_revenue:
        defaultValues?.expected_revenue === null ||
        defaultValues?.expected_revenue === undefined
          ? ""
          : String(defaultValues.expected_revenue),
      status: defaultValues?.status ?? "planned",
      notes: defaultValues?.notes ?? "",
    }),
    [defaultValues]
  );
  const [values, setValues] = useState<FormValues>(initialValues);
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

  const setValue = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form action={formAction} className="space-y-4 px-6 pb-2">
      {state.status === "error" && !state.fieldErrors && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">
          Kampanya Hamlesi <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="İçerideki müşterilere upsell teklifi"
          value={values.title}
          onChange={(event) => setValue("title", event.target.value)}
          disabled={isPending}
          autoFocus
        />
        {field("title") && <p className="text-xs text-destructive">{field("title")}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="target_segment">
            Hedef Kitle <span className="text-destructive">*</span>
          </Label>
          <Input
            id="target_segment"
            name="target_segment"
            placeholder="Mevcut müşteriler, sıcak leadler..."
            value={values.target_segment}
            onChange={(event) => setValue("target_segment", event.target.value)}
            disabled={isPending}
          />
          {field("target_segment") && (
            <p className="text-xs text-destructive">{field("target_segment")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="channel">Kanal</Label>
          <Select
            id="channel"
            name="channel"
            value={values.channel}
            onChange={(event) => setValue("channel", event.target.value)}
            disabled={isPending}
          >
            {CAMPAIGN_CALENDAR_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="offer">
          Teklif <span className="text-destructive">*</span>
        </Label>
        <Input
          id="offer"
          name="offer"
          placeholder="Aylık abonelik, ek paket, özel indirim..."
          value={values.offer}
          onChange={(event) => setValue("offer", event.target.value)}
          disabled={isPending}
        />
        {field("offer") && <p className="text-xs text-destructive">{field("offer")}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="planned_date">
            Başlangıç <span className="text-destructive">*</span>
          </Label>
          <Input
            id="planned_date"
            name="planned_date"
            type="date"
            value={values.planned_date}
            onChange={(event) => setValue("planned_date", event.target.value)}
            disabled={isPending}
          />
          {field("planned_date") && (
            <p className="text-xs text-destructive">{field("planned_date")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end_date">Bitiş</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            value={values.end_date}
            onChange={(event) => setValue("end_date", event.target.value)}
            disabled={isPending}
          />
          {field("end_date") && (
            <p className="text-xs text-destructive">{field("end_date")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expected_revenue">Beklenen Gelir</Label>
          <Input
            id="expected_revenue"
            name="expected_revenue"
            type="number"
            min="0"
            step="100"
            placeholder="0"
            value={values.expected_revenue}
            onChange={(event) => setValue("expected_revenue", event.target.value)}
            disabled={isPending}
          />
          {field("expected_revenue") && (
            <p className="text-xs text-destructive">{field("expected_revenue")}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Durum</Label>
        <Select
          id="status"
          name="status"
          value={values.status}
          onChange={(event) => setValue("status", event.target.value)}
          disabled={isPending}
        >
          {CAMPAIGN_CALENDAR_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Mesaj açısı, teklif detayı, takip notları..."
          value={values.notes}
          onChange={(event) => setValue("notes", event.target.value)}
          disabled={isPending}
          className="h-24"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Kaydediliyor...
            </>
          ) : defaultValues?.id ? (
            "Değişiklikleri Kaydet"
          ) : (
            "Takvime Ekle"
          )}
        </Button>
      </div>
    </form>
  );
}
