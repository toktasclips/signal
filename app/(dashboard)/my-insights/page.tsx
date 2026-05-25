import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserInsightsClient } from "@/components/analytics/user-insights-client";
import { createClient } from "@/lib/supabase/server";
import type { UserMonthlyInsight } from "@/types";

export const metadata: Metadata = {
  title: "İçgörülerim",
};

export default async function MyInsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("user_monthly_insights")
    .select("id,user_id,month,year,title,category,body,evidence,created_at,updated_at")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          İçgörülerim
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Aylık denemelerini, sahadan gördüğün sinyalleri ve karar notlarını
          kaydet. Quarter assistant bu notları da okuyup daha akıllı yorum yapar.
        </p>
      </div>

      <UserInsightsClient
        insights={((data as UserMonthlyInsight[] | null) ?? [])}
      />
    </div>
  );
}
