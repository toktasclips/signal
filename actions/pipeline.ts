"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateStatusSchema,
  markWonSchema,
  markLostSchema,
  updateValueSchema,
} from "@/lib/validations/pipeline";
import type { ActionState, LeadStatus } from "@/types";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = updateStatusSchema.safeParse({ status });
  if (!parsed.success) return { status: "error", error: "Invalid status." };

  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };
  revalidateAll();
  return { status: "success" };
}

export async function markLeadWon(
  id: string,
  win_note?: string | null
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = markWonSchema.safeParse({ win_note });
  if (!parsed.success) return { status: "error", error: "Invalid data." };

  const { error } = await supabase
    .from("leads")
    .update({
      status: "won",
      closed_at: new Date().toISOString(),
      win_note: parsed.data.win_note,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };
  revalidateAll();
  return { status: "success" };
}

export async function markLeadLost(
  id: string,
  lost_reason?: string | null
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = markLostSchema.safeParse({ lost_reason });
  if (!parsed.success) return { status: "error", error: "Invalid data." };

  const { error } = await supabase
    .from("leads")
    .update({
      status: "lost",
      closed_at: new Date().toISOString(),
      lost_reason: parsed.data.lost_reason,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };
  revalidateAll();
  return { status: "success" };
}

export async function updateLeadValue(
  id: string,
  value: number | null
): Promise<ActionState> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = updateValueSchema.safeParse({ value });
  if (!parsed.success) return { status: "error", error: "Invalid value." };

  const { error } = await supabase
    .from("leads")
    .update({ value: parsed.data.value })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to update." };
  revalidateAll();
  return { status: "success" };
}
