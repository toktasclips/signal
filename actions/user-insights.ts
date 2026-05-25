"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types";

const userInsightSchema = z.object({
  month: z.preprocess((value) => Number(value), z.number().int().min(1).max(12)),
  year: z.preprocess((value) => Number(value), z.number().int().min(2020).max(2100)),
  title: z.string().min(1, "Başlık gerekli").max(160, "Başlık çok uzun"),
  category: z.string().min(1).max(80),
  body: z.string().min(1, "İçgörü metni gerekli").max(8000, "İçgörü çok uzun"),
  evidence: z
    .string()
    .max(4000, "Kanıt/not çok uzun")
    .optional()
    .nullable()
    .transform((value) => value?.trim() || null),
});

export async function createUserMonthlyInsight(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "error", error: "Unauthorized" };

  const parsed = userInsightSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
    title: formData.get("title"),
    category: formData.get("category") || "general",
    body: formData.get("body"),
    evidence: formData.get("evidence"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.from("user_monthly_insights").insert({
    ...parsed.data,
    user_id: user.id,
  });

  if (error) {
    return {
      status: "error",
      error: `İçgörü kaydedilemedi: ${error.message}`,
    };
  }

  revalidatePath("/my-insights");
  revalidatePath("/quarter-review");
  return { status: "success", message: "İçgörü kaydedildi." };
}
