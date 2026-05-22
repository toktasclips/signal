import { z } from "zod";

export const updateStatusSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "offer_sent", "won", "lost"]),
});

export const markWonSchema = z.object({
  win_note: z
    .string()
    .max(1000)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export const markLostSchema = z.object({
  lost_reason: z
    .string()
    .max(1000)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export const updateValueSchema = z.object({
  value: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive("Must be positive").nullable()
  ),
});
