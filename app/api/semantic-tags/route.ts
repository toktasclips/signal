import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ tags: [] });

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ tags: [] }, { status: 401 });

  const { data } = await supabase
    .from("semantic_tags")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("lead_id", leadId)
    .order("confidence", { ascending: false });

  return NextResponse.json({ tags: data ?? [] });
}
