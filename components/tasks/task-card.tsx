"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, Pencil, Trash2, RotateCcw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIORITY_CLASSES, PRIORITY_LABELS } from "@/lib/lead-utils";
import { completeTask, deleteTask, reopenTask } from "@/actions/task";
import type { Task, Lead } from "@/types";

const STATUS_CLASSES: Record<string, string> = {
  todo: "bg-muted text-muted-foreground border-transparent",
  in_progress: "bg-blue-50 text-blue-700 border-transparent",
  completed: "bg-emerald-50 text-emerald-700 border-transparent",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Done",
};

interface TaskCardProps {
  task: Task;
  lead?: Lead | null;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, lead, onEdit }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();

  const isCompleted = task.status === "completed";
  const isOverdue =
    !isCompleted &&
    task.due_date !== null &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  const handleComplete = () => {
    startTransition(async () => {
      if (isCompleted) {
        await reopenTask(task.id);
      } else {
        await completeTask(task.id);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTask(task.id);
    });
  };

  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all duration-150 hover:shadow-md",
        isPending && "opacity-50 pointer-events-none",
        isCompleted && "opacity-70"
      )}
    >
      {/* Complete toggle */}
      <button
        onClick={handleComplete}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
        aria-label={isCompleted ? "Reopen task" : "Complete task"}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" style={{ height: "1.125rem", width: "1.125rem" }} />
        ) : (
          <Circle className="h-4.5 w-4.5" style={{ height: "1.125rem", width: "1.125rem" }} />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium text-foreground leading-snug",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>

          {/* Actions */}
          <div
            className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {isCompleted && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleComplete}
                aria-label="Reopen task"
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(task)}
              aria-label="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              aria-label="Delete task"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/8"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Footer meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              PRIORITY_CLASSES[task.priority]
            )}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              STATUS_CLASSES[task.status]
            )}
          >
            {STATUS_LABELS[task.status]}
          </span>
          {formattedDate && (
            <span
              className={cn(
                "text-[11px] font-medium",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}
            >
              {isOverdue ? "Overdue · " : ""}{formattedDate}
            </span>
          )}
          {lead && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Link2 className="h-3 w-3" />
              {lead.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
