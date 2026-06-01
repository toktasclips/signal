"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { ActionState, Task } from "@/types";

interface TaskFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: Partial<Task>;
  onSuccess: () => void;
}

const initialState: ActionState = { status: "idle" };

export function TaskForm({
  action,
  defaultValues,
  onSuccess,
}: TaskFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await action(prevState, formData);
      if (result.status === "success") onSuccess();
      return result;
    },
    initialState
  );

  const field = (name: string) =>
    state.status === "error" && state.fieldErrors?.[name]
      ? state.fieldErrors[name][0]
      : null;

  const defaultDate = defaultValues?.due_date
    ? new Date(defaultValues.due_date).toISOString().split("T")[0]
    : "";

  return (
    <form action={formAction} className="space-y-4 px-6 pb-2">
      {state.status === "error" && !state.fieldErrors && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Prepare launch checklist"
          defaultValue={defaultValues?.title ?? ""}
          disabled={isPending}
          autoFocus
        />
        {field("title") && (
          <p className="text-xs text-destructive">{field("title")}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Add any notes or context…"
          defaultValue={defaultValues?.description ?? ""}
          disabled={isPending}
          className="h-20"
        />
      </div>

      {/* Priority + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            name="priority"
            defaultValue={defaultValues?.priority ?? "medium"}
            disabled={isPending}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "todo"}
            disabled={isPending}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Done</option>
          </Select>
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <Label htmlFor="due_date">Due Date</Label>
        <Input
          id="due_date"
          name="due_date"
          type="date"
          defaultValue={defaultDate}
          disabled={isPending}
        />
      </div>

      <input type="hidden" name="lead_id" value="" />

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Saving…
            </>
          ) : defaultValues?.id ? (
            "Save changes"
          ) : (
            "Create task"
          )}
        </Button>
      </div>
    </form>
  );
}
