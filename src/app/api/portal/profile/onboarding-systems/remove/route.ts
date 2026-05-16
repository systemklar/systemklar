import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeOnboardingSystemsFromDb } from "@/lib/current-profile";
import { requireOrganisationOrAdminAccess } from "@/lib/require-monitoring-api";
import { createServiceRoleClient } from "@/lib/supabase-service-role";

export const dynamic = "force-dynamic";

async function getAuthedClient() {
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
  return { client, user };
}

function latestMonitoringBlocksRemove(statusRaw: string | null | undefined): boolean {
  const s = (statusRaw ?? "").toLowerCase().trim();
  return s === "ok" || s === "advarsel" || s === "fejl";
}

/**
 * Fjern ét system fra den indloggede brugers `onboarding_systems`.
 * Tillades ikke hvis seneste overvågningsstatus er ok, advarsel eller fejl.
 */
export async function PATCH(request: Request) {
  const { client, user } = await getAuthedClient();
  if (!user) {
    return NextResponse.json({ error: "Ikke logget ind." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const systemNameRaw = (body as { systemName?: unknown }).systemName;
  const systemName = typeof systemNameRaw === "string" ? systemNameRaw.trim() : "";
  if (!systemName) {
    return NextResponse.json({ error: "Mangler systemName." }, { status: 400 });
  }

  const { data: row, error: selErr } = await client
    .from("profiles")
    .select("onboarding_systems, organisation_id")
    .eq("id", user.id)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 400 });
  }
  if (!row) {
    return NextResponse.json({ error: "Profil ikke fundet." }, { status: 404 });
  }

  const current = normalizeOnboardingSystemsFromDb((row as { onboarding_systems?: unknown }).onboarding_systems);
  if (!current.includes(systemName)) {
    return NextResponse.json({ error: "Systemet er ikke på din liste." }, { status: 400 });
  }

  const orgId = String((row as { organisation_id?: string | null }).organisation_id ?? "").trim();
  if (!orgId) {
    return NextResponse.json({ error: "Organisation ikke fundet." }, { status: 400 });
  }

  const access = await requireOrganisationOrAdminAccess(orgId);
  if (!access.ok) {
    return access.response;
  }

  const admin = createServiceRoleClient();
  if (admin) {
    const { data: monRows, error: monErr } = await admin
      .from("monitoring_results")
      .select("status, checked_at")
      .eq("organisation_id", orgId)
      .eq("system_name", systemName)
      .order("checked_at", { ascending: false })
      .limit(1);

    if (!monErr && monRows?.length) {
      const st = (monRows[0] as { status?: string }).status;
      if (latestMonitoringBlocksRemove(st)) {
        return NextResponse.json(
          {
            error:
              "Dette system kan ikke fjernes her, fordi det har aktiv overvågning. Kontakt os for at fjerne det.",
          },
          { status: 403 },
        );
      }
    }
  }

  const next = current.filter((n) => n !== systemName);
  const { error: upErr } = await client.from("profiles").update({ onboarding_systems: next }).eq("id", user.id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ onboarding_systems: next });
}
