import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => v || null);

export const businessContextSchema = z.object({
  business_name: optionalText(100),
  niche: optionalText(100),
  offer_type: optionalText(100),
  sales_model: optionalText(100),
  target_audience: optionalText(200),
  acquisition_channel: optionalText(100),
  average_offer_value: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  sales_cycle: optionalText(100),
  primary_goal: optionalText(200),
  notes: optionalText(1000),
});
