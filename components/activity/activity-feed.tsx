import { Activity } from "lucide-react";
import { EventCard } from "./event-card";
import type { SalesEvent } from "@/types";

interface DayGroup {
  label: string;
  events: SalesEvent[];
}

function groupByDay(events: SalesEvent[]): DayGroup[] {
  const groups = new Map<string, SalesEvent[]>();
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();

  for (const event of events) {
    const key = new Date(event.created_at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }

  return Array.from(groups.entries()).map(([key, evts]) => {
    let label: string;
    if (key === todayStr) label = "Today";
    else if (key === yesterdayStr) label = "Yesterday";
    else
      label = new Date(key).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    return { label, events: evts };
  });
}

interface ActivityFeedProps {
  events: SalesEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">No activity yet</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Your operating history will appear here as you manage leads, tasks, and campaigns.
        </p>
      </div>
    );
  }

  const groups = groupByDay(events);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label} className="space-y-0">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div>
            {group.events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                isLast={i === group.events.length - 1}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
