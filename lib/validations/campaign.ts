import { z } from "zod";

export const CAMPAIGN_TYPES = [
  "Instagram Ad",
  "Workshop",
  "YouTube",
  "Referral",
  "Organic Content",
  "Webinar",
  "Email",
  "Other",
] as const;

export const campaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  type: z.enum(CAMPAIGN_TYPES),
  source: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => v || null),
  budget: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive("Must be positive").nullable()
  ),
  notes: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const assignLeadSchema = z.object({
  campaign_id: z.string().uuid().nullable(),
});
