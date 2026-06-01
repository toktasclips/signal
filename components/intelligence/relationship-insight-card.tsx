"use client";

import { useTransition } from "react";
import { X, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  markRelationshipInsightRead,
  dismissRelationshipInsight,
} from "@/actions/intelligence";
import type { RelationshipInsight } from "@/types";

const SEVERITY_CONFIG = {
  critical: {
    dot: "bg-red-400",
    card: "border-red-200/60 bg-red-50/20",
    label: "text-red-700",
    badge: "Critical",
    trend: "text-red-600 bg-red-50 border-red-100",
  },
  warning: {
    dot: "bg-amber-400",
    card: "border-amber-200/70 bg-amber-50/20",
    label: "text-amber-700",
    badge: "Warning",
    trend: "text-amber-700 bg-amber-50 border-amber-100",
  },
  success: {
    dot: "bg-emerald-500",
    card: "border-emerald-200/70 bg-emerald-50/20",
    label: "text-emerald-700",
    badge: "Opportunity",
    trend: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  info: {
    dot: "bg-slate-400",
    card: "border-border bg-card",
    label: "text-muted-foreground",
    badge: "Info",
    trend: "text-muted-foreground bg-muted/60 border-border",
  },
} as const;

const CTA_MAP: Record<string, { label: string; href: string }> = {
  stale_hot_lead: { label: "View Hot List", href: "/hot-list" },
  overdue_priority_lead: { label: "View Leads", href: "/leads" },
  pipeline_bottleneck: { label: "View Pipeline", href: "/pipeline" },
  high_performing_campaign: { label: "View Campaigns", href: "/campaigns" },
  high_value_stuck_lead: { label: "View Pipeline", href: "/pipeline" },
  fast_closing_source: { label: "View Leads", href: "/leads" },
  followup_gap: { label: "View Hot List", href: "/hot-list" },
  inactive_pipeline: { label: "View Pipeline", href: "/pipeline" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

interface RelationshipInsightCardProps {
  insight: RelationshipInsight;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}

export function RelationshipInsightCard({
  insight,
  onDismiss,
  onRead,
}: RelationshipInsightCardProps) {
  const [isPending, startTransition] = useTransition();
  const config =
    SEVERITY_CONFIG[insight.severity as keyof typeof SEVERITY_CONFIG] ??
    SEVERITY_CONFIG.info;
  const cta = CTA_MAP[insight.type];

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    onDismiss(insight.id);
    startTransition(() => dismissRelationshipInsight(insight.id));
  }

  function handleClick() {
    if (!insight.is_read) {
      onRead(insight.id);
      startTransition(() => markRelationshipInsightRead(insight.id));
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex min-h-[184px] cursor-default select-none flex-col gap-4 rounded-xl border p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        config.card
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", config.dot)} />
            <span className={cn("text-[10px] font-semibold uppercase text-muted-foreground", config.label)}>
              {config.badge}
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug text-foreground">
            {insight.title}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-md border", config.trend)}>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
          <button
            onClick={handleDismiss}
            disabled={isPending}
            aria-label="Dismiss"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-background hover:text-foreground group-hover:opacity-100 disabled:pointer-events-none"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {insight.description}
      </p>

      {insight.recommendation && (
        <div className="rounded-lg border border-border/80 bg-background/55 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {insight.recommendation}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between">
        {cta ? (
          <a
            href={cta.href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            {cta.label}
            <ArrowRight className="h-3 w-3" />
          </a>
        ) : (
          <span />
        )}
        <span className="text-[11px] text-muted-foreground/60">
          {timeAgo(insight.created_at)}
        </span>
      </div>
    </div>
  );
}
