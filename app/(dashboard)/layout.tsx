import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { AuthUser } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email ?? "",
    fullName: user.user_metadata?.full_name as string | undefined,
    avatarUrl: user.user_metadata?.avatar_url as string | undefined,
  };

  return <DashboardShell user={authUser}>{children}</DashboardShell>;
}
