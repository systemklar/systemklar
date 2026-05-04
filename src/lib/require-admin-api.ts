import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";

/**
 * Kræver indlogget bruger med admin-e-mail (cookie-session).
 * Bruges i API-routes der kalder Supabase med service role.
 */
export async function requireAdminSession(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();

  const supabaseAuth = createServerClient(
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
  } = await supabaseAuth.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Ingen adgang." }, { status: 403 }),
    };
  }

  return { ok: true };
}
