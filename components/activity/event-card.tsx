import {
  UserPlus,
  Pencil,
  Trophy,
  XCircle,
  ArrowRight,
  Flame,
  Minus,
  Plus,
  CheckCircle2,
  Megaphone,
  Link,
  CalendarClock,
  Flag,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalesEvent } from "@/types";

interface EventConfig {
  icon: React.ElementType;
  iconClass: string;
  badge: string;
  badgeClass: string;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  lead_created: {
    icon: UserPlus,
    iconClass: "text-blue-500 bg-blue-50",
    badge: "Lead",
    badgeClass: "bg-blue-50 text-blue-600",
  },
  lead_updated: {
    icon: Pencil,
    iconClass: "text-slate-500 bg-slate-100",
    badge: "Lead",
    badgeClass: "bg-slate-100 text-slate-600",
  },
  lead_won: {
    icon: Trophy,
    iconClass: "text-emerald-500 bg-emerald-50",
    badge: "Won",
    badgeClass: "bg-emerald-50 text-emerald-600",
  },
  lead_lost: {
    icon: XCircle,
    iconClass: "text-red-500 bg-red-50",
    badge: "Lost",
    badgeClass: "bg-red-50 text-red-600",
  },
  lead_moved_stage: {
    icon: ArrowRight,
    iconClass: "text-blue-500 bg-blue-50",
    badge: "Pipeline",
    badgeClass: "bg-blue-50 text-blue-600",
  },
  lead_hot: {
    icon: Flame,
    iconClass: "text-orange-500 bg-orange-50",
    badge: "Hot",
    badgeClass: "bg-orange-50 text-orange-600",
  },
  lead_removed_hot: {
    icon: Minus,
    iconClass: "text-slate-400 bg-slate-100",
    badge: "Hot List",
    badgeClass: "bg-slate-100 text-slate-500",
  },
  task_created: {
    icon: Plus,
    iconClass: "text-violet-500 bg-violet-50",
    badge: "Task",
    badgeClass: "bg-violet-50 text-violet-600",
  },
  task_completed: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500 bg-emerald-50",
    badge: "Task",
    badgeClass: "bg-emerald-50 text-emerald-600",
  },
  campaign_created: {
    icon: Megaphone,
    iconClass: "text-purple-500 bg-purple-50",
    badge: "Campaign",
    badgeClass: "bg-purple-50 text-purple-600",
  },
  campaign_assigned: {
    icon: Link,
    iconClass: "text-blue-500 bg-blue-50",
    badge: "Campaign",
    badgeClass: "bg-blue-50 text-blue-600",
  },
  followup_scheduled: {
    icon: CalendarClock,
    iconClass: "text-sky-500 bg-sky-50",
    badge: "Follow-up",
    badgeClass: "bg-sky-50 text-sky-600",
  },
  priority_changed: {
    icon: Flag,
    iconClass: "text-amber-500 bg-amber-50",
    badge: "Priority",
    badgeClass: "bg-amber-50 text-amber-600",
  },
};

const FALLBACK: EventConfig = {
  icon: Activity,
  iconClass: "text-muted-foreground bg-muted",
  badge: "Event",
  badgeClass: "bg-muted text-muted-foreground",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

interface EventCardProps {
  event: SalesEvent;
  isLast: boolean;
}

export function EventCard({ event, isLast }: EventCardProps) {
  const config = EVENT_CONFIG[event.type] ?? FALLBACK;
  const Icon = config.icon;

  return (
    <div className="flex gap-4">
      {/* Timeline stem */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
            config.iconClass
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: "1.5rem" }} />
        )}
      </div>

      {/* Content */}
      <div className={cn("pb-5 flex-1 min-w-0", isLast && "pb-0")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">
              {event.title}
            </p>
            {event.description && (
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                config.badgeClass
              )}
            >
              {config.badge}
            </span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {timeAgo(event.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
