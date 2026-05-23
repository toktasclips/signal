import { Timer, Zap, TrendingUp } from "lucide-react";
import type { PipelineVelocity } from "@/types";

interface PipelineVelocitySectionProps {
  velocity: PipelineVelocity;
}

export function PipelineVelocitySection({ velocity }: PipelineVelocitySectionProps) {
  const metrics = [
    {
      icon: Timer,
      label: "Avg. Days to Close",
      value: `${velocity.avgDays}d`,
      sub: `across ${velocity.totalWon} won deal${velocity.totalWon > 1 ? "s" : ""}`,
    },
    {
      icon: Zap,
      label: "Fastest Close",
      value: velocity.fastestLead ? `${velocity.fastestLead.days}d` : "—",
      sub: velocity.fastestLead?.name ?? "",
    },
    {
      icon: TrendingUp,
      label: "Total Deals Won",
      value: `${velocity.totalWon}`,
      sub: velocity.slowestLead
        ? `Slowest: ${velocity.slowestLead.days}d (${velocity.slowestLead.name})`
        : "",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="group rounded-xl border border-border bg-card px-4 py-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium text-muted-foreground">
              {m.label}
            </span>
            <m.icon className="h-3.5 w-3.5 text-muted-foreground/70" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {m.value}
          </p>
          {m.sub && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{m.sub}</p>
          )}
          <div className="mt-3 flex h-5 items-end gap-1">
            {[35, 52, 45, 68, 58, 76].map((height, index) => (
              <span
                key={index}
                className="w-full rounded-sm bg-primary/15 transition-colors group-hover:bg-primary/25"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
