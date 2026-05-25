"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markRelationshipInsightRead(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("relationship_insights")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);
}

export async function dismissRelationshipInsight(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("relationship_insights")
    .update({ is_dismissed: true })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/leads");
}
