import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadsClient } from "@/components/leads/leads-client";
import type { Lead } from "@/types";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-8 lg:px-10 max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Track and manage every prospect in one clean workspace.
        </p>
      </div>

      <LeadsClient initialLeads={(leads as Lead[]) ?? []} />
    </div>
  );
}
