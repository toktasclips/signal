import Link from "next/link";
import { CheckSquare, ArrowRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_CLASSES, PRIORITY_LABELS } from "@/lib/lead-utils";
import type { Task } from "@/types";

interface TodayTasksProps {
  tasks: Task[];
}

export function TodayTasks({ tasks }: TodayTasksProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Today&apos;s Tasks</h2>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-6 text-center">
          <p className="text-xs text-muted-foreground">No tasks due today.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {tasks.map((task) => {
            const isOverdue =
              task.due_date !== null &&
              new Date(task.due_date) < new Date(new Date().toDateString());

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
              >
                <Circle
                  className="h-4 w-4 shrink-0 text-muted-foreground/40"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </p>
                  {isOverdue && (
                    <p className="text-[11px] text-red-500 font-medium">Overdue</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                    PRIORITY_CLASSES[task.priority]
                  )}
                >
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
