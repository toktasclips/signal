import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignCalendarClient } from "@/components/campaign-calendar/campaign-calendar-client";
import type { CampaignCalendarItem } from "@/types";

export const metadata: Metadata = {
  title: "Kampanya Takvimi",
};

type CampaignCalendarRow = Omit<CampaignCalendarItem, "expected_revenue"> & {
  expected_revenue: number | string | null;
};

function normalizeItem(row: CampaignCalendarRow): CampaignCalendarItem {
  return {
    ...row,
    expected_revenue:
      row.expected_revenue === null || row.expected_revenue === undefined
        ? null
        : Number(row.expected_revenue),
  };
}

export default async function CampaignCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("campaign_calendar_items")
    .select("*")
    .eq("user_id", user.id)
    .order("planned_date", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 lg:px-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Kampanya Takvimi
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Gelir getirecek upsell, lansman, abonelik ve teklif hamlelerini planla;
          hangi tarihte kime ne sunulacağını tek yerden takip et.
        </p>
      </div>

      <CampaignCalendarClient
        items={((data as CampaignCalendarRow[] | null) ?? []).map(normalizeItem)}
      />
    </div>
  );
}
