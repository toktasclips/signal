"use client";

import { useTransition } from "react";
import { X, ArrowRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  markRelationshipInsightRead,
  dismissRelationshipInsight,
} from "@/actions/intelligence";
import type { RelationshipInsight } from "@/types";

const SEVERITY_CONFIG = {
  critical: {
    dot: "bg-red-500",
    card: "border-red-200/60 bg-red-50/30",
    label: "text-red-600",
    badge: "Critical",
    rec: "bg-red-50 border-red-100 text-red-700",
  },
  warning: {
    dot: "bg-amber-500",
    card: "border-amber-200/60 bg-amber-50/30",
    label: "text-amber-600",
    badge: "Warning",
    rec: "bg-amber-50 border-amber-100 text-amber-700",
  },
  success: {
    dot: "bg-emerald-500",
    card: "border-emerald-200/60 bg-emerald-50/30",
    label: "text-emerald-600",
    badge: "Opportunity",
    rec: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
  info: {
    dot: "bg-slate-400",
    card: "border-border bg-card",
    label: "text-muted-foreground",
    badge: "Info",
    rec: "bg-muted border-border text-muted-foreground",
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
        "group relative flex flex-col gap-3 rounded-xl border p-4 transition-all cursor-default select-none",
        config.card
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", config.dot)} />
          <span className={cn("text-[11px] font-semibold uppercase tracking-wider", config.label)}>
            {config.badge}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="Dismiss"
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all hover:text-foreground group-hover:opacity-100 disabled:pointer-events-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <p className="text-sm font-medium leading-snug text-foreground">
          {insight.title}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {insight.description}
        </p>
      </div>

      {/* Recommendation */}
      {insight.recommendation && (
        <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2", config.rec)}>
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p className="text-xs leading-relaxed">{insight.recommendation}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {cta ? (
          <a
            href={cta.href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors"
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
