import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TasksClient } from "@/components/tasks/tasks-client";
import type { Task } from "@/types";

export const metadata: Metadata = {
  title: "Tasks",
};

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tasksRaw } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-8 lg:px-10 max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Track operational work, launches, admin items and execution priorities.
        </p>
      </div>

      <TasksClient
        tasks={(tasksRaw as Task[]) ?? []}
      />
    </div>
  );
}
