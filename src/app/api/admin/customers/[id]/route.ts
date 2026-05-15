import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-email";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ugyldigt id." }, { status: 400 });
  }

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
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("[api/admin/customers/[id]] SUPABASE_SERVICE_ROLE_KEY mangler");
    return NextResponse.json({ error: "Serverkonfiguration." }, { status: 500 });
  }

  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("[api/admin/customers/[id]] select", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Kunde ikke fundet." }, { status: 404 });
  }

  // Brugerens auth.uid() gemmes som profiles.user_id eller (ved invite-flow) som profiles.id.
  const userIdRaw = profile.user_id as string | null | undefined;
  const authUserId =
    typeof userIdRaw === "string" && userIdRaw.trim()
      ? userIdRaw.trim()
      : id.trim() || null;

  const { error: profileError } = await admin.from("profiles").delete().eq("id", id);

  if (profileError) {
    console.error("[api/admin/customers/[id]] delete profile", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (authUserId) {
    console.log("[api/admin/customers/[id]] delete auth user attempt", {
      profile_id: id,
      auth_user_id: authUserId,
    });
    const { error: authError } = await admin.auth.admin.deleteUser(authUserId);
    if (authError) {
      const detail = authError.message || "Ukendt fejl";
      console.error("[api/admin/customers/[id]] deleteUser failed", {
        profile_id: id,
        auth_user_id: authUserId,
        detail,
      });
      // Profilen er allerede slettet; returnér 200 for at undgå forvirrende fejl i UI.
      return NextResponse.json({
        ok: true,
        warning: `Auth-brugeren kunne ikke fjernes: ${detail}`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
