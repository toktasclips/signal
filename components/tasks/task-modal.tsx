"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import { createTask, updateTask } from "@/actions/task";
import type { Lead, Task } from "@/types";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  leads?: Lead[];
  defaultLeadId?: string;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  leads = [],
  defaultLeadId,
}: TaskModalProps) {
  const isEdit = !!task;
  const action = isEdit ? updateTask.bind(null, task.id) : createTask;

  const defaultValues = task ?? (defaultLeadId ? { lead_id: defaultLeadId } : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this task."
              : "Create a task to track what needs to get done."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          action={action}
          defaultValues={defaultValues as Partial<Task>}
          leads={leads}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
