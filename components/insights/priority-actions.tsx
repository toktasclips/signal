import Link from "next/link";
import { AlertCircle, Clock, Flame, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, Task } from "@/types";

type Urgency = "critical" | "warning" | "normal";

interface PriorityAction {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  urgency: Urgency;
}

function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

const URGENCY_ICON: Record<Urgency, React.ReactNode> = {
  critical: <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />,
  warning: <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />,
  normal: <Flame className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />,
};

interface PriorityActionsProps {
  leads: Lead[];
  tasks: Task[];
}

export function PriorityActions({ leads, tasks }: PriorityActionsProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const actions: PriorityAction[] = [];

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

  // Overdue tasks (top 3)
  tasks
    .filter((t) => t.due_date && new Date(t.due_date) < now)
    .sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    )
    .slice(0, 3)
    .forEach((t) =>
      actions.push({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: `Task · Due ${daysAgo(t.due_date!)}`,
        href: "/tasks",
        urgency:
          t.priority === "urgent" || t.priority === "high"
            ? "critical"
            : "warning",
      })
    );

  // Overdue follow-ups (top 2)
  leads
    .filter(
      (l) => l.is_hot && l.follow_up_date && new Date(l.follow_up_date) < today
    )
    .slice(0, 2)
    .forEach((l) =>
      actions.push({
        id: `followup-${l.id}`,
        title: `Follow up with ${l.name}`,
        subtitle: `Hot lead · Due ${daysAgo(l.follow_up_date!)}`,
        href: "/hot-list",
        urgency: "warning",
      })
    );

  // Urgent hot leads without a follow-up date (top 2)
  leads
    .filter((l) => l.is_hot && l.priority === "urgent" && !l.follow_up_date)
    .slice(0, 2)
    .forEach((l) =>
      actions.push({
        id: `urgent-${l.id}`,
        title: l.name,
        subtitle: l.company
          ? `${l.company} · Urgent`
          : "Hot lead · Urgent",
        href: "/hot-list",
        urgency: "critical",
      })
    );

  // Pending offers (top 2)
  leads
    .filter((l) => l.status === "offer_sent")
    .slice(0, 2)
    .forEach((l) =>
      actions.push({
        id: `offer-${l.id}`,
        title: `Offer pending: ${l.name}`,
        subtitle: [l.company, l.value ? `$${l.value.toLocaleString()}` : null]
          .filter(Boolean)
          .join(" · ") || "Follow up on proposal",
        href: "/pipeline",
        urgency: "normal",
      })
    );

  if (actions.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground">Priority Actions</h2>
      <div className="overflow-hidden rounded-xl border border-border divide-y divide-border">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            {URGENCY_ICON[action.urgency]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {action.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {action.subtitle}
              </p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
