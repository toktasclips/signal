import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/session";
import { HotListClient } from "@/components/hot-list/hot-list-client";
import type { Lead } from "@/types";

export const metadata: Metadata = {
  title: "Hot List",
};

export default async function HotListPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const { data: hotLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_hot", true)
    .order("priority", { ascending: false })
    .order("follow_up_date", { ascending: true, nullsFirst: false });

  const todayLeads = (hotLeads as Lead[] ?? []).filter(
    (l) => l.follow_up_date && l.follow_up_date <= today
  );

  return (
    <div className="px-6 py-8 lg:px-10 max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Hot List</h1>
        <p className="text-sm text-muted-foreground">
          Your highest-priority prospects, organized for daily follow-up.
        </p>
      </div>

      <HotListClient
        hotLeads={(hotLeads as Lead[]) ?? []}
        todayLeads={todayLeads}
      />
    </div>
  );
}
