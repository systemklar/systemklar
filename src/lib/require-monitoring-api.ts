import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";

/**
 * Kræver indlogget bruger der enten er admin eller tilhører organisationen.
 */
export async function requireOrganisationOrAdminAccess(
  organisationId: string,
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
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

  if (isAdminEmail(user.email)) {
    return { ok: true, userId: user.id };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organisation_id")
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: error.message }, { status: 400 }),
    };
  }

  const oid = profile?.organisation_id as string | null | undefined;
  if (!oid || oid !== organisationId) {
    return { ok: false, response: NextResponse.json({ error: "Ingen adgang." }, { status: 403 }) };
  }

  return { ok: true, userId: user.id };
}
