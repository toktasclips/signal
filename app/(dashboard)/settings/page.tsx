import { STRIPE_SYNC_START, getCurrentStripePeriod } from "@/lib/stripe/sync";
import { getCurrentMetaPeriod } from "@/lib/meta/sync";
import { createClient } from "@/lib/supabase/server";
import { StripeSyncCard } from "@/components/settings/stripe-sync-card";
import { MetaAdsSyncCard } from "@/components/settings/meta-ads-sync-card";
import { SoftwareExpensesCard } from "@/components/settings/software-expenses-card";
import type { Metadata } from "next";
import type { SoftwareExpenseItem } from "@/types";

export const metadata: Metadata = { title: "Settings" };

type SoftwareExpenseRow = Omit<SoftwareExpenseItem, "monthly_cost"> & {
  monthly_cost: number | string;
};

function normalizeSoftwareExpense(row: SoftwareExpenseRow): SoftwareExpenseItem {
  return {
    ...row,
    monthly_cost: Number(row.monthly_cost),
  };
}

export default async function SettingsPage() {
  const period = getCurrentStripePeriod();
  const metaPeriod = getCurrentMetaPeriod();
  const syncAvailable = period.periodStart >= STRIPE_SYNC_START;
  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("software_expense_items")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 lg:px-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage integrations and data sync for the operating dashboard.
        </p>
      </div>

      <StripeSyncCard
        periodLabel={`${period.periodStart} - ${period.periodEnd}`}
        syncStart={STRIPE_SYNC_START}
        syncAvailable={syncAvailable}
      />

      <MetaAdsSyncCard
        periodLabel={`${metaPeriod.periodStart} - ${metaPeriod.periodEnd}`}
      />

      <SoftwareExpensesCard
        items={((expenses as SoftwareExpenseRow[] | null) ?? []).map(
          normalizeSoftwareExpense
        )}
      />
    </div>
  );
}
