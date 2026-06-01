import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaunchPlanItemEditor } from "@/components/launch-plans/launch-plan-item-editor";
import type { CampaignCalendarItem } from "@/types";

export const metadata: Metadata = {
  title: "Story İçeriği",
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

function extractStoryName(item: CampaignCalendarItem): string {
  const match = item.notes?.match(/Hikayeden Satış:\s*(.+)/);
  return match?.[1]?.split("\n")[0]?.trim() || "Hikayeden Satış";
}

function extractStoryLabel(item: CampaignCalendarItem): string {
  const match = item.notes?.match(/Story\s+(\d+\/\d+)/);
  return match ? `Story ${match[1]}` : "Story";
}

export default async function StorySalesItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const { id } = await params;
  const { data } = await supabase
    .from("campaign_calendar_items")
    .select(
      "id,user_id,title,target_segment,offer,channel,planned_date,end_date,expected_revenue,status,notes,created_at,updated_at"
    )
    .eq("id", id)
    .eq("channel", "Story Sales")
    .single();

  if (!data) notFound();

  const item = normalizeItem(data as CampaignCalendarRow);

  return (
    <LaunchPlanItemEditor
      item={item}
      launchName={extractStoryName(item)}
      dayLabel={extractStoryLabel(item)}
      mode="story"
    />
  );
}
