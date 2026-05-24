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

export const CAMPAIGN_CALENDAR_CHANNELS = [
  "Internal Upsell",
  "Email",
  "WhatsApp",
  "Instagram",
  "YouTube",
  "Webinar",
  "Platform Launch",
  "Referral",
  "Other",
] as const;

export const CAMPAIGN_CALENDAR_STATUSES = [
  "planned",
  "in_progress",
  "sent",
  "won",
  "lost",
  "paused",
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

export const campaignCalendarItemSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(180, "Title too long"),
    target_segment: z
      .string()
      .min(1, "Target segment is required")
      .max(180, "Target segment too long"),
    offer: z.string().min(1, "Offer is required").max(1000, "Offer too long"),
    channel: z.enum(CAMPAIGN_CALENDAR_CHANNELS),
    planned_date: z.string().min(1, "Planned date is required"),
    end_date: z
      .string()
      .optional()
      .nullable()
      .transform((v) => v || null),
    expected_revenue: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
      z.number().positive("Must be positive").nullable()
    ),
    status: z.enum(CAMPAIGN_CALENDAR_STATUSES),
    notes: z
      .string()
      .max(2000)
      .optional()
      .nullable()
      .transform((v) => v || null),
  })
  .refine(
    (data) => !data.end_date || data.end_date >= data.planned_date,
    {
      message: "End date must be after planned date",
      path: ["end_date"],
    }
  );

export type CampaignCalendarItemInput = z.infer<typeof campaignCalendarItemSchema>;

export const campaignLaunchPlanItemSchema = z.object({
  day: z.number().int().min(1).max(14),
  title: z.string().min(1, "Title is required").max(180, "Title too long"),
  offer: z.string().min(1, "Offer is required").max(1000, "Offer too long"),
  notes: z.string().max(2000).optional().nullable().transform((v) => v || null),
  expected_revenue: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive("Must be positive").nullable()
  ),
});

export const campaignLaunchPlanSchema = z.object({
  launch_name: z.string().min(1, "Launch name is required").max(120, "Launch name too long"),
  duration: z.preprocess(
    (v) => Number(v),
    z.union([z.literal(7), z.literal(14)])
  ),
  start_date: z.string().min(1, "Start date is required"),
  target_segment: z
    .string()
    .min(1, "Target segment is required")
    .max(180, "Target segment too long"),
  channel: z.enum(CAMPAIGN_CALENDAR_CHANNELS),
  items: z
    .array(campaignLaunchPlanItemSchema)
    .min(7)
    .max(14),
});

export type CampaignLaunchPlanInput = z.infer<typeof campaignLaunchPlanSchema>;
