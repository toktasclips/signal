"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { updateLaunchPlanItemContent } from "@/actions/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState, CampaignCalendarItem } from "@/types";

interface LaunchPlanItemEditorProps {
  item: CampaignCalendarItem;
  launchName: string;
  dayLabel: string;
}

const initialState: ActionState = { status: "idle" };

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function splitTitle(title: string): { prefix: string; title: string } {
  const separator = title.lastIndexOf(": ");
  if (separator === -1) return { prefix: "", title };

  return {
    prefix: title.slice(0, separator),
    title: title.slice(separator + 2),
  };
}

function splitNotes(notes: string | null): { systemNotes: string; notes: string } {
  if (!notes) return { systemNotes: "", notes: "" };

  const lines = notes.split("\n");
  const systemLines: string[] = [];
  const contentLines = [...lines];

  while (
    contentLines.length > 0 &&
    (contentLines[0].startsWith("Lansman:") || contentLines[0].startsWith("Gün "))
  ) {
    systemLines.push(contentLines.shift() ?? "");
  }

  return {
    systemNotes: systemLines.join("\n"),
    notes: contentLines.join("\n").trim(),
  };
}

export function LaunchPlanItemEditor({
  item,
  launchName,
  dayLabel,
}: LaunchPlanItemEditorProps) {
  const [state, formAction, isPending] = useActionState(
    updateLaunchPlanItemContent.bind(null, item.id),
    initialState
  );
  const titleParts = splitTitle(item.title);
  const noteParts = splitNotes(item.notes);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <div className="mb-6">
        <Button asChild variant="ghost" className="-ml-3">
          <Link href="/launch-plans">
            <ArrowLeft className="h-4 w-4" />
            Lansman Planları
          </Link>
        </Button>
      </div>

      <form action={formAction} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {launchName} · {dayLabel}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Lansman İçeriği
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(item.planned_date)}
              </p>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Kaydet
                </>
              )}
            </Button>
          </div>

          {state.status === "error" && (
            <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive">
                {state.error ?? "İçerik kaydedilemedi."}
              </p>
            </div>
          )}

          {state.status === "success" && (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-medium text-emerald-700">
                Kaydedildi.
              </p>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Gün Başlığı</Label>
              <input
                type="hidden"
                name="title_prefix"
                value={titleParts.prefix}
              />
              <Input
                id="title"
                name="title"
                defaultValue={titleParts.title}
                className="h-12 text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offer">Ana Metin</Label>
              <Textarea
                id="offer"
                name="offer"
                defaultValue={item.offer}
                placeholder="Buraya uzun e-posta, post metni, DM akışı veya konuşma taslağını yaz..."
                className="min-h-[520px] resize-y text-base leading-8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <input
                type="hidden"
                name="system_notes"
                value={noteParts.systemNotes}
              />
              <Textarea
                id="notes"
                name="notes"
                defaultValue={noteParts.notes}
                placeholder="CTA, takip fikri, görsel notu, yayın saati..."
                className="min-h-36 resize-y leading-7"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
