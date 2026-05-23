import { createClient } from "./server";

/**
 * Returns the current user from the session cookie without a network round-trip.
 * Safe to use inside dashboard pages — the layout already validates via getUser().
 */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}
