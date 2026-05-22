import { z } from "zod";

const optStr = (max: number) =>
  z.string().max(max).optional().nullable().transform((v) => v || null);

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  company: optStr(200),
  email: z
    .union([z.string().email("Invalid email address"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => v || null),
  phone: optStr(50),
  source: optStr(100),
  status: z.enum(["new", "contacted", "qualified", "offer_sent", "won", "lost"]),
  temperature: z.enum(["cold", "warm", "hot", "ready"]),
  value: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive("Must be a positive number").nullable()
  ),
  notes: optStr(5000),
  last_contacted_at: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export type LeadInput = z.infer<typeof leadSchema>;
