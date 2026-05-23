import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/session";
import { LeadsClient } from "@/components/leads/leads-client";
import type { Campaign, Lead } from "@/types";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login");

  const [{ data: leads }, { data: campaigns }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaigns")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  return (
    <div className="px-6 py-8 lg:px-10 max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Track and manage every prospect in one clean workspace.
        </p>
      </div>

      <LeadsClient
        initialLeads={(leads as Lead[]) ?? []}
        campaigns={(campaigns as Campaign[]) ?? []}
      />
    </div>
  );
}
