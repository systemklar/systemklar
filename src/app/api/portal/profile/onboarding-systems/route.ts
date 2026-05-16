import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeOnboardingSystemsFromDb } from "@/lib/current-profile";
import { ALL_ONBOARDING_SYSTEMS } from "@/lib/onboarding-systems";

export const dynamic = "force-dynamic";

const ALLOWED_NAMES = new Set(ALL_ONBOARDING_SYSTEMS.map((s) => s.name));

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

/**
 * Tilføj ét onboarding-system til den indloggede brugers profil (`onboarding_systems` append).
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
  if (!ALLOWED_NAMES.has(systemName)) {
    return NextResponse.json({ error: "Ukendt system." }, { status: 400 });
  }

  const { data: row, error: selErr } = await client
    .from("profiles")
    .select("onboarding_systems")
    .eq("id", user.id)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 400 });
  }
  if (!row) {
    return NextResponse.json({ error: "Profil ikke fundet." }, { status: 404 });
  }

  const current = normalizeOnboardingSystemsFromDb((row as { onboarding_systems?: unknown }).onboarding_systems);
  if (current.includes(systemName)) {
    return NextResponse.json({ onboarding_systems: current });
  }

  const next = [...current, systemName];
  const { error: upErr } = await client.from("profiles").update({ onboarding_systems: next }).eq("id", user.id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ onboarding_systems: next });
}
