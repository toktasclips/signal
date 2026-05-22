"use client";

import { useState, useMemo } from "react";
import { Plus, CheckSquare, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import { TaskModal } from "./task-modal";
import type { Lead, Task } from "@/types";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}

function MetricCard({ label, value, icon, accent }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${accent ?? "bg-primary/8"}`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

interface SectionProps {
  title: string;
  tasks: Task[];
  leadsMap: Map<string, Lead>;
  onEdit: (task: Task) => void;
  accent?: string;
}

function TaskSection({ title, tasks, leadsMap, onEdit, accent }: SectionProps) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        {accent && <div className={`h-2 w-2 rounded-full ${accent}`} />}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">({tasks.length})</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            lead={task.lead_id ? leadsMap.get(task.lead_id) : null}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

interface TasksClientProps {
  tasks: Task[];
  leads: Lead[];
}

export function TasksClient({ tasks, leads }: TasksClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const leadsMap = useMemo(
    () => new Map(leads.map((l) => [l.id, l])),
    [leads]
  );

  const today = new Date(new Date().toDateString());

  const { overdue, dueToday, upcoming, completed } = useMemo(() => {
    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];

    for (const task of tasks) {
      if (task.status === "completed") {
        completed.push(task);
        continue;
      }
      if (!task.due_date) {
        upcoming.push(task);
        continue;
      }
      const d = new Date(task.due_date);
      if (d < today) {
        overdue.push(task);
      } else if (d.getTime() === today.getTime()) {
        dueToday.push(task);
      } else {
        upcoming.push(task);
      }
    }

    // Sort upcoming by due_date ascending
    upcoming.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    // Sort completed by completed_at descending
    completed.sort((a, b) => {
      if (!a.completed_at) return 1;
      if (!b.completed_at) return -1;
      return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
    });

    return { overdue, dueToday, upcoming, completed };
  }, [tasks, today]);

  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedThisWeek = completed.filter(
    (t) => t.completed_at && new Date(t.completed_at) >= weekAgo
  ).length;

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditTask(null);
  };

  const hasAny =
    overdue.length + dueToday.length + upcoming.length + completed.length > 0;

  return (
    <>
      {/* Metrics */}
      {hasAny && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Total Open"
            value={overdue.length + dueToday.length + upcoming.length}
            icon={<CheckSquare className="h-3.5 w-3.5 text-primary" />}
          />
          <MetricCard
            label="Due Today"
            value={dueToday.length}
            icon={<Clock className="h-3.5 w-3.5 text-blue-600" />}
            accent="bg-blue-50"
          />
          <MetricCard
            label="Overdue"
            value={overdue.length}
            icon={<AlertCircle className="h-3.5 w-3.5 text-red-500" />}
            accent="bg-red-50"
          />
          <MetricCard
            label="Done This Week"
            value={completedThisWeek}
            icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
            accent="bg-emerald-50"
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {!hasAny
            ? "No tasks yet"
            : `${overdue.length + dueToday.length + upcoming.length} open task${overdue.length + dueToday.length + upcoming.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditTask(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Sections */}
      {!hasAny ? (
        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center">
          <CheckSquare className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No tasks yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create your first task to start tracking what needs to get done.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditTask(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <TaskSection
            title="Overdue"
            tasks={overdue}
            leadsMap={leadsMap}
            onEdit={handleEdit}
            accent="bg-red-400"
          />
          <TaskSection
            title="Due Today"
            tasks={dueToday}
            leadsMap={leadsMap}
            onEdit={handleEdit}
            accent="bg-blue-400"
          />
          <TaskSection
            title="Upcoming"
            tasks={upcoming}
            leadsMap={leadsMap}
            onEdit={handleEdit}
            accent="bg-primary/60"
          />
          <TaskSection
            title="Completed"
            tasks={completed.slice(0, 20)}
            leadsMap={leadsMap}
            onEdit={handleEdit}
          />
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        task={editTask}
        leads={leads}
      />
    </>
  );
}
