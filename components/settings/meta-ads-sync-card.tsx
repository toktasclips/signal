"use client";

import { useActionState } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { syncCurrentMetaAdsPeriod } from "@/actions/meta";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types";

interface MetaAdsSyncResult {
  period: string;
  spend: number;
  reach: number;
  impressions: number;
  cpm: number;
  clicks: number;
  ctr: number;
  currency: string;
  campaignCount: number;
}

const initialState: ActionState<MetaAdsSyncResult> = { status: "idle" };

function number(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function money(value: number, currency: string): string {
  return value.toLocaleString(currency === "TRY" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

export function MetaAdsSyncCard({
  periodLabel,
}: {
  periodLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(
    syncCurrentMetaAdsPeriod,
    initialState
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Meta Ads Sync
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Facebook/Instagram reklam verileri aktif dönem için çekilir:
              {" "}{periodLabel}. Kampanya bazlı spend, reach, impression,
              click, CPM ve CTR kayıtları ayrı kaynak veri sayfasına düşer.
            </p>
          </div>
        </div>

        <form action={formAction}>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? "Senkronize ediliyor..." : "Meta Verilerini Sync Et"}
          </Button>
        </form>
      </div>

      {state.status === "error" && (
        <div className="mt-4 rounded-lg border border-red-200/80 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{state.error}</p>
        </div>
      )}

      {state.status === "success" && state.data && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SyncStat label="Dönem" value={state.data.period} />
          <SyncStat label="Spend" value={money(state.data.spend, state.data.currency)} />
          <SyncStat label="Reach" value={number(state.data.reach)} />
          <SyncStat label="Impressions" value={number(state.data.impressions)} />
          <SyncStat label="CPM" value={money(state.data.cpm, state.data.currency)} />
          <SyncStat label="Clicks" value={number(state.data.clicks)} />
          <SyncStat label="CTR" value={`${number(state.data.ctr)}%`} />
          <SyncStat label="Campaigns" value={number(state.data.campaignCount)} />
        </div>
      )}
    </section>
  );
}

function SyncStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}
