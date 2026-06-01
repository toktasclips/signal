import { cn } from "@/lib/utils";
import type { SemanticTagName } from "@/types";

const TAG_CONFIG: Record<
  SemanticTagName,
  { label: string; classes: string; group: "objection" | "intent" | "sentiment" }
> = {
  price_objection:    { label: "Price Objection",   classes: "bg-amber-50 text-amber-700 border-amber-200",      group: "objection" },
  timing_objection:  { label: "Timing Objection",  classes: "bg-orange-50 text-orange-700 border-orange-200",    group: "objection" },
  spouse_objection:  { label: "Spouse Objection",  classes: "bg-amber-50 text-amber-700 border-amber-200",       group: "objection" },
  trust_objection:   { label: "Trust Objection",   classes: "bg-rose-50 text-rose-700 border-rose-200",          group: "objection" },
  decision_delay:    { label: "Decision Delay",    classes: "bg-yellow-50 text-yellow-700 border-yellow-200",    group: "objection" },
  high_intent:       { label: "High Intent",       classes: "bg-emerald-50 text-emerald-700 border-emerald-200", group: "intent" },
  warm_interest:     { label: "Warm Interest",     classes: "bg-teal-50 text-teal-700 border-teal-200",          group: "intent" },
  passive_interest:  { label: "Passive Interest",  classes: "bg-slate-50 text-slate-600 border-slate-200",       group: "intent" },
  ghosting_risk:     { label: "Ghosting Risk",     classes: "bg-red-50 text-red-600 border-red-200",             group: "intent" },
  urgent_need:       { label: "Urgent Need",       classes: "bg-green-50 text-green-700 border-green-200",       group: "intent" },
  positive_sentiment: { label: "Positive",         classes: "bg-blue-50 text-blue-700 border-blue-200",          group: "sentiment" },
  neutral_sentiment:  { label: "Neutral",          classes: "bg-slate-50 text-slate-500 border-slate-200",       group: "sentiment" },
  negative_sentiment: { label: "Negative",         classes: "bg-red-50 text-red-600 border-red-200",             group: "sentiment" },
};

export { TAG_CONFIG };

interface SemanticTagBadgeProps {
  tag: SemanticTagName;
  confidence?: number | null;
  className?: string;
}

export function SemanticTagBadge({ tag, confidence, className }: SemanticTagBadgeProps) {
  const cfg = TAG_CONFIG[tag];
  if (!cfg) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.classes,
        className
      )}
    >
      {cfg.label}
      {confidence != null && (
        <span className="opacity-50 text-[10px]">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}
