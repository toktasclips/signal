import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CampaignsClient } from "@/components/campaigns/campaigns-client";
import type { Campaign, Lead } from "@/types";

export const metadata: Metadata = {
  title: "Campaigns",
};

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: campaigns }, { data: leads }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, name, status, value, campaign_id, temperature, priority")
      .eq("user_id", user.id)
      .not("campaign_id", "is", null),
  ]);

  return (
    <div className="px-6 py-8 lg:px-10 max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Campaigns
        </h1>
        <p className="text-sm text-muted-foreground">
          Track which campaigns generate the highest-quality opportunities and revenue.
        </p>
      </div>

      <CampaignsClient
        campaigns={(campaigns as Campaign[]) ?? []}
        leads={(leads as Lead[]) ?? []}
      />
    </div>
  );
}
