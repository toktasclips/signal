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
          className="rounded-xl border border-border bg-card p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <m.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">
            {m.value}
          </p>
          {m.sub && (
            <p className="text-xs text-muted-foreground truncate">{m.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
