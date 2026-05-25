import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaunchPlanItemEditor } from "@/components/launch-plans/launch-plan-item-editor";
import type { CampaignCalendarItem } from "@/types";

export const metadata: Metadata = {
  title: "Lansman İçeriği",
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

function extractLaunchName(item: CampaignCalendarItem): string {
  const match = item.notes?.match(/Lansman:\s*(.+)/);
  return match?.[1]?.split("\n")[0]?.trim() || "Lansman";
}

function extractDayLabel(item: CampaignCalendarItem): string {
  const match = item.notes?.match(/Gün\s+(\d+\/\d+)/);
  return match ? `Gün ${match[1]}` : "Gün";
}

export default async function LaunchPlanItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { data } = await supabase
    .from("campaign_calendar_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("channel", "Platform Launch")
    .single();

  if (!data) notFound();

  const item = normalizeItem(data as CampaignCalendarRow);

  return (
    <LaunchPlanItemEditor
      item={item}
      launchName={extractLaunchName(item)}
      dayLabel={extractDayLabel(item)}
    />
  );
}
