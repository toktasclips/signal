"use client";

import { useActionState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { syncCurrentStripePeriod } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types";

interface StripeSyncResult {
  period: string;
  grossRevenue: number;
  netRevenue: number;
  fees: number;
  refunds: number;
  chargeCount: number;
}

const initialState: ActionState<StripeSyncResult> = { status: "idle" };

function usd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function StripeSyncCard({
  periodLabel,
  syncStart,
  syncAvailable,
}: {
  periodLabel: string;
  syncStart: string;
  syncAvailable: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    syncCurrentStripePeriod,
    initialState
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Stripe Revenue Sync
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Stripe verileri {syncStart} başlangıçlı dönemden itibaren çekilir.
              Aktif dönem: {periodLabel}. Önceki manuel/import edilmiş KPI
              kayıtları değiştirilmez; sync sadece Stripe kaynaklı USD alanlarını
              günceller.
            </p>
          </div>
        </div>

        <form action={formAction}>
          <Button type="submit" disabled={isPending || !syncAvailable}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending
              ? "Senkronize ediliyor..."
              : syncAvailable
                ? "Bu Dönemi Sync Et"
                : "Mayıs Sonrası Açılır"}
          </Button>
        </form>
      </div>

      {!syncAvailable && (
        <div className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            Stripe sync Mayıs dönemine uygulanmaz. İlk aktif dönem 2026-05-25 - 2026-06-25 olacak.
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-4 rounded-lg border border-red-200/80 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{state.error}</p>
        </div>
      )}

      {state.status === "success" && state.data && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <SyncStat label="Dönem" value={state.data.period} />
          <SyncStat label="Brüt Gelir" value={usd(state.data.grossRevenue)} />
          <SyncStat label="Net Gelir" value={usd(state.data.netRevenue)} />
          <SyncStat label="Stripe Fee" value={usd(state.data.fees)} />
          <SyncStat label="Refund" value={usd(state.data.refunds)} />
          <SyncStat label="Charge" value={String(state.data.chargeCount)} />
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
