import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flame, KanbanSquare, Users, CalendarDays, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

const overviewModules = [
  {
    icon: Flame,
    label: "Hot List",
    description: "Track and manage your warmest leads in one focused view.",
    count: null,
    status: "Coming soon",
  },
  {
    icon: KanbanSquare,
    label: "Pipeline",
    description: "Visualize deals moving through each stage of your process.",
    count: null,
    status: "Coming soon",
  },
  {
    icon: Users,
    label: "Contacts",
    description: "A clean database of every prospect and client.",
    count: null,
    status: "Coming soon",
  },
  {
    icon: CalendarDays,
    label: "Calendar",
    description: "Schedule follow-ups and keep track of key touchpoints.",
    count: null,
    status: "Coming soon",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const firstName =
    (user.user_metadata?.full_name as string)?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  return (
    <div className="px-6 py-8 lg:px-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your workspace is ready. Features are being built — check back soon.
        </p>
      </div>

      {/* Modules grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Workspace</h2>
          <Badge variant="secondary" className="text-[11px]">
            Foundation v1
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {overviewModules.map((mod) => (
            <Card
              key={mod.label}
              className="group card-hover cursor-default overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 transition-colors group-hover:bg-primary/12">
                    <mod.icon className="h-4.5 w-4.5 text-primary" style={{ height: "1.125rem", width: "1.125rem" }} />
                  </div>
                  <span className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                    {mod.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="mb-1.5">{mod.label}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {mod.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Activity empty state */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Recent activity</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-4">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No activity yet
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Once you start adding leads and moving deals, your activity will
              appear here.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
