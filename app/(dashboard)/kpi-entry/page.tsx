import { KpiEntryClient } from "@/components/analytics/kpi-entry-client"
import { getMonthlyMetrics } from "@/lib/analytics/data"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "KPI Girişi" }

export default async function KpiEntryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const metrics = await getMonthlyMetrics(user.id)
  return <KpiEntryClient initialMetrics={metrics} />
}
