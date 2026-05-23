import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "@/components/activity/activity-feed";
import type { SalesEvent } from "@/types";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const events = (data ?? []) as SalesEvent[];

  return (
    <div className="px-6 py-8 lg:px-10 max-w-3xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Activity
        </h1>
        <p className="text-sm text-muted-foreground">
          Track every important movement across your sales operating system.
        </p>
      </div>

      <ActivityFeed events={events} />
    </div>
  );
}
