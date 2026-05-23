"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types";

function textOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createSoftwareExpense(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const name = textOrNull(formData.get("name"));
  const monthlyCost = numberOrNull(formData.get("monthly_cost"));
  const currency = textOrNull(formData.get("currency")) ?? "USD";
  const category = textOrNull(formData.get("category"));

  if (!name || monthlyCost === null || monthlyCost < 0) {
    return { status: "error", error: "Name and monthly cost are required." };
  }

  const { error } = await supabase.from("software_expense_items").upsert(
    {
      user_id: user.id,
      name,
      monthly_cost: monthlyCost,
      currency,
      category,
      is_active: true,
    },
    { onConflict: "user_id,name" }
  );

  if (error) return { status: "error", error: "Failed to save software expense." };

  revalidatePath("/settings");
  return { status: "success", message: "Software expense saved." };
}

export async function deleteSoftwareExpense(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const { error } = await supabase
    .from("software_expense_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { status: "error", error: "Failed to delete software expense." };

  revalidatePath("/settings");
  return { status: "success" };
}
