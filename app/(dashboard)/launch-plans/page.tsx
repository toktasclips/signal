import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LaunchPlansClient } from "@/components/launch-plans/launch-plans-client";
import type { CampaignCalendarItem } from "@/types";

export const metadata: Metadata = {
  title: "Lansman Planları",
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

export default async function LaunchPlansPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaign_calendar_items")
    .select(
      "id,user_id,title,target_segment,offer,channel,planned_date,end_date,expected_revenue,status,notes,created_at,updated_at"
    )
    .eq("channel", "Platform Launch")
    .ilike("notes", "%Lansman:%")
    .order("planned_date", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Lansman Planları
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          7 veya 14 günlük lansman stratejilerini ayrı planla; gün gün içerik
          akışını oluşturup her günü ayrı bir çalışma sayfasında yaz.
        </p>
      </div>

      <LaunchPlansClient
        launchItems={((data as CampaignCalendarRow[] | null) ?? []).map(
          normalizeItem
        )}
      />
    </div>
  );
}
