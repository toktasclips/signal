import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_CLASSES, PRIORITY_LABELS } from "@/lib/lead-utils";
import type { Lead } from "@/types";

interface TodayHotLeadsProps {
  leads: Lead[];
}

export function TodayHotLeads({ leads }: TodayHotLeadsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold text-foreground">Today&apos;s Hot Leads</h2>
        </div>
        <Link
          href="/hot-list"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-6 text-center">
          <p className="text-xs text-muted-foreground">No follow-ups due today.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {leads.map((lead) => {
            const initials = lead.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={lead.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8 text-[11px] font-semibold text-primary">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                  {lead.quick_note && (
                    <p className="text-xs text-muted-foreground truncate">{lead.quick_note}</p>
                  )}
                </div>
                <span className={cn("shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_CLASSES[lead.priority])}>
                  {PRIORITY_LABELS[lead.priority]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
