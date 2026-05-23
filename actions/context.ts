"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { businessContextSchema } from "@/lib/validations/context";
import type { ActionState } from "@/types";

export async function saveBusinessContext(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = businessContextSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      error: "Invalid input.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { error } = await supabase.from("business_context").upsert(
    { ...parsed.data, user_id: user.id },
    { onConflict: "user_id" }
  );

  if (error) return { status: "error", error: "Failed to save context." };

  revalidatePath("/context");
  revalidatePath("/leads");
  return { status: "success", message: "Business context saved." };
}
