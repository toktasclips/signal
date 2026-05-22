import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "@/components/tasks/tasks-client";
import type { Lead, Task } from "@/types";

export const metadata: Metadata = {
  title: "Tasks",
};

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tasksRaw }, { data: leadsRaw }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id, name, company")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="px-6 py-8 lg:px-10 max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Track what needs to get done today and this week.
        </p>
      </div>

      <TasksClient
        tasks={(tasksRaw as Task[]) ?? []}
        leads={(leadsRaw as Lead[]) ?? []}
      />
    </div>
  );
}
