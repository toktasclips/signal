"use client";

import { useTransition } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { markInsightRead, dismissInsight } from "@/actions/insight";
import type { Insight } from "@/types";

const SEVERITY_CONFIG = {
  critical: {
    dot: "bg-red-500",
    card: "border-red-200/60 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20",
    label: "text-red-600 dark:text-red-400",
    badge: "Critical",
  },
  warning: {
    dot: "bg-amber-500",
    card: "border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20",
    label: "text-amber-600 dark:text-amber-400",
    badge: "Warning",
  },
  success: {
    dot: "bg-emerald-500",
    card: "border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20",
    label: "text-emerald-600 dark:text-emerald-400",
    badge: "Insight",
  },
  info: {
    dot: "bg-slate-400",
    card: "border-border bg-card",
    label: "text-muted-foreground",
    badge: "Info",
  },
} as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}

export function InsightCard({ insight, onDismiss, onRead }: InsightCardProps) {
  const [isPending, startTransition] = useTransition();
  const config =
    SEVERITY_CONFIG[insight.severity as keyof typeof SEVERITY_CONFIG] ??
    SEVERITY_CONFIG.info;

  const cta = insight.metadata?.cta as
    | { label: string; href: string }
    | undefined;

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    onDismiss(insight.id);
    startTransition(() => dismissInsight(insight.id));
  }

  function handleClick() {
    if (!insight.is_read) {
      onRead(insight.id);
      startTransition(() => markInsightRead(insight.id));
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border p-4 transition-all cursor-default select-none",
        config.card,
        insight.is_read && insight.severity === "info" && "opacity-60"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full flex-shrink-0",
              config.dot
            )}
          />
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider",
              config.label
            )}
          >
            {config.badge}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="Dismiss"
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-all hover:text-foreground group-hover:opacity-100 disabled:pointer-events-none"
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

      {/* Footer */}
      <div className="flex items-center justify-between">
        {cta ? (
          <Link
            href={cta.href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            {cta.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
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
