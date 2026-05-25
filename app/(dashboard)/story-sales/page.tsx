import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StorySalesClient } from "@/components/story-sales/story-sales-client";
import type { CampaignCalendarItem } from "@/types";

export const metadata: Metadata = {
  title: "Hikayeden Satış",
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

export default async function StorySalesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaign_calendar_items")
    .select(
      "id,user_id,title,target_segment,offer,channel,planned_date,end_date,expected_revenue,status,notes,created_at,updated_at"
    )
    .eq("channel", "Story Sales")
    .ilike("notes", "%Hikayeden Satış:%")
    .order("planned_date", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hikayeden Satış
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Instagram story sekanslarını hazır şablonlarla kur; seçtiğin akışı
          story kartlarına dönüştürüp her kartı uzun metin olarak yaz.
        </p>
      </div>

      <StorySalesClient
        storyItems={((data as CampaignCalendarRow[] | null) ?? []).map(
          normalizeItem
        )}
      />
    </div>
  );
}
