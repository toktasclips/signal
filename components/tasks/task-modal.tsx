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
import type { Task } from "@/types";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
}: TaskModalProps) {
  const isEdit = !!task;
  const action = isEdit ? updateTask.bind(null, task.id) : createTask;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this task."
              : "Create a general task for execution, operations or planning."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          action={action}
          defaultValues={task ?? undefined}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
