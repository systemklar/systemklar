import { createBrowserClient } from "@supabase/ssr";

/**
 * Bruges i client components. Session gemmes i cookies så middleware kan læse den.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
