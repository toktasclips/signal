import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
  "/auth/callback",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isRootPath = pathname === "/";

  if (!user && !isPublicRoute && !isRootPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (isPublicRoute || isRootPath)) {
    const url = request.nextUrl.clone();
    url.pathname = "/hot-list";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
