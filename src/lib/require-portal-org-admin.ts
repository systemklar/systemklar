import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type PortalOrgAdminSession = {
  userId: string;
  profileId: string;
  organisationId: string;
  supabase: ReturnType<typeof createServerClient>;
};

export async function requirePortalOrgAdmin(): Promise<
  | { ok: true; session: PortalOrgAdminSession }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* ignore */
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Ikke logget ind." }, { status: 401 }) };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, organisation_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.organisation_id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profil ikke fundet." }, { status: 403 }),
    };
  }

  if (profile.role !== "org_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Kun administratorer har adgang." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    session: {
      userId: user.id,
      profileId: profile.id as string,
      organisationId: profile.organisation_id as string,
      supabase,
    },
  };
}
