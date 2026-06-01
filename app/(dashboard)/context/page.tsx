import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContextForm } from "@/components/context/context-form";
import type { BusinessContext } from "@/types";

export const metadata: Metadata = { title: "Business Context" };

export default async function ContextPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("business_context")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const context = data as BusinessContext | null;

  return (
    <div className="px-6 py-8 lg:px-10 max-w-3xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Business Context
        </h1>
        <p className="text-sm text-muted-foreground">
          Define your operating profile. Signal uses this to generate personalized
          insights and surface the right intelligence at the right time.
        </p>
      </div>

      <ContextForm context={context} />
    </div>
  );
}
