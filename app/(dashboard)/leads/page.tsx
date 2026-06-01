import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SalesWorkspace } from "@/components/leads/sales-workspace";
import type { Campaign, Lead } from "@/types";

export const metadata: Metadata = {
  title: "Sales",
};

type SalesView = "leads" | "hot-list" | "pipeline";

function normalizeView(view?: string): SalesView {
  if (view === "hot-list" || view === "pipeline") return view;
  return "leads";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data: leads }, { data: campaigns }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("campaigns")
      .select("id, name, type")
      .order("name"),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <SalesWorkspace
        leads={(leads as Lead[]) ?? []}
        campaigns={(campaigns as Campaign[]) ?? []}
        initialView={normalizeView(params?.view)}
      />
    </div>
  );
}
