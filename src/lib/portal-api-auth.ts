import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type PortalAuthed = {
  client: SupabaseClient;
  user: User;
  organisationId: string;
};

export async function getPortalAuthed(): Promise<PortalAuthed | null> {
  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* ignore */
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("organisation_id")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  const organisationId = (profile?.organisation_id as string | null | undefined)?.trim();
  if (!organisationId) return null;

  return { client, user, organisationId };
}
