import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_REDIRECTS = ["/hot-list", "/update-password", "/settings"];

function isSafeRedirect(next: string): boolean {
  return (
    next.startsWith("/") &&
    !next.startsWith("//") &&
    ALLOWED_REDIRECTS.some((allowed) => next === allowed || next.startsWith(allowed + "/"))
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/hot-list";
  const next = isSafeRedirect(nextParam) ? nextParam : "/hot-list";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
