import { createClient } from "@/lib/supabase/server";

interface TrackEventParams {
  userId: string;
  type: string;
  title: string;
  description?: string | null;
  leadId?: string | null;
  taskId?: string | null;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("events").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      description: params.description ?? null,
      lead_id: params.leadId ?? null,
      task_id: params.taskId ?? null,
      campaign_id: params.campaignId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch {
    // Never fail the parent action due to event tracking
  }
}
