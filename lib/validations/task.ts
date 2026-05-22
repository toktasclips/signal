import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => v || null),
  lead_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .transform((v) => v || null),
  status: z.enum(["todo", "in_progress", "completed"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export type TaskInput = z.infer<typeof taskSchema>;
